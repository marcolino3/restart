/**
 * Idempotent backfill of EN/FR/IT translations for curricula, curriculum levels
 * and curriculum nodes.
 *
 * Strategy:
 *   1. PHRASE_MAP: exact-phrase mapping for canonical Montessori terms
 *      (areas, levels, common topic headings).
 *   2. WORD_MAP: per-word mapping. If the phrase isn't a direct hit, every
 *      known word is translated and unknown words are kept as-is. Numbers,
 *      roman numerals and punctuation are preserved.
 *   3. Fallback: if nothing matches, the DE text is copied so the UI always
 *      has something to show.
 *
 * Run with:
 *   cd apps/backend
 *   npx ts-node -T scripts/backfill-curriculum-translations.ts          # insert missing only
 *   npx ts-node -T scripts/backfill-curriculum-translations.ts --update # also re-translate rows whose EN/FR/IT == DE
 *   npx ts-node -T scripts/backfill-curriculum-translations.ts --force  # always re-translate every non-DE row from the DE master
 *
 * Safe to re-run.
 */
import { Client } from 'pg';
import { randomUUID } from 'crypto';

const DB = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'restart',
};

const UPDATE_MODE = process.argv.includes('--update') || process.argv.includes('--force');
const FORCE_MODE = process.argv.includes('--force');

type Locale = 'EN' | 'FR' | 'IT';
const TARGET_LOCALES: Locale[] = ['EN', 'FR', 'IT'];

/** Whole-phrase mapping (after normalisation). */
const PHRASE_MAP: Record<string, Record<Locale, string>> = {
  // ── Areas ────────────────────────────────────────────────────────────
  'mathematik': { EN: 'Mathematics', FR: 'Mathématiques', IT: 'Matematica' },
  'sprache': { EN: 'Language', FR: 'Langage', IT: 'Linguaggio' },
  'sprachen': { EN: 'Languages', FR: 'Langues', IT: 'Lingue' },
  'sinnesmaterial': { EN: 'Sensorial', FR: 'Matériel sensoriel', IT: 'Materiale sensoriale' },
  'übungen des praktischen lebens': { EN: 'Practical Life', FR: 'Vie pratique', IT: 'Vita pratica' },
  'übungen des täglichen lebens': { EN: 'Practical Life', FR: 'Vie pratique', IT: 'Vita pratica' },
  'praktisches leben': { EN: 'Practical Life', FR: 'Vie pratique', IT: 'Vita pratica' },
  'biologie': { EN: 'Biology', FR: 'Biologie', IT: 'Biologia' },
  'botanik': { EN: 'Botany', FR: 'Botanique', IT: 'Botanica' },
  'zoologie': { EN: 'Zoology', FR: 'Zoologie', IT: 'Zoologia' },
  'geografie': { EN: 'Geography', FR: 'Géographie', IT: 'Geografia' },
  'geographie': { EN: 'Geography', FR: 'Géographie', IT: 'Geografia' },
  'geometrie': { EN: 'Geometry', FR: 'Géométrie', IT: 'Geometria' },
  'geomertrie': { EN: 'Geometry', FR: 'Géométrie', IT: 'Geometria' },
  'geschichte': { EN: 'History', FR: 'Histoire', IT: 'Storia' },
  'kunst': { EN: 'Art', FR: 'Art', IT: 'Arte' },
  'musik': { EN: 'Music', FR: 'Musique', IT: 'Musica' },
  'naturwissenschaften': { EN: 'Sciences', FR: 'Sciences', IT: 'Scienze' },
  'naturwissenschaft': { EN: 'Science', FR: 'Science', IT: 'Scienza' },
  'physik': { EN: 'Physics', FR: 'Physique', IT: 'Fisica' },
  'chemie': { EN: 'Chemistry', FR: 'Chimie', IT: 'Chimica' },
  'kosmische erziehung': { EN: 'Cosmic Education', FR: 'Éducation cosmique', IT: 'Educazione cosmica' },

  // ── Levels ───────────────────────────────────────────────────────────
  'vorschule': { EN: 'Pre-school', FR: 'Maternelle', IT: 'Scuola materna' },
  'kindergarten': { EN: 'Kindergarten', FR: 'Maternelle', IT: 'Scuola dell\'infanzia' },
  'kinderhaus': { EN: "Children's House", FR: 'Maison des enfants', IT: 'Casa dei bambini' },
  'primarschule': { EN: 'Primary School', FR: 'École primaire', IT: 'Scuola primaria' },
  'primarstufe': { EN: 'Primary', FR: 'Primaire', IT: 'Primaria' },
  'unterstufe': { EN: 'Lower Primary', FR: 'Cycle inférieur', IT: 'Primaria inferiore' },
  'mittelstufe': { EN: 'Middle Primary', FR: 'Cycle moyen', IT: 'Primaria intermedia' },
  'oberstufe': { EN: 'Upper Level', FR: 'Cycle supérieur', IT: 'Ciclo superiore' },
  'sekundarstufe': { EN: 'Secondary', FR: 'Secondaire', IT: 'Secondaria' },
  'sekundarstufe i': { EN: 'Secondary I', FR: 'Secondaire I', IT: 'Secondaria I' },
  'sekundarstufe ii': { EN: 'Secondary II', FR: 'Secondaire II', IT: 'Secondaria II' },
  'gymnasium': { EN: 'Gymnasium', FR: 'Gymnase', IT: 'Liceo' },

  // ── Common multi-word phrases seen in the data ───────────────────────
  '3-stufenlektion': { EN: 'Three-Period Lesson', FR: 'Leçon en trois temps', IT: 'Lezione in tre tempi' },
  '100-kette': { EN: '100-Chain', FR: 'Chaîne de 100', IT: 'Catena del 100' },
  '1000-kette': { EN: '1000-Chain', FR: 'Chaîne de 1000', IT: 'Catena del 1000' },
  'goldenes perlenmaterial': { EN: 'Golden Bead Material', FR: 'Matériel des perles dorées', IT: 'Materiale delle perle dorate' },
  'kleiner rechenrahmen': { EN: 'Small Bead Frame', FR: 'Petit cadre des perles', IT: 'Piccolo telaio delle perle' },
  'grosser rechenrahmen': { EN: 'Large Bead Frame', FR: 'Grand cadre des perles', IT: 'Grande telaio delle perle' },
  'beweglichen alphabet': { EN: 'Movable Alphabet', FR: 'Alphabet mobile', IT: 'Alfabeto mobile' },
  'séguin-tafeln': { EN: 'Séguin Boards', FR: 'Tables de Séguin', IT: 'Tavole di Séguin' },
  'séguin-tafeln????': { EN: 'Séguin Boards', FR: 'Tables de Séguin', IT: 'Tavole di Séguin' },
  'zylinderblock': { EN: 'Cylinder Block', FR: 'Bloc des cylindres', IT: 'Blocco dei cilindri' },
  'rote stangen': { EN: 'Red Rods', FR: 'Barres rouges', IT: 'Aste rosse' },
  'rosa turm': { EN: 'Pink Tower', FR: 'Tour rose', IT: 'Torre rosa' },
  'braune treppe': { EN: 'Brown Stair', FR: 'Escalier marron', IT: 'Scala marrone' },
  'sandpapierbuchstaben': { EN: 'Sandpaper Letters', FR: 'Lettres rugueuses', IT: 'Lettere smerigliate' },
  'sandpaper letters': { EN: 'Sandpaper Letters', FR: 'Lettres rugueuses', IT: 'Lettere smerigliate' },
  '3-letter words': { EN: '3-letter words', FR: 'Mots de 3 lettres', IT: 'Parole di 3 lettere' },
  'sprachgeschichte': { EN: 'History of Language', FR: 'Histoire de la langue', IT: 'Storia della lingua' },
  'naturgeschichte': { EN: 'Natural History', FR: 'Histoire naturelle', IT: 'Storia naturale' },
  'menschheitsgeschichte': { EN: 'History of Humanity', FR: 'Histoire de l\'humanité', IT: 'Storia dell\'umanità' },
  'zeitleiste des menschen': { EN: 'Timeline of Humans', FR: 'Frise chronologique de l\'homme', IT: 'Linea del tempo dell\'uomo' },
  'zeitleiste vom leben': { EN: 'Timeline of Life', FR: 'Frise chronologique de la vie', IT: 'Linea del tempo della vita' },
  'französische revolution': { EN: 'French Revolution', FR: 'Révolution française', IT: 'Rivoluzione francese' },
  'aufklärung': { EN: 'Enlightenment', FR: 'Lumières', IT: 'Illuminismo' },
  'azteken': { EN: 'Aztecs', FR: 'Aztèques', IT: 'Aztechi' },
  'asien': { EN: 'Asia', FR: 'Asie', IT: 'Asia' },
  'afrika': { EN: 'Africa', FR: 'Afrique', IT: 'Africa' },
  'australien': { EN: 'Australia', FR: 'Australie', IT: 'Australia' },
  'europa': { EN: 'Europe', FR: 'Europe', IT: 'Europa' },
  'nordamerika': { EN: 'North America', FR: 'Amérique du Nord', IT: 'America del Nord' },
  'südamerika': { EN: 'South America', FR: 'Amérique du Sud', IT: 'America del Sud' },
  'schweiz': { EN: 'Switzerland', FR: 'Suisse', IT: 'Svizzera' },
};

/** Per-word mapping (keys are lowercase). Applied when PHRASE_MAP misses. */
const WORD_MAP: Record<string, Record<Locale, string>> = {
  // ── Articles / function words ────────────────────────────────────────
  'der': { EN: 'the', FR: 'du', IT: 'del' },
  'die': { EN: 'the', FR: 'la', IT: 'la' },
  'das': { EN: 'the', FR: 'le', IT: 'il' },
  'den': { EN: 'the', FR: 'des', IT: 'dei' },
  'dem': { EN: 'the', FR: 'au', IT: 'al' },
  'des': { EN: 'of the', FR: 'du', IT: 'del' },
  'ein': { EN: 'a', FR: 'un', IT: 'un' },
  'eine': { EN: 'a', FR: 'une', IT: 'una' },
  'einer': { EN: 'a', FR: 'une', IT: 'di una' },
  'eines': { EN: 'of a', FR: 'd\'un', IT: 'di un' },
  'und': { EN: 'and', FR: 'et', IT: 'e' },
  'oder': { EN: 'or', FR: 'ou', IT: 'o' },
  'mit': { EN: 'with', FR: 'avec', IT: 'con' },
  'ohne': { EN: 'without', FR: 'sans', IT: 'senza' },
  'von': { EN: 'of', FR: 'de', IT: 'di' },
  'vom': { EN: 'of the', FR: 'du', IT: 'del' },
  'zu': { EN: 'to', FR: 'à', IT: 'a' },
  'zur': { EN: 'to the', FR: 'au', IT: 'al' },
  'zum': { EN: 'to the', FR: 'au', IT: 'al' },
  'durch': { EN: 'by', FR: 'par', IT: 'tramite' },
  'auf': { EN: 'on', FR: 'sur', IT: 'su' },
  'an': { EN: 'on', FR: 'à', IT: 'a' },
  'in': { EN: 'in', FR: 'en', IT: 'in' },
  'im': { EN: 'in the', FR: 'dans le', IT: 'nel' },
  'aus': { EN: 'from', FR: 'de', IT: 'da' },
  'für': { EN: 'for', FR: 'pour', IT: 'per' },
  'als': { EN: 'as', FR: 'comme', IT: 'come' },
  'bis': { EN: 'up to', FR: 'jusqu\'à', IT: 'fino a' },
  'auch': { EN: 'also', FR: 'aussi', IT: 'anche' },
  'zwischen': { EN: 'between', FR: 'entre', IT: 'tra' },
  'gegen': { EN: 'against', FR: 'contre', IT: 'contro' },
  'nach': { EN: 'after', FR: 'après', IT: 'dopo' },
  'vor': { EN: 'before', FR: 'avant', IT: 'prima' },
  'über': { EN: 'about', FR: 'sur', IT: 'su' },
  'unter': { EN: 'under', FR: 'sous', IT: 'sotto' },

  // Numerals (cardinal)
  'eins': { EN: 'one', FR: 'un', IT: 'uno' },
  'zwei': { EN: 'two', FR: 'deux', IT: 'due' },
  'drei': { EN: 'three', FR: 'trois', IT: 'tre' },
  'vier': { EN: 'four', FR: 'quatre', IT: 'quattro' },
  'fünf': { EN: 'five', FR: 'cinq', IT: 'cinque' },
  'sechs': { EN: 'six', FR: 'six', IT: 'sei' },
  'sieben': { EN: 'seven', FR: 'sept', IT: 'sette' },
  'acht': { EN: 'eight', FR: 'huit', IT: 'otto' },
  'neun': { EN: 'nine', FR: 'neuf', IT: 'nove' },
  'zehn': { EN: 'ten', FR: 'dix', IT: 'dieci' },
  'hundert': { EN: 'hundred', FR: 'cent', IT: 'cento' },
  'tausend': { EN: 'thousand', FR: 'mille', IT: 'mille' },

  // ── Maths ────────────────────────────────────────────────────────────
  'addition': { EN: 'Addition', FR: 'Addition', IT: 'Addizione' },
  'subtraktion': { EN: 'Subtraction', FR: 'Soustraction', IT: 'Sottrazione' },
  'multiplikation': { EN: 'Multiplication', FR: 'Multiplication', IT: 'Moltiplicazione' },
  'division': { EN: 'Division', FR: 'Division', IT: 'Divisione' },
  'arithmetik': { EN: 'Arithmetic', FR: 'Arithmétique', IT: 'Aritmetica' },
  'algebra': { EN: 'Algebra', FR: 'Algèbre', IT: 'Algebra' },
  'rechnen': { EN: 'Arithmetic', FR: 'Calcul', IT: 'Calcolo' },
  'rechnung': { EN: 'Calculation', FR: 'Calcul', IT: 'Calcolo' },
  'rechenrahmen': { EN: 'Bead Frame', FR: 'Cadre des perles', IT: 'Telaio delle perle' },
  'dezimalbrett': { EN: 'Decimal Board', FR: 'Tableau décimal', IT: 'Tavola decimale' },
  'dezimalsystem': { EN: 'Decimal System', FR: 'Système décimal', IT: 'Sistema decimale' },
  'dezimalbrüche': { EN: 'Decimal Fractions', FR: 'Fractions décimales', IT: 'Frazioni decimali' },
  'bruch': { EN: 'Fraction', FR: 'Fraction', IT: 'Frazione' },
  'brüche': { EN: 'Fractions', FR: 'Fractions', IT: 'Frazioni' },
  'nenner': { EN: 'Denominator', FR: 'Dénominateur', IT: 'Denominatore' },
  'zähler': { EN: 'Numerator', FR: 'Numérateur', IT: 'Numeratore' },
  'zahl': { EN: 'Number', FR: 'Nombre', IT: 'Numero' },
  'zahlen': { EN: 'Numbers', FR: 'Nombres', IT: 'Numeri' },
  'menge': { EN: 'Quantity', FR: 'Quantité', IT: 'Quantità' },
  'mengen': { EN: 'Quantities', FR: 'Quantités', IT: 'Quantità' },
  'summand': { EN: 'Addend', FR: 'Terme', IT: 'Addendo' },
  'summanden': { EN: 'Addends', FR: 'Termes', IT: 'Addendi' },
  'summe': { EN: 'Sum', FR: 'Somme', IT: 'Somma' },
  'differenz': { EN: 'Difference', FR: 'Différence', IT: 'Differenza' },
  'produkt': { EN: 'Product', FR: 'Produit', IT: 'Prodotto' },
  'quotient': { EN: 'Quotient', FR: 'Quotient', IT: 'Quoziente' },
  'rest': { EN: 'Remainder', FR: 'Reste', IT: 'Resto' },
  'divisor': { EN: 'Divisor', FR: 'Diviseur', IT: 'Divisore' },
  'multiplikator': { EN: 'Multiplier', FR: 'Multiplicateur', IT: 'Moltiplicatore' },
  'multiplikand': { EN: 'Multiplicand', FR: 'Multiplicande', IT: 'Moltiplicando' },
  'faktor': { EN: 'Factor', FR: 'Facteur', IT: 'Fattore' },
  'faktoren': { EN: 'Factors', FR: 'Facteurs', IT: 'Fattori' },
  'primfaktor': { EN: 'Prime Factor', FR: 'Facteur premier', IT: 'Fattore primo' },
  'primfaktoren': { EN: 'Prime Factors', FR: 'Facteurs premiers', IT: 'Fattori primi' },
  'primzahl': { EN: 'Prime Number', FR: 'Nombre premier', IT: 'Numero primo' },
  'primzahlen': { EN: 'Prime Numbers', FR: 'Nombres premiers', IT: 'Numeri primi' },
  'teiler': { EN: 'Divisor', FR: 'Diviseur', IT: 'Divisore' },
  'teilbarkeit': { EN: 'Divisibility', FR: 'Divisibilité', IT: 'Divisibilità' },
  'vielfache': { EN: 'Multiples', FR: 'Multiples', IT: 'Multipli' },
  'kgv': { EN: 'LCM', FR: 'PPCM', IT: 'mcm' },
  'ggt': { EN: 'GCD', FR: 'PGCD', IT: 'MCD' },
  'quadrat': { EN: 'Square', FR: 'Carré', IT: 'Quadrato' },
  'quadrate': { EN: 'Squares', FR: 'Carrés', IT: 'Quadrati' },
  'kubus': { EN: 'Cube', FR: 'Cube', IT: 'Cubo' },
  'kuben': { EN: 'Cubes', FR: 'Cubes', IT: 'Cubi' },
  'kubikzahlen': { EN: 'Cube Numbers', FR: 'Nombres cubiques', IT: 'Numeri cubici' },
  'quadratzahlen': { EN: 'Square Numbers', FR: 'Nombres carrés', IT: 'Numeri quadrati' },
  'wurzel': { EN: 'Root', FR: 'Racine', IT: 'Radice' },
  'wurzeln': { EN: 'Roots', FR: 'Racines', IT: 'Radici' },
  'quadrieren': { EN: 'Squaring', FR: 'Élévation au carré', IT: 'Elevazione al quadrato' },
  'kubieren': { EN: 'Cubing', FR: 'Élévation au cube', IT: 'Elevazione al cubo' },
  'potenz': { EN: 'Power', FR: 'Puissance', IT: 'Potenza' },
  'potenzen': { EN: 'Powers', FR: 'Puissances', IT: 'Potenze' },
  'binom': { EN: 'Binomial', FR: 'Binôme', IT: 'Binomio' },
  'binoms': { EN: 'binomial', FR: 'binôme', IT: 'binomio' },
  'trinom': { EN: 'Trinomial', FR: 'Trinôme', IT: 'Trinomio' },
  'trinoms': { EN: 'trinomial', FR: 'trinôme', IT: 'trinomio' },
  'gleichung': { EN: 'Equation', FR: 'Équation', IT: 'Equazione' },
  'gleichungen': { EN: 'Equations', FR: 'Équations', IT: 'Equazioni' },
  'gleichungsgesetze': { EN: 'Equation Rules', FR: 'Règles d\'équation', IT: 'Regole di equazione' },
  'kommutativgesetz': { EN: 'Commutative Law', FR: 'Loi commutative', IT: 'Proprietà commutativa' },
  'distributivgesetz': { EN: 'Distributive Law', FR: 'Loi distributive', IT: 'Proprietà distributiva' },
  'assoziativgesetz': { EN: 'Associative Law', FR: 'Loi associative', IT: 'Proprietà associativa' },
  'tabelle': { EN: 'Table', FR: 'Tableau', IT: 'Tavola' },
  'tafel': { EN: 'Board', FR: 'Tableau', IT: 'Tavola' },
  'streifenbrett': { EN: 'Strip Board', FR: 'Tableau des bandes', IT: 'Tavola delle strisce' },
  'schemaquadrat': { EN: 'Schema Square', FR: 'Carré schématique', IT: 'Quadrato schematico' },
  'schlangenspiel': { EN: 'Snake Game', FR: 'Jeu du serpent', IT: 'Gioco del serpente' },
  'punktespiel': { EN: 'Dot Game', FR: 'Jeu des points', IT: 'Gioco dei punti' },
  'perlen': { EN: 'Beads', FR: 'Perles', IT: 'Perle' },
  'perlenmaterial': { EN: 'Bead Material', FR: 'Matériel des perles', IT: 'Materiale delle perle' },
  'kette': { EN: 'Chain', FR: 'Chaîne', IT: 'Catena' },
  'ketten': { EN: 'Chains', FR: 'Chaînes', IT: 'Catene' },
  'kettenregal': { EN: 'Chain Cabinet', FR: 'Étagère des chaînes', IT: 'Scaffale delle catene' },
  'steckbrett': { EN: 'Pegboard', FR: 'Tableau à clous', IT: 'Tavola dei pioli' },
  'rahmen': { EN: 'Frame', FR: 'Cadre', IT: 'Cornice' },
  'textaufgaben': { EN: 'Word Problems', FR: 'Problèmes', IT: 'Problemi' },
  'textaufgabe': { EN: 'Word Problem', FR: 'Problème', IT: 'Problema' },
  'aufgabe': { EN: 'Task', FR: 'Exercice', IT: 'Esercizio' },
  'aufgaben': { EN: 'Tasks', FR: 'Exercices', IT: 'Esercizi' },
  'auftragskarten': { EN: 'Command Cards', FR: 'Cartes de consignes', IT: 'Carte di comandi' },
  'aktivitätskarten': { EN: 'Activity Cards', FR: 'Cartes d\'activités', IT: 'Carte di attività' },
  'aufträge': { EN: 'Commands', FR: 'Consignes', IT: 'Comandi' },
  'auftrag': { EN: 'Command', FR: 'Consigne', IT: 'Comando' },
  'halbieren': { EN: 'Halving', FR: 'Diviser par deux', IT: 'Dimezzare' },
  'verdoppeln': { EN: 'Doubling', FR: 'Doubler', IT: 'Raddoppiare' },
  'notation': { EN: 'Notation', FR: 'Notation', IT: 'Notazione' },
  'schreibweise': { EN: 'Notation', FR: 'Écriture', IT: 'Scrittura' },
  'symbol': { EN: 'Symbol', FR: 'Symbole', IT: 'Simbolo' },
  'symbole': { EN: 'Symbols', FR: 'Symboles', IT: 'Simboli' },
  'hierarchie': { EN: 'Hierarchy', FR: 'Hiérarchie', IT: 'Gerarchia' },
  'basis': { EN: 'Base', FR: 'Base', IT: 'Base' },
  'übergang': { EN: 'Transition', FR: 'Transition', IT: 'Transizione' },
  'darstellung': { EN: 'Representation', FR: 'Représentation', IT: 'Rappresentazione' },
  'darstellungsformen': { EN: 'Representations', FR: 'Représentations', IT: 'Rappresentazioni' },
  'beziehung': { EN: 'Relation', FR: 'Relation', IT: 'Relazione' },
  'beziehungen': { EN: 'Relations', FR: 'Relations', IT: 'Relazioni' },

  // ── Geometry ─────────────────────────────────────────────────────────
  'geometrie': { EN: 'Geometry', FR: 'Géométrie', IT: 'Geometria' },
  'geomertrie': { EN: 'Geometry', FR: 'Géométrie', IT: 'Geometria' },
  'winkel': { EN: 'Angle', FR: 'Angle', IT: 'Angolo' },
  'winkelmesser': { EN: 'Protractor', FR: 'Rapporteur', IT: 'Goniometro' },
  'winkelhalbierende': { EN: 'Angle Bisector', FR: 'Bissectrice', IT: 'Bisettrice' },
  'mittelsenkrechte': { EN: 'Perpendicular Bisector', FR: 'Médiatrice', IT: 'Asse' },
  'mittellinien': { EN: 'Medians', FR: 'Médianes', IT: 'Mediane' },
  'höhen': { EN: 'Altitudes', FR: 'Hauteurs', IT: 'Altezze' },
  'ortho-zentrum': { EN: 'Orthocentre', FR: 'Orthocentre', IT: 'Ortocentro' },
  'schwerpunkt': { EN: 'Centroid', FR: 'Centre de gravité', IT: 'Baricentro' },
  'umkreis-mittelpunkt': { EN: 'Circumcentre', FR: 'Centre du cercle circonscrit', IT: 'Circocentro' },
  'inkreis-mittelpunkt': { EN: 'Incentre', FR: 'Centre du cercle inscrit', IT: 'Incentro' },
  'linie': { EN: 'Line', FR: 'Ligne', IT: 'Linea' },
  'linien': { EN: 'Lines', FR: 'Lignes', IT: 'Linee' },
  'strecke': { EN: 'Segment', FR: 'Segment', IT: 'Segmento' },
  'strahl': { EN: 'Ray', FR: 'Demi-droite', IT: 'Semiretta' },
  'gerade': { EN: 'Straight Line', FR: 'Droite', IT: 'Retta' },
  'geraden': { EN: 'Straight Lines', FR: 'Droites', IT: 'Rette' },
  'kreis': { EN: 'Circle', FR: 'Cercle', IT: 'Cerchio' },
  'dreieck': { EN: 'Triangle', FR: 'Triangle', IT: 'Triangolo' },
  'dreiecke': { EN: 'Triangles', FR: 'Triangles', IT: 'Triangoli' },
  'viereck': { EN: 'Quadrilateral', FR: 'Quadrilatère', IT: 'Quadrilatero' },
  'vierecke': { EN: 'Quadrilaterals', FR: 'Quadrilatères', IT: 'Quadrilateri' },
  'rechteck': { EN: 'Rectangle', FR: 'Rectangle', IT: 'Rettangolo' },
  'polygon': { EN: 'Polygon', FR: 'Polygone', IT: 'Poligono' },
  'polygone': { EN: 'Polygons', FR: 'Polygones', IT: 'Poligoni' },
  'fläche': { EN: 'Surface', FR: 'Surface', IT: 'Superficie' },
  'flächen': { EN: 'Surfaces', FR: 'Surfaces', IT: 'Superfici' },
  'oberfläche': { EN: 'Surface Area', FR: 'Aire', IT: 'Area' },
  'volumen': { EN: 'Volume', FR: 'Volume', IT: 'Volume' },
  'körper': { EN: 'Solid', FR: 'Solide', IT: 'Solido' },
  'raum': { EN: 'Space', FR: 'Espace', IT: 'Spazio' },
  'raums': { EN: 'of Space', FR: 'de l\'espace', IT: 'dello spazio' },
  'figur': { EN: 'Figure', FR: 'Figure', IT: 'Figura' },
  'figuren': { EN: 'Figures', FR: 'Figures', IT: 'Figure' },
  'ebene': { EN: 'Plane', FR: 'Plan', IT: 'Piano' },
  'reguläre': { EN: 'Regular', FR: 'Réguliers', IT: 'Regolari' },
  'definitionsbüchlein': { EN: 'Definition Booklet', FR: 'Livret de définitions', IT: 'Libretto delle definizioni' },
  'definitionsmaterial': { EN: 'Definition Material', FR: 'Matériel de définitions', IT: 'Materiale delle definizioni' },

  // ── Language / reading / writing ─────────────────────────────────────
  'lesen': { EN: 'Reading', FR: 'Lecture', IT: 'Lettura' },
  'leseheft': { EN: 'Reading Booklet', FR: 'Livret de lecture', IT: 'Libretto di lettura' },
  'lesebüchlein': { EN: 'Little Reader', FR: 'Petit livre de lecture', IT: 'Libretto di lettura' },
  'leseaufträge': { EN: 'Reading Commands', FR: 'Consignes de lecture', IT: 'Comandi di lettura' },
  'leseklassifikation': { EN: 'Reading Classification', FR: 'Classification de lecture', IT: 'Classificazione di lettura' },
  'bildkartensatz': { EN: 'Picture Card Set', FR: 'Jeu de cartes images', IT: 'Set di carte illustrate' },
  'schreiben': { EN: 'Writing', FR: 'Écriture', IT: 'Scrittura' },
  'grammatik': { EN: 'Grammar', FR: 'Grammaire', IT: 'Grammatica' },
  'rechtschreibung': { EN: 'Spelling', FR: 'Orthographe', IT: 'Ortografia' },
  'wortarten': { EN: 'Parts of Speech', FR: 'Classes de mots', IT: 'Parti del discorso' },
  'satzanalyse': { EN: 'Sentence Analysis', FR: 'Analyse de la phrase', IT: 'Analisi della frase' },
  'satz': { EN: 'Sentence', FR: 'Phrase', IT: 'Frase' },
  'teilsätze': { EN: 'Clauses', FR: 'Propositions', IT: 'Proposizioni' },
  'subjekt': { EN: 'Subject', FR: 'Sujet', IT: 'Soggetto' },
  'prädikat': { EN: 'Predicate', FR: 'Prédicat', IT: 'Predicato' },
  'objekt': { EN: 'Object', FR: 'Objet', IT: 'Oggetto' },
  'akkusativaobjekt': { EN: 'Accusative Object', FR: 'Complément d\'objet direct', IT: 'Complemento oggetto' },
  'adjektiv': { EN: 'Adjective', FR: 'Adjectif', IT: 'Aggettivo' },
  'adverb': { EN: 'Adverb', FR: 'Adverbe', IT: 'Avverbio' },
  'artikel': { EN: 'Article', FR: 'Article', IT: 'Articolo' },
  'verb': { EN: 'Verb', FR: 'Verbe', IT: 'Verbo' },
  'verben': { EN: 'Verbs', FR: 'Verbes', IT: 'Verbi' },
  'substantiv': { EN: 'Noun', FR: 'Nom', IT: 'Sostantivo' },
  'nomen': { EN: 'Noun', FR: 'Nom', IT: 'Nome' },
  'präposition': { EN: 'Preposition', FR: 'Préposition', IT: 'Preposizione' },
  'präpositionen': { EN: 'Prepositions', FR: 'Prépositions', IT: 'Preposizioni' },
  'pronomen': { EN: 'Pronoun', FR: 'Pronom', IT: 'Pronome' },
  'konjunktion': { EN: 'Conjunction', FR: 'Conjonction', IT: 'Congiunzione' },
  'interjektion': { EN: 'Interjection', FR: 'Interjection', IT: 'Interiezione' },
  'adverbiale': { EN: 'Adverbial', FR: 'Adverbial', IT: 'Avverbiale' },
  'bestimmungen': { EN: 'Modifiers', FR: 'Compléments', IT: 'Complementi' },
  'attribut': { EN: 'Attribute', FR: 'Épithète', IT: 'Attributo' },
  'apposition': { EN: 'Apposition', FR: 'Apposition', IT: 'Apposizione' },
  'abhängigkeit': { EN: 'Dependency', FR: 'Dépendance', IT: 'Dipendenza' },
  'abhängigkeiten': { EN: 'Dependencies', FR: 'Dépendances', IT: 'Dipendenze' },
  'phonogramme': { EN: 'Phonograms', FR: 'Phonogrammes', IT: 'Fonogrammi' },
  'phonogrammhefte': { EN: 'Phonogram Booklets', FR: 'Livrets de phonogrammes', IT: 'Libretti dei fonogrammi' },
  'phonogrammkarten': { EN: 'Phonogram Cards', FR: 'Cartes de phonogrammes', IT: 'Carte dei fonogrammi' },
  'anlautkästchen': { EN: 'Initial Sound Boxes', FR: 'Boîtes des sons initiaux', IT: 'Scatole dei suoni iniziali' },
  'anlaut': { EN: 'Initial Sound', FR: 'Son initial', IT: 'Suono iniziale' },
  'endlaut': { EN: 'Final Sound', FR: 'Son final', IT: 'Suono finale' },
  'mittellaut': { EN: 'Middle Sound', FR: 'Son médian', IT: 'Suono mediano' },
  'buchstabe': { EN: 'Letter', FR: 'Lettre', IT: 'Lettera' },
  'buchstaben': { EN: 'Letters', FR: 'Lettres', IT: 'Lettere' },
  'alphabet': { EN: 'Alphabet', FR: 'Alphabet', IT: 'Alfabeto' },
  'sandpapier': { EN: 'Sandpaper', FR: 'Papier de verre', IT: 'Carta vetrata' },
  'wort': { EN: 'Word', FR: 'Mot', IT: 'Parola' },
  'wörter': { EN: 'Words', FR: 'Mots', IT: 'Parole' },
  'wörtern': { EN: 'words', FR: 'mots', IT: 'parole' },
  'namen': { EN: 'Names', FR: 'Noms', IT: 'Nomi' },
  'name': { EN: 'Name', FR: 'Nom', IT: 'Nome' },
  'bild': { EN: 'Picture', FR: 'Image', IT: 'Immagine' },
  'bilder': { EN: 'Pictures', FR: 'Images', IT: 'Immagini' },
  'gedächtnisübungen': { EN: 'Memory Exercises', FR: 'Exercices de mémoire', IT: 'Esercizi di memoria' },
  'frage': { EN: 'Question', FR: 'Question', IT: 'Domanda' },
  'antwort': { EN: 'Answer', FR: 'Réponse', IT: 'Risposta' },
  'antwort-spiel': { EN: 'Answer Game', FR: 'Jeu de réponses', IT: 'Gioco delle risposte' },
  'spiel': { EN: 'Game', FR: 'Jeu', IT: 'Gioco' },

  // ── Biology / botany / zoology ───────────────────────────────────────
  'biologie': { EN: 'Biology', FR: 'Biologie', IT: 'Biologia' },
  'botanik': { EN: 'Botany', FR: 'Botanique', IT: 'Botanica' },
  'zoologie': { EN: 'Zoology', FR: 'Zoologie', IT: 'Zoologia' },
  'pflanze': { EN: 'Plant', FR: 'Plante', IT: 'Pianta' },
  'pflanzen': { EN: 'Plants', FR: 'Plantes', IT: 'Piante' },
  'wurzeln-pflanze': { EN: 'Plant Roots', FR: 'Racines', IT: 'Radici' },
  'blatt': { EN: 'Leaf', FR: 'Feuille', IT: 'Foglia' },
  'blätter': { EN: 'Leaves', FR: 'Feuilles', IT: 'Foglie' },
  'blüte': { EN: 'Flower', FR: 'Fleur', IT: 'Fiore' },
  'frucht': { EN: 'Fruit', FR: 'Fruit', IT: 'Frutto' },
  'samen': { EN: 'Seed', FR: 'Graine', IT: 'Seme' },
  'spross': { EN: 'Shoot', FR: 'Tige', IT: 'Germoglio' },
  'sprossen': { EN: 'Shoots', FR: 'Tiges', IT: 'Germogli' },
  'tier': { EN: 'Animal', FR: 'Animal', IT: 'Animale' },
  'tiere': { EN: 'Animals', FR: 'Animaux', IT: 'Animali' },
  'tiergeschichten': { EN: 'Animal Stories', FR: 'Histoires d\'animaux', IT: 'Storie di animali' },
  'wirbeltiere': { EN: 'Vertebrates', FR: 'Vertébrés', IT: 'Vertebrati' },
  'wirbeltierte': { EN: 'Vertebrates', FR: 'Vertébrés', IT: 'Vertebrati' },
  'klassifikation': { EN: 'Classification', FR: 'Classification', IT: 'Classificazione' },
  'systematik': { EN: 'Systematics', FR: 'Systématique', IT: 'Sistematica' },
  'reich': { EN: 'Kingdom', FR: 'Règne', IT: 'Regno' },
  'reiche': { EN: 'Kingdoms', FR: 'Règnes', IT: 'Regni' },
  'lebewesen': { EN: 'Living Things', FR: 'Êtres vivants', IT: 'Esseri viventi' },
  'leben': { EN: 'Life', FR: 'Vie', IT: 'Vita' },
  'lebens': { EN: 'of Life', FR: 'de la vie', IT: 'della vita' },
  'bedürfnisse': { EN: 'Needs', FR: 'Besoins', IT: 'Bisogni' },
  'grundbedürfnisse': { EN: 'Basic Needs', FR: 'Besoins fondamentaux', IT: 'Bisogni fondamentali' },
  'mensch': { EN: 'Human', FR: 'Homme', IT: 'Uomo' },
  'menschen': { EN: 'Humans', FR: 'Hommes', IT: 'Uomini' },
  'körper-mensch': { EN: 'Human Body', FR: 'Corps humain', IT: 'Corpo umano' },
  'atmung': { EN: 'Respiration', FR: 'Respiration', IT: 'Respirazione' },
  'blutkreislauf': { EN: 'Circulation', FR: 'Circulation sanguine', IT: 'Circolazione sanguigna' },

  // ── Geography / earth sciences ───────────────────────────────────────
  'erde': { EN: 'Earth', FR: 'Terre', IT: 'Terra' },
  'sonne': { EN: 'Sun', FR: 'Soleil', IT: 'Sole' },
  'sonnensystem': { EN: 'Solar System', FR: 'Système solaire', IT: 'Sistema solare' },
  'mond': { EN: 'Moon', FR: 'Lune', IT: 'Luna' },
  'rotation': { EN: 'Rotation', FR: 'Rotation', IT: 'Rotazione' },
  'erdrotation': { EN: 'Earth\'s Rotation', FR: 'Rotation de la Terre', IT: 'Rotazione della Terra' },
  'atmosphäre': { EN: 'Atmosphere', FR: 'Atmosphère', IT: 'Atmosfera' },
  'wärme': { EN: 'Heat', FR: 'Chaleur', IT: 'Calore' },
  'tagestemperatur': { EN: 'Daytime Temperature', FR: 'Température diurne', IT: 'Temperatura diurna' },
  'temperatur': { EN: 'Temperature', FR: 'Température', IT: 'Temperatura' },
  'winde': { EN: 'Winds', FR: 'Vents', IT: 'Venti' },
  'ablenkung': { EN: 'Deflection', FR: 'Déviation', IT: 'Deviazione' },
  'anziehungskraft': { EN: 'Gravity', FR: 'Gravité', IT: 'Gravità' },
  'jahreszeiten': { EN: 'Seasons', FR: 'Saisons', IT: 'Stagioni' },
  'jahr': { EN: 'Year', FR: 'Année', IT: 'Anno' },
  'tag': { EN: 'Day', FR: 'Jour', IT: 'Giorno' },
  'tage': { EN: 'Days', FR: 'Jours', IT: 'Giorni' },
  'nacht': { EN: 'Night', FR: 'Nuit', IT: 'Notte' },
  'wasser': { EN: 'Water', FR: 'Eau', IT: 'Acqua' },
  'wassers': { EN: 'of Water', FR: 'de l\'eau', IT: 'dell\'acqua' },
  'fluss': { EN: 'River', FR: 'Fleuve', IT: 'Fiume' },
  'flüsse': { EN: 'Rivers', FR: 'Fleuves', IT: 'Fiumi' },
  'erosion': { EN: 'Erosion', FR: 'Érosion', IT: 'Erosione' },
  'aufbau-erde': { EN: 'Structure of Earth', FR: 'Structure de la Terre', IT: 'Struttura della Terra' },
  'kontinente': { EN: 'Continents', FR: 'Continents', IT: 'Continenti' },
  'kontinent': { EN: 'Continent', FR: 'Continent', IT: 'Continente' },
  'land': { EN: 'Country', FR: 'Pays', IT: 'Paese' },
  'länder': { EN: 'Countries', FR: 'Pays', IT: 'Paesi' },

  // ── Chemistry / physics ──────────────────────────────────────────────
  'stoffe': { EN: 'Substances', FR: 'Substances', IT: 'Sostanze' },
  'stoff': { EN: 'Substance', FR: 'Substance', IT: 'Sostanza' },
  'eigenschaften': { EN: 'Properties', FR: 'Propriétés', IT: 'Proprietà' },
  'reaktionen': { EN: 'Reactions', FR: 'Réactions', IT: 'Reazioni' },
  'reaktion': { EN: 'Reaction', FR: 'Réaction', IT: 'Reazione' },

  // ── History ──────────────────────────────────────────────────────────
  'geschichte': { EN: 'History', FR: 'Histoire', IT: 'Storia' },
  'geschichten': { EN: 'Stories', FR: 'Histoires', IT: 'Storie' },
  'erzählung': { EN: 'Story', FR: 'Récit', IT: 'Racconto' },
  'erzählungen': { EN: 'Stories', FR: 'Récits', IT: 'Racconti' },
  'zeitleiste': { EN: 'Timeline', FR: 'Frise chronologique', IT: 'Linea del tempo' },
  'geschichtskarten': { EN: 'History Cards', FR: 'Cartes d\'histoire', IT: 'Carte di storia' },
  'menschheit': { EN: 'Humanity', FR: 'Humanité', IT: 'Umanità' },
  'revolution': { EN: 'Revolution', FR: 'Révolution', IT: 'Rivoluzione' },
  'entstehung': { EN: 'Origin', FR: 'Origine', IT: 'Origine' },

  // ── Generic action / abstract terms ──────────────────────────────────
  'einführung': { EN: 'Introduction', FR: 'Introduction', IT: 'Introduzione' },
  'hinführung': { EN: 'Lead-in', FR: 'Approche', IT: 'Introduzione' },
  'grundlagen': { EN: 'Fundamentals', FR: 'Notions de base', IT: 'Fondamenti' },
  'grundfertigkeiten': { EN: 'Basic Skills', FR: 'Compétences de base', IT: 'Competenze di base' },
  'grundfertigkeite': { EN: 'Basic Skills', FR: 'Compétences de base', IT: 'Competenze di base' },
  'grundelemente': { EN: 'Basic Elements', FR: 'Éléments de base', IT: 'Elementi di base' },
  'elemente': { EN: 'Elements', FR: 'Éléments', IT: 'Elementi' },
  'element': { EN: 'Element', FR: 'Élément', IT: 'Elemento' },
  'typen': { EN: 'Types', FR: 'Types', IT: 'Tipi' },
  'typ': { EN: 'Type', FR: 'Type', IT: 'Tipo' },
  'arten': { EN: 'Kinds', FR: 'Sortes', IT: 'Tipi' },
  'art': { EN: 'Kind', FR: 'Sorte', IT: 'Tipo' },
  'teile': { EN: 'Parts', FR: 'Parties', IT: 'Parti' },
  'teil': { EN: 'Part', FR: 'Partie', IT: 'Parte' },
  'aufbau': { EN: 'Structure', FR: 'Structure', IT: 'Struttura' },
  'abstraktion': { EN: 'Abstraction', FR: 'Abstraction', IT: 'Astrazione' },
  'abstrakt': { EN: 'abstract', FR: 'abstrait', IT: 'astratto' },
  'sensorisch': { EN: 'sensorial', FR: 'sensoriel', IT: 'sensoriale' },
  'sensorische': { EN: 'sensorial', FR: 'sensoriels', IT: 'sensoriali' },
  'dynamische': { EN: 'dynamic', FR: 'dynamique', IT: 'dinamico' },
  'dynamisch': { EN: 'dynamic', FR: 'dynamique', IT: 'dinamico' },
  'statische': { EN: 'static', FR: 'statique', IT: 'statico' },
  'statisch': { EN: 'static', FR: 'statique', IT: 'statico' },
  'mündliche': { EN: 'oral', FR: 'orale', IT: 'orale' },
  'mündlich': { EN: 'oral', FR: 'oral', IT: 'orale' },
  'schriftliche': { EN: 'written', FR: 'écrite', IT: 'scritta' },
  'schriftlich': { EN: 'written', FR: 'écrit', IT: 'scritto' },
  'gleicher': { EN: 'same', FR: 'même', IT: 'stesso' },
  'gleichen': { EN: 'same', FR: 'mêmes', IT: 'stessi' },
  'ungleichen': { EN: 'unequal', FR: 'inégaux', IT: 'diversi' },
  'andere': { EN: 'other', FR: 'autre', IT: 'altro' },
  'anderer': { EN: 'other', FR: 'autres', IT: 'altri' },
  'allgemeiner': { EN: 'general', FR: 'général', IT: 'generale' },
  'algebraische': { EN: 'algebraic', FR: 'algébrique', IT: 'algebrico' },
  'algebraisches': { EN: 'algebraic', FR: 'algébrique', IT: 'algebrico' },
  'arithmetische': { EN: 'arithmetic', FR: 'arithmétique', IT: 'aritmetico' },
  'analyse': { EN: 'Analysis', FR: 'Analyse', IT: 'Analisi' },
  'rechnung-analyse': { EN: 'Calculation Analysis', FR: 'Analyse du calcul', IT: 'Analisi del calcolo' },
  'auflösung': { EN: 'Resolution', FR: 'Décomposition', IT: 'Risoluzione' },
  'anwendung': { EN: 'Application', FR: 'Application', IT: 'Applicazione' },
  'ausbreitung': { EN: 'Spreading', FR: 'Propagation', IT: 'Diffusione' },
  'ableiten': { EN: 'Deriving', FR: 'Déduire', IT: 'Derivare' },
  'regel': { EN: 'Rule', FR: 'Règle', IT: 'Regola' },
  'regeln': { EN: 'Rules', FR: 'Règles', IT: 'Regole' },
  'beweis': { EN: 'Proof', FR: 'Preuve', IT: 'Dimostrazione' },
  'platte': { EN: 'Plate', FR: 'Plaque', IT: 'Lastra' },
  'schublade': { EN: 'Drawer', FR: 'Tiroir', IT: 'Cassetto' },
  'einsätze': { EN: 'Insets', FR: 'Encastrements', IT: 'Incastri' },
  'einsatz': { EN: 'Inset', FR: 'Encastrement', IT: 'Incastro' },
  'beutel': { EN: 'Bag', FR: 'Sac', IT: 'Sacchetto' },
  'gaben': { EN: 'Gifts', FR: 'Cadeaux', IT: 'Doni' },
  'fröbels': { EN: 'Fröbel\'s', FR: 'de Fröbel', IT: 'di Fröbel' },
  'puzzle': { EN: 'Puzzle', FR: 'Puzzle', IT: 'Puzzle' },
  'umgebung': { EN: 'Environment', FR: 'Environnement', IT: 'Ambiente' },
  'gegenstände': { EN: 'Objects', FR: 'Objets', IT: 'Oggetti' },
  'gegenständen': { EN: 'objects', FR: 'objets', IT: 'oggetti' },
  'dinge': { EN: 'Things', FR: 'Choses', IT: 'Cose' },
  'dingen': { EN: 'things', FR: 'choses', IT: 'cose' },
  'verkleinerten': { EN: 'reduced', FR: 'réduits', IT: 'ridotti' },
  'bauen': { EN: 'Building', FR: 'Construire', IT: 'Costruire' },
  'konstruieren': { EN: 'Constructing', FR: 'Construire', IT: 'Costruire' },
  'bilden': { EN: 'Forming', FR: 'Former', IT: 'Formare' },
  'finden': { EN: 'Finding', FR: 'Trouver', IT: 'Trovare' },
  'messen': { EN: 'Measuring', FR: 'Mesurer', IT: 'Misurare' },
  'vergleichen': { EN: 'Comparing', FR: 'Comparer', IT: 'Confrontare' },
  'sortieren': { EN: 'Sorting', FR: 'Trier', IT: 'Selezionare' },
  'zuordnen': { EN: 'Matching', FR: 'Associer', IT: 'Abbinare' },
  'teilen': { EN: 'Dividing', FR: 'Diviser', IT: 'Dividere' },
  'auslegen': { EN: 'Laying out', FR: 'Disposer', IT: 'Disporre' },
  'sprüngen': { EN: 'jumps', FR: 'sauts', IT: 'salti' },
  'großen': { EN: 'large', FR: 'grands', IT: 'grandi' },
  'grossen': { EN: 'large', FR: 'grands', IT: 'grandi' },
  'grosser': { EN: 'large', FR: 'grand', IT: 'grande' },
  'grosse': { EN: 'large', FR: 'grand', IT: 'grande' },
  'kleiner': { EN: 'small', FR: 'petit', IT: 'piccolo' },
  'kleine': { EN: 'small', FR: 'petite', IT: 'piccola' },
  'roter': { EN: 'red', FR: 'rouge', IT: 'rosso' },
  'rote': { EN: 'red', FR: 'rouges', IT: 'rosse' },
  'stangen': { EN: 'Rods', FR: 'Barres', IT: 'Aste' },
  'stufenlektion': { EN: 'Period Lesson', FR: 'Leçon en temps', IT: 'Lezione in tempi' },
  'quantität': { EN: 'Quantity', FR: 'Quantité', IT: 'Quantità' },
  'serien': { EN: 'Series', FR: 'Séries', IT: 'Serie' },
  'serie': { EN: 'Series', FR: 'Série', IT: 'Serie' },
  'zylinder': { EN: 'Cylinder', FR: 'Cylindre', IT: 'Cilindro' },
  'zylinderserien': { EN: 'Cylinder Series', FR: 'Séries de cylindres', IT: 'Serie di cilindri' },
  'form': { EN: 'Form', FR: 'Forme', IT: 'Forma' },
  'formen': { EN: 'Shapes', FR: 'Formes', IT: 'Forme' },
  'farbe': { EN: 'Colour', FR: 'Couleur', IT: 'Colore' },
  'farben': { EN: 'Colours', FR: 'Couleurs', IT: 'Colori' },
  'übung': { EN: 'Exercise', FR: 'Exercice', IT: 'Esercizio' },
  'übungen': { EN: 'Exercises', FR: 'Exercices', IT: 'Esercizi' },
  'material': { EN: 'Material', FR: 'Matériel', IT: 'Materiale' },
  'materialien': { EN: 'Materials', FR: 'Matériels', IT: 'Materiali' },
  'präsentation': { EN: 'Presentation', FR: 'Présentation', IT: 'Presentazione' },
  'arbeit': { EN: 'Work', FR: 'Travail', IT: 'Lavoro' },
  'arbeiten': { EN: 'Works', FR: 'Travaux', IT: 'Lavori' },
  'lektion': { EN: 'Lesson', FR: 'Leçon', IT: 'Lezione' },
  'lektionen': { EN: 'Lessons', FR: 'Leçons', IT: 'Lezioni' },
  'thema': { EN: 'Topic', FR: 'Sujet', IT: 'Argomento' },
  'gruppe': { EN: 'Group', FR: 'Groupe', IT: 'Gruppo' },
  'bereich': { EN: 'Area', FR: 'Domaine', IT: 'Ambito' },
  'begriff': { EN: 'Concept', FR: 'Concept', IT: 'Concetto' },
  'begriffe': { EN: 'Concepts', FR: 'Concepts', IT: 'Concetti' },
  'zahlenkarten': { EN: 'Number Cards', FR: 'Cartes des nombres', IT: 'Carte dei numeri' },
  'tafeln': { EN: 'Boards', FR: 'Tableaux', IT: 'Tavole' },
  'springende': { EN: 'jumping', FR: 'sautillant', IT: 'saltellante' },
  'halbe': { EN: 'half', FR: 'demi', IT: 'metà' },
  'volle': { EN: 'full', FR: 'complet', IT: 'completo' },
  'leere': { EN: 'empty', FR: 'vide', IT: 'vuota' },
  'umgekehrte': { EN: 'inverted', FR: 'inversée', IT: 'invertita' },
  'jäten': { EN: 'Weeding', FR: 'Désherber', IT: 'Diserbare' },
  'kreuzmultiplikation': { EN: 'Cross Multiplication', FR: 'Multiplication croisée', IT: 'Moltiplicazione incrociata' },
  'schweiz': { EN: 'Switzerland', FR: 'Suisse', IT: 'Svizzera' },

  // ── Letters/labels used in the data ──────────────────────────────────
  'sandpaper': { EN: 'Sandpaper', FR: 'Papier de verre', IT: 'Carta vetrata' },
  'letters': { EN: 'Letters', FR: 'Lettres', IT: 'Lettere' },

  // ── Round 2: gaps from first run ─────────────────────────────────────
  'sandpapierbuchstaben': { EN: 'Sandpaper Letters', FR: 'Lettres rugueuses', IT: 'Lettere smerigliate' },
  'spindeln': { EN: 'Spindles', FR: 'Fuseaux', IT: 'Fuselli' },
  'spindel': { EN: 'Spindle', FR: 'Fuseau', IT: 'Fuso' },
  'ziffer': { EN: 'Numeral', FR: 'Chiffre', IT: 'Cifra' },
  'ziffern': { EN: 'Numerals', FR: 'Chiffres', IT: 'Cifre' },
  'ziffernkarten': { EN: 'Numeral Cards', FR: 'Cartes de chiffres', IT: 'Carte delle cifre' },
  'numerische': { EN: 'Number', FR: 'Numérique', IT: 'Numerico' },
  'numerisch': { EN: 'numeric', FR: 'numérique', IT: 'numerico' },
  'numerischen': { EN: 'numeric', FR: 'numériques', IT: 'numerici' },
  'perlenstäben': { EN: 'Bead Bars', FR: 'Barres de perles', IT: 'Aste delle perle' },
  'perlenstäbe': { EN: 'Bead Bars', FR: 'Barres de perles', IT: 'Aste delle perle' },
  'perlenstab': { EN: 'Bead Bar', FR: 'Barre de perles', IT: 'Asta delle perle' },
  'transponieren': { EN: 'Transposing', FR: 'Transposer', IT: 'Trasporre' },
  'transponierung': { EN: 'Transposition', FR: 'Transposition', IT: 'Trasposizione' },
  'seite': { EN: 'Side', FR: 'Côté', IT: 'Lato' },
  'seiten': { EN: 'Sides', FR: 'Côtés', IT: 'Lati' },
  'europa': { EN: 'Europe', FR: 'Europe', IT: 'Europa' },
  'europas': { EN: 'of Europe', FR: 'd\'Europe', IT: 'd\'Europa' },
  'entfernung': { EN: 'Distance', FR: 'Distance', IT: 'Distanza' },
  'entfernungsspiele': { EN: 'Distance Games', FR: 'Jeux de distances', IT: 'Giochi delle distanze' },
  'fremdwort': { EN: 'Foreign Word', FR: 'Mot étranger', IT: 'Parola straniera' },
  'fremdwörter': { EN: 'Foreign Words', FR: 'Mots étrangers', IT: 'Parole straniere' },
  'projektarbeit': { EN: 'Project Work', FR: 'Travail de projet', IT: 'Lavoro di progetto' },
  'projekt': { EN: 'Project', FR: 'Projet', IT: 'Progetto' },
  'projekte': { EN: 'Projects', FR: 'Projets', IT: 'Progetti' },
  'konjugation': { EN: 'Conjugation', FR: 'Conjugaison', IT: 'Coniugazione' },
  'konjugieren': { EN: 'Conjugate', FR: 'Conjuguer', IT: 'Coniugare' },
  'deklination': { EN: 'Declension', FR: 'Déclinaison', IT: 'Declinazione' },
  'phonetic': { EN: 'Phonetic', FR: 'Phonétique', IT: 'Fonetico' },
  'phonetik': { EN: 'Phonetics', FR: 'Phonétique', IT: 'Fonetica' },
  'ergänzung': { EN: 'Complement', FR: 'Complément', IT: 'Complemento' },
  'ergänzungen': { EN: 'Complements', FR: 'Compléments', IT: 'Complementi' },
  'mehrstellig': { EN: 'multi-digit', FR: 'à plusieurs chiffres', IT: 'a più cifre' },
  'mehrstellige': { EN: 'multi-digit', FR: 'à plusieurs chiffres', IT: 'a più cifre' },
  'mehrstelliger': { EN: 'multi-digit', FR: 'à plusieurs chiffres', IT: 'a più cifre' },
  'mehrstelliges': { EN: 'multi-digit', FR: 'à plusieurs chiffres', IT: 'a più cifre' },
  'einstellig': { EN: 'single-digit', FR: 'à un chiffre', IT: 'a una cifra' },
  'einstellige': { EN: 'single-digit', FR: 'à un chiffre', IT: 'a una cifra' },
  'einstelliger': { EN: 'single-digit', FR: 'à un chiffre', IT: 'a una cifra' },
  'stellig': { EN: 'digit', FR: 'chiffre', IT: 'cifra' },
  'stelliger': { EN: 'digit', FR: 'chiffre', IT: 'cifra' },
  'stellige': { EN: 'digit', FR: 'chiffre', IT: 'cifra' },
  'stelliges': { EN: 'digit', FR: 'chiffre', IT: 'cifra' },
  'wieviel': { EN: 'How Many', FR: 'Combien', IT: 'Quanto' },
  'kultur': { EN: 'Culture', FR: 'Culture', IT: 'Cultura' },
  'kulturen': { EN: 'Cultures', FR: 'Cultures', IT: 'Culture' },
  'isostatisch': { EN: 'isostatic', FR: 'isostatique', IT: 'isostatico' },
  'isostatische': { EN: 'isostatic', FR: 'isostatique', IT: 'isostatico' },
  'ausdruck': { EN: 'Expression', FR: 'Expression', IT: 'Espressione' },
  'tablett': { EN: 'Tray', FR: 'Plateau', IT: 'Vassoio' },
  'einfach': { EN: 'simple', FR: 'simple', IT: 'semplice' },
  'einfache': { EN: 'simple', FR: 'simples', IT: 'semplici' },
  'einfacher': { EN: 'simple', FR: 'simple', IT: 'semplice' },
  'einfaches': { EN: 'simple', FR: 'simple', IT: 'semplice' },
  'erdschicht': { EN: 'Earth Layer', FR: 'Couche terrestre', IT: 'Strato della Terra' },
  'erdschichten': { EN: 'Earth Layers', FR: 'Couches terrestres', IT: 'Strati della Terra' },
  'schicht': { EN: 'Layer', FR: 'Couche', IT: 'Strato' },
  'schichten': { EN: 'Layers', FR: 'Couches', IT: 'Strati' },
  'markenspiel': { EN: 'Stamp Game', FR: 'Jeu des timbres', IT: 'Gioco dei francobolli' },
  'marken': { EN: 'Stamps', FR: 'Timbres', IT: 'Francobolli' },
  'bewegung': { EN: 'Movement', FR: 'Mouvement', IT: 'Movimento' },
  'bewegungen': { EN: 'Movements', FR: 'Mouvements', IT: 'Movimenti' },
  'farbtafel': { EN: 'Colour Tablet', FR: 'Tablette de couleurs', IT: 'Tavoletta dei colori' },
  'farbtafeln': { EN: 'Colour Tablets', FR: 'Tablettes de couleurs', IT: 'Tavolette dei colori' },
  'rechenoperation': { EN: 'Arithmetic Operation', FR: 'Opération arithmétique', IT: 'Operazione aritmetica' },
  'rechenoperationen': { EN: 'Arithmetic Operations', FR: 'Opérations arithmétiques', IT: 'Operazioni aritmetiche' },
  'text': { EN: 'Text', FR: 'Texte', IT: 'Testo' },
  'texte': { EN: 'Texts', FR: 'Textes', IT: 'Testi' },
  'schreibung': { EN: 'Writing', FR: 'Orthographe', IT: 'Scrittura' },
  'schreibübung': { EN: 'Writing Exercise', FR: 'Exercice d\'écriture', IT: 'Esercizio di scrittura' },
  'schreibübungen': { EN: 'Writing Exercises', FR: 'Exercices d\'écriture', IT: 'Esercizi di scrittura' },
  'schachtel': { EN: 'Box', FR: 'Boîte', IT: 'Scatola' },
  'schachteln': { EN: 'Boxes', FR: 'Boîtes', IT: 'Scatole' },
  'kartensatz': { EN: 'Card Set', FR: 'Jeu de cartes', IT: 'Set di carte' },
  'einheit': { EN: 'Unit', FR: 'Unité', IT: 'Unità' },
  'einheiten': { EN: 'Units', FR: 'Unités', IT: 'Unità' },
  'einheitswürfel': { EN: 'Unit Cube', FR: 'Cube unité', IT: 'Cubo unità' },
  'falten': { EN: 'Folding', FR: 'Pliage', IT: 'Piegatura' },
  'multiplizieren': { EN: 'Multiplying', FR: 'Multiplier', IT: 'Moltiplicare' },
  'dividieren': { EN: 'Dividing', FR: 'Diviser', IT: 'Dividere' },
  'addieren': { EN: 'Adding', FR: 'Additionner', IT: 'Sommare' },
  'subtrahieren': { EN: 'Subtracting', FR: 'Soustraire', IT: 'Sottrarre' },
  'zeit': { EN: 'Time', FR: 'Temps', IT: 'Tempo' },
  'horizontal': { EN: 'horizontal', FR: 'horizontal', IT: 'orizzontale' },
  'vertikal': { EN: 'vertical', FR: 'vertical', IT: 'verticale' },
  'waschen': { EN: 'Washing', FR: 'Laver', IT: 'Lavare' },
  'wäsche': { EN: 'Laundry', FR: 'Linge', IT: 'Bucato' },
  'tastbrett': { EN: 'Touch Board', FR: 'Tablette tactile', IT: 'Tavola tattile' },
  'tastsinn': { EN: 'Sense of Touch', FR: 'Sens du toucher', IT: 'Senso del tatto' },
  'bildtafel': { EN: 'Picture Tablet', FR: 'Tablette d\'images', IT: 'Tavola di immagini' },
  'konsumieren': { EN: 'Consuming', FR: 'Consommer', IT: 'Consumare' },
  'sprechen': { EN: 'Speaking', FR: 'Parler', IT: 'Parlare' },
  'schneiden': { EN: 'Cutting', FR: 'Couper', IT: 'Tagliare' },
  'putzen': { EN: 'Cleaning', FR: 'Nettoyer', IT: 'Pulire' },
  'papier': { EN: 'Paper', FR: 'Papier', IT: 'Carta' },
  'produziert': { EN: 'produced', FR: 'produit', IT: 'prodotto' },
  'produzieren': { EN: 'Producing', FR: 'Produire', IT: 'Produrre' },
  'simple': { EN: 'Simple', FR: 'Simple', IT: 'Semplice' },
  'unsere': { EN: 'our', FR: 'notre', IT: 'nostro' },
  'unser': { EN: 'our', FR: 'notre', IT: 'nostro' },
  'wir': { EN: 'we', FR: 'nous', IT: 'noi' },
  'wird': { EN: 'is', FR: 'est', IT: 'è' },
  'word': { EN: 'Word', FR: 'Mot', IT: 'Parola' },
  'words': { EN: 'Words', FR: 'Mots', IT: 'Parole' },
  'sentence': { EN: 'Sentence', FR: 'Phrase', IT: 'Frase' },
  'sentences': { EN: 'Sentences', FR: 'Phrases', IT: 'Frasi' },
  'reading': { EN: 'Reading', FR: 'Lecture', IT: 'Lettura' },
  'writing': { EN: 'Writing', FR: 'Écriture', IT: 'Scrittura' },
  'numbers': { EN: 'Numbers', FR: 'Nombres', IT: 'Numeri' },
  'number': { EN: 'Number', FR: 'Nombre', IT: 'Numero' },
  'rods': { EN: 'Rods', FR: 'Barres', IT: 'Aste' },
  'cards': { EN: 'Cards', FR: 'Cartes', IT: 'Carte' },
  'introduction': { EN: 'Introduction', FR: 'Introduction', IT: 'Introduzione' },
  'phonograms': { EN: 'Phonograms', FR: 'Phonogrammes', IT: 'Fonogrammi' },
  'environment': { EN: 'Environment', FR: 'Environnement', IT: 'Ambiente' },
  'object': { EN: 'Object', FR: 'Objet', IT: 'Oggetto' },
  'objects': { EN: 'Objects', FR: 'Objets', IT: 'Oggetti' },
  'arrows': { EN: 'Arrows', FR: 'Flèches', IT: 'Frecce' },
  'pfeil': { EN: 'Arrow', FR: 'Flèche', IT: 'Freccia' },
  'pfeile': { EN: 'Arrows', FR: 'Flèches', IT: 'Frecce' },
  'adjective': { EN: 'Adjective', FR: 'Adjectif', IT: 'Aggettivo' },
  'part': { EN: 'Part', FR: 'Partie', IT: 'Parte' },
  'game': { EN: 'Game', FR: 'Jeu', IT: 'Gioco' },
  'small': { EN: 'small', FR: 'petit', IT: 'piccolo' },
  'large': { EN: 'large', FR: 'grand', IT: 'grande' },
  'with': { EN: 'with', FR: 'avec', IT: 'con' },
  'from': { EN: 'from', FR: 'de', IT: 'da' },
  'and': { EN: 'and', FR: 'et', IT: 'e' },
  'the': { EN: 'the', FR: 'le', IT: 'il' },
  'einen': { EN: 'one', FR: 'un', IT: 'uno' },
  'kleinere': { EN: 'smaller', FR: 'plus petit', IT: 'più piccolo' },
  'kleineren': { EN: 'smaller', FR: 'plus petits', IT: 'più piccoli' },
  'grössere': { EN: 'larger', FR: 'plus grand', IT: 'più grande' },
  'grösseren': { EN: 'larger', FR: 'plus grands', IT: 'più grandi' },
  'kategorie': { EN: 'Category', FR: 'Catégorie', IT: 'Categoria' },
  'null': { EN: 'Zero', FR: 'Zéro', IT: 'Zero' },
  'kategorien': { EN: 'Categories', FR: 'Catégories', IT: 'Categorie' },
  'klein': { EN: 'small', FR: 'petit', IT: 'piccolo' },
  'gross': { EN: 'large', FR: 'grand', IT: 'grande' },
  'goldenen': { EN: 'Golden', FR: 'Dorées', IT: 'Dorate' },
  'goldenes': { EN: 'Golden', FR: 'Doré', IT: 'Dorato' },
  'golden': { EN: 'Golden', FR: 'Doré', IT: 'Dorato' },

  // ── Round 3: long tail ───────────────────────────────────────────────
  'oval': { EN: 'Oval', FR: 'Ovale', IT: 'Ovale' },
  'ovale': { EN: 'Ovals', FR: 'Ovales', IT: 'Ovali' },
  'wochentag': { EN: 'Weekday', FR: 'Jour de la semaine', IT: 'Giorno della settimana' },
  'wochentage': { EN: 'Weekdays', FR: 'Jours de la semaine', IT: 'Giorni della settimana' },
  'monat': { EN: 'Month', FR: 'Mois', IT: 'Mese' },
  'monate': { EN: 'Months', FR: 'Mois', IT: 'Mesi' },
  'woche': { EN: 'Week', FR: 'Semaine', IT: 'Settimana' },
  'wochen': { EN: 'Weeks', FR: 'Semaines', IT: 'Settimane' },
  'lösung': { EN: 'Solution', FR: 'Solution', IT: 'Soluzione' },
  'lösungen': { EN: 'Solutions', FR: 'Solutions', IT: 'Soluzioni' },
  'geometrisch': { EN: 'geometric', FR: 'géométrique', IT: 'geometrico' },
  'geometrische': { EN: 'geometric', FR: 'géométriques', IT: 'geometrici' },
  'geometrischer': { EN: 'geometric', FR: 'géométrique', IT: 'geometrico' },
  'geometrisches': { EN: 'geometric', FR: 'géométrique', IT: 'geometrico' },
  'parallelogramm': { EN: 'Parallelogram', FR: 'Parallélogramme', IT: 'Parallelogramma' },
  'trapez': { EN: 'Trapezoid', FR: 'Trapèze', IT: 'Trapezio' },
  'raute': { EN: 'Rhombus', FR: 'Losange', IT: 'Rombo' },
  'drachen': { EN: 'Kite', FR: 'Cerf-volant', IT: 'Aquilone' },
  'drachenviereck': { EN: 'Kite Quadrilateral', FR: 'Cerf-volant', IT: 'Quadrilatero aquilone' },
  'drachenvierecke': { EN: 'Kite Quadrilaterals', FR: 'Cerfs-volants', IT: 'Quadrilateri aquilone' },
  'etwas': { EN: 'something', FR: 'quelque chose', IT: 'qualcosa' },
  'länge': { EN: 'Length', FR: 'Longueur', IT: 'Lunghezza' },
  'längen': { EN: 'Lengths', FR: 'Longueurs', IT: 'Lunghezze' },
  'breite': { EN: 'Width', FR: 'Largeur', IT: 'Larghezza' },
  'höhe': { EN: 'Height', FR: 'Hauteur', IT: 'Altezza' },
  'tiefe': { EN: 'Depth', FR: 'Profondeur', IT: 'Profondità' },
  'gewicht': { EN: 'Weight', FR: 'Poids', IT: 'Peso' },
  'elastisch': { EN: 'elastic', FR: 'élastique', IT: 'elastico' },
  'elastische': { EN: 'elastic', FR: 'élastiques', IT: 'elastici' },
  'viskos': { EN: 'viscous', FR: 'visqueux', IT: 'viscoso' },
  'viskose': { EN: 'viscous', FR: 'visqueuses', IT: 'viscose' },
  'textsorte': { EN: 'Text Type', FR: 'Type de texte', IT: 'Tipo di testo' },
  'textsorten': { EN: 'Text Types', FR: 'Types de textes', IT: 'Tipi di testo' },
  'sich': { EN: 'oneself', FR: 'se', IT: 'si' },
  'kasten': { EN: 'Box', FR: 'Caisse', IT: 'Cassetta' },
  'kästchen': { EN: 'Box', FR: 'Boîtier', IT: 'Cassetta' },
  'tangram': { EN: 'Tangram', FR: 'Tangram', IT: 'Tangram' },
  'tangrame': { EN: 'Tangrams', FR: 'Tangrams', IT: 'Tangram' },
  'classification': { EN: 'Classification', FR: 'Classification', IT: 'Classificazione' },
  'vogel': { EN: 'Bird', FR: 'Oiseau', IT: 'Uccello' },
  'vögel': { EN: 'Birds', FR: 'Oiseaux', IT: 'Uccelli' },
  'fisch': { EN: 'Fish', FR: 'Poisson', IT: 'Pesce' },
  'fische': { EN: 'Fish', FR: 'Poissons', IT: 'Pesci' },
  'säugetier': { EN: 'Mammal', FR: 'Mammifère', IT: 'Mammifero' },
  'säugetiere': { EN: 'Mammals', FR: 'Mammifères', IT: 'Mammiferi' },
  'insekt': { EN: 'Insect', FR: 'Insecte', IT: 'Insetto' },
  'insekten': { EN: 'Insects', FR: 'Insectes', IT: 'Insetti' },
  'reptil': { EN: 'Reptile', FR: 'Reptile', IT: 'Rettile' },
  'reptilien': { EN: 'Reptiles', FR: 'Reptiles', IT: 'Rettili' },
  'amphibie': { EN: 'Amphibian', FR: 'Amphibien', IT: 'Anfibio' },
  'amphibien': { EN: 'Amphibians', FR: 'Amphibiens', IT: 'Anfibi' },
  'bildtafel-2': { EN: 'Picture Tablet', FR: 'Tablette d\'images', IT: 'Tavola di immagini' },
  'bildtafeln': { EN: 'Picture Tablets', FR: 'Tablettes d\'images', IT: 'Tavole di immagini' },
  'verschieden': { EN: 'different', FR: 'différent', IT: 'diverso' },
  'verschiedene': { EN: 'different', FR: 'différents', IT: 'diversi' },
  'verschiedenen': { EN: 'different', FR: 'différents', IT: 'diversi' },
  'feudalismus': { EN: 'Feudalism', FR: 'Féodalisme', IT: 'Feudalesimo' },
  'heruntergefallenen': { EN: 'fallen', FR: 'tombés', IT: 'caduti' },
  'heruntergefallene': { EN: 'fallen', FR: 'tombés', IT: 'caduti' },
  'zylinderblock': { EN: 'Cylinder Block', FR: 'Bloc des cylindres', IT: 'Blocco dei cilindri' },
  'polieren': { EN: 'Polishing', FR: 'Polir', IT: 'Lucidare' },
  'warm': { EN: 'warm', FR: 'chaud', IT: 'caldo' },
  'kalt': { EN: 'cold', FR: 'froid', IT: 'freddo' },
  'heiss': { EN: 'hot', FR: 'chaud', IT: 'caldo' },
  'phonogram': { EN: 'Phonogram', FR: 'Phonogramme', IT: 'Fonogramma' },
  'schaffen': { EN: 'Creating', FR: 'Créer', IT: 'Creare' },
  'tierreich': { EN: 'Animal Kingdom', FR: 'Règne animal', IT: 'Regno animale' },
  'pflanzenreich': { EN: 'Plant Kingdom', FR: 'Règne végétal', IT: 'Regno vegetale' },
  'zeitzone': { EN: 'Time Zone', FR: 'Fuseau horaire', IT: 'Fuso orario' },
  'zeitzonen': { EN: 'Time Zones', FR: 'Fuseaux horaires', IT: 'Fusi orari' },
  'jahre': { EN: 'Years', FR: 'Années', IT: 'Anni' },
  'niederschlag': { EN: 'Precipitation', FR: 'Précipitations', IT: 'Precipitazioni' },
  'zone': { EN: 'Zone', FR: 'Zone', IT: 'Zona' },
  'zonen': { EN: 'Zones', FR: 'Zones', IT: 'Zone' },
  'datumsgrenze': { EN: 'Date Line', FR: 'Ligne de changement de date', IT: 'Linea del cambio data' },
  'weiterführung': { EN: 'Continuation', FR: 'Suite', IT: 'Continuazione' },
  'dekanom': { EN: 'Decanomial', FR: 'Décanôme', IT: 'Decanomio' },
  'wärmestrahlung': { EN: 'Heat Radiation', FR: 'Rayonnement thermique', IT: 'Radiazione termica' },
  'strahlung': { EN: 'Radiation', FR: 'Rayonnement', IT: 'Radiazione' },
};

function normalise(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Per-word translation. Splits on word boundaries but keeps separators
 * (digits, punctuation, whitespace) intact and in order.
 *
 * Preserves capitalisation of the *first letter* when the original word
 * started with an uppercase letter.
 */
function translateWords(deName: string, locale: Locale): { text: string; replaced: number } {
  let replaced = 0;
  const tokens = deName.split(/([A-Za-zÄÖÜäöüß]+)/);
  const out = tokens.map((tok) => {
    if (!/^[A-Za-zÄÖÜäöüß]+$/.test(tok)) return tok;
    const key = tok.toLowerCase();
    const hit = WORD_MAP[key];
    if (!hit) return tok;
    replaced++;
    const translated = hit[locale];
    // Preserve initial-capital casing
    const firstUpper = tok[0] === tok[0].toUpperCase();
    if (firstUpper && translated.length > 0) {
      return translated[0].toUpperCase() + translated.slice(1);
    }
    return translated;
  });
  return { text: out.join(''), replaced };
}

function translateName(deName: string, locale: Locale): string {
  const phrase = PHRASE_MAP[normalise(deName)];
  if (phrase) return phrase[locale];
  const { text, replaced } = translateWords(deName, locale);
  return replaced > 0 ? text : deName;
}

interface TableConfig {
  table: string;
  parentColumn: string;
  /** extra TEXT columns that should be carried over from the DE row */
  carryColumns: string[];
}

const TABLES: TableConfig[] = [
  { table: 'curriculum_translations', parentColumn: 'curriculum_id', carryColumns: ['description'] },
  { table: 'curriculum_level_translations', parentColumn: 'curriculum_level_id', carryColumns: [] },
  { table: 'curriculum_node_translations', parentColumn: 'curriculum_node_id', carryColumns: ['notes'] },
];

interface DERow {
  parent_id: string;
  name: string;
  [key: string]: string | null;
}

async function backfillTable(
  c: Client,
  cfg: TableConfig,
): Promise<{ inserted: number; updated: number; skipped: number }> {
  const { table, parentColumn, carryColumns } = cfg;

  // Existing rows per parent + locale (to know what to skip / what to update)
  const { rows: existing } = await c.query<{ parent_id: string; locale: string; name: string }>(
    `SELECT "${parentColumn}" AS parent_id, locale, name FROM ${table}`,
  );
  const existingMap = new Map<string, { name: string }>();
  for (const r of existing) {
    existingMap.set(`${r.parent_id}::${r.locale}`, { name: r.name });
  }

  // Read DE master rows
  const carrySelect = carryColumns.length
    ? ', ' + carryColumns.map((c) => `"${c}"`).join(', ')
    : '';
  const { rows: deRows } = await c.query<DERow>(
    `SELECT "${parentColumn}" AS parent_id, name${carrySelect}
       FROM ${table}
       WHERE locale = 'DE'`,
  );

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of deRows) {
    for (const target of TARGET_LOCALES) {
      const key = `${row.parent_id}::${target}`;
      const existingRow = existingMap.get(key);
      const newName = translateName(row.name, target);

      if (!existingRow) {
        // INSERT
        const cols = [
          'id',
          'version',
          '"isActive"',
          '"isArchived"',
          '"createdAt"',
          '"updatedAt"',
          `"${parentColumn}"`,
          'locale',
          'name',
          ...carryColumns.map((c) => `"${c}"`),
        ];
        const placeholders = [
          '$1', '$2', '$3', '$4', 'now()', 'now()',
          '$5', '$6', '$7',
          ...carryColumns.map((_, i) => `$${8 + i}`),
        ];
        const values: unknown[] = [
          randomUUID(), 1, true, false,
          row.parent_id, target, newName,
          ...carryColumns.map((c) => row[c] ?? null),
        ];
        const sql = `INSERT INTO ${table} (${cols.join(', ')})
                     VALUES (${placeholders.join(', ')})
                     ON CONFLICT ("${parentColumn}", locale) DO NOTHING`;
        const res = await c.query(sql, values);
        if (res.rowCount && res.rowCount > 0) inserted++;
        continue;
      }

      const shouldUpdate =
        FORCE_MODE
          ? existingRow.name !== newName
          : UPDATE_MODE && existingRow.name === row.name && newName !== row.name;

      if (shouldUpdate) {
        await c.query(
          `UPDATE ${table}
             SET name = $1, "updatedAt" = now()
             WHERE "${parentColumn}" = $2 AND locale = $3`,
          [newName, row.parent_id, target],
        );
        updated++;
      } else {
        skipped++;
      }
    }
  }

  return { inserted, updated, skipped };
}

async function main(): Promise<void> {
  const client = new Client(DB);
  await client.connect();
  try {
    console.log(
      `▶ Backfilling curriculum translations (EN/FR/IT)${UPDATE_MODE ? ' [UPDATE MODE]' : ''} …`,
    );

    for (const cfg of TABLES) {
      const { inserted, updated, skipped } = await backfillTable(client, cfg);
      console.log(
        `  ✓ ${cfg.table}: +${inserted} inserted, ↻ ${updated} updated, ${skipped} kept`,
      );
    }

    console.log('✅ Done.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
