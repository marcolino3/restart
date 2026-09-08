import * as XLSX from "xlsx";

/**
 * Wide-format template: one row per child, guardians as fixed column blocks.
 * Generated client-side so the header wording always matches the parser
 * aliases in `student-file-parser.ts` instead of a checked-in binary.
 */

const STUDENT_COLUMNS = [
  "Vorname",
  "Nachname",
  "Rufname",
  "Geburtsdatum",
  "Geschlecht",
  "Geburtsort",
  "Nationalität",
  "Erstsprache",
  "Familiensprache",
  "Religion",
  "AHV-Nummer",
  "Schülernummer",
  "Eintrittsdatum",
  "Klasse",
  "Stufe",
  "Notizen",
] as const;

const CONTACT_FIELDS = [
  "Vorname",
  "Nachname",
  "E-Mail",
  "Telefon",
  "Mobile",
  "Beruf",
  "Sorgerecht",
  "Hauptkontakt",
  "Abholberechtigt",
  "Notfallpriorität",
  "Wohnt bei Kind",
] as const;

const ADDRESS_COLUMNS = [
  "Strasse",
  "Hausnummer",
  "PLZ",
  "Ort",
  "Land",
] as const;

function contactBlock(prefix: string, withRelationship: boolean): string[] {
  const fields = withRelationship
    ? ["Beziehung", ...CONTACT_FIELDS]
    : [...CONTACT_FIELDS];
  return fields.map((field) => `${prefix} ${field}`);
}

const HEADERS: string[] = [
  ...STUDENT_COLUMNS,
  ...contactBlock("Mutter", false),
  ...contactBlock("Vater", false),
  ...contactBlock("Kontakt 3", true),
  ...contactBlock("Kontakt 4", true),
  ...ADDRESS_COLUMNS,
];

/** Two siblings sharing both parents, so the merge behaviour is visible. */
const EXAMPLE_ROWS: Record<string, string>[] = [
  {
    Vorname: "Lena",
    Nachname: "Müller",
    Geburtsdatum: "12.03.2018",
    Geschlecht: "weiblich",
    Geburtsort: "Zürich",
    Nationalität: "CH",
    Erstsprache: "Deutsch",
    Eintrittsdatum: "19.08.2024",
    Klasse: "Blau",
    "Mutter Vorname": "Anna",
    "Mutter Nachname": "Müller",
    "Mutter E-Mail": "anna.mueller@example.com",
    "Mutter Mobile": "079 123 45 67",
    "Mutter Sorgerecht": "ja",
    "Mutter Hauptkontakt": "ja",
    "Mutter Wohnt bei Kind": "ja",
    "Vater Vorname": "Peter",
    "Vater Nachname": "Müller",
    "Vater E-Mail": "peter.mueller@example.com",
    "Vater Mobile": "079 765 43 21",
    "Vater Sorgerecht": "ja",
    "Vater Wohnt bei Kind": "ja",
    Strasse: "Bahnhofstrasse",
    Hausnummer: "12",
    PLZ: "8001",
    Ort: "Zürich",
    Land: "Schweiz",
  },
  {
    Vorname: "Tim",
    Nachname: "Müller",
    Geburtsdatum: "05.09.2020",
    Geschlecht: "männlich",
    Nationalität: "CH",
    Erstsprache: "Deutsch",
    Eintrittsdatum: "18.08.2025",
    Klasse: "Rot",
    "Mutter Vorname": "Anna",
    "Mutter Nachname": "Müller",
    "Mutter E-Mail": "anna.mueller@example.com",
    "Mutter Mobile": "079 123 45 67",
    "Mutter Sorgerecht": "ja",
    "Mutter Hauptkontakt": "ja",
    "Mutter Wohnt bei Kind": "ja",
    "Vater Vorname": "Peter",
    "Vater Nachname": "Müller",
    "Vater E-Mail": "peter.mueller@example.com",
    "Vater Sorgerecht": "ja",
    "Vater Wohnt bei Kind": "ja",
    "Kontakt 3 Beziehung": "Grossmutter",
    "Kontakt 3 Vorname": "Rita",
    "Kontakt 3 Nachname": "Müller",
    "Kontakt 3 Mobile": "079 111 22 33",
    "Kontakt 3 Abholberechtigt": "ja",
    "Kontakt 3 Notfallpriorität": "2",
    Strasse: "Bahnhofstrasse",
    Hausnummer: "12",
    PLZ: "8001",
    Ort: "Zürich",
    Land: "Schweiz",
  },
];

const HINT_ROWS: string[][] = [
  [],
  ["Hinweise:"],
  [
    "• Eine Zeile pro Kind. Nur Vorname und Nachname sind Pflicht, alle weiteren Spalten sind optional.",
  ],
  [
    "• Geschwister: Eltern in beiden Zeilen identisch eintragen (gleiche E-Mail oder Mobile) — sie werden automatisch zusammengeführt.",
  ],
  [
    "• Datum als TT.MM.JJJJ oder JJJJ-MM-TT. Ja/Nein-Spalten: ja, nein, x, 1, 0.",
  ],
  [
    "• Mehrere Werte in einer Zelle mit ; | oder / trennen (z. B. Nationalität: CH|DE).",
  ],
  [
    "• Klasse und Stufe müssen bereits in der App existieren, sonst wird das Kind ohne Zuordnung importiert.",
  ],
  ["• Nicht benötigte Spalten und Kontaktblöcke einfach leer lassen."],
  ["• Diese Hinweiszeilen vor dem Upload nicht löschen — sie werden ignoriert."],
];

export function buildStudentImportTemplate(): XLSX.WorkBook {
  const rows = EXAMPLE_ROWS.map((row) => HEADERS.map((h) => row[h] ?? ""));
  const sheet = XLSX.utils.aoa_to_sheet([HEADERS, ...rows, ...HINT_ROWS]);
  sheet["!cols"] = HEADERS.map((h) => ({ wch: Math.max(12, h.length + 2) }));
  sheet["!freeze"] = { xSplit: "0", ySplit: "1" };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Schüler");
  return workbook;
}

export function downloadStudentImportTemplate(): void {
  XLSX.writeFile(buildStudentImportTemplate(), "schueler-eltern-vorlage.xlsx");
}
