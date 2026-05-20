/**
 * One-shot resync: aktualisiert die System-Absenzkategorien-Translations
 * der Testschule (DE/FR/IT/EN) auf die aktuellen Code-Defaults.
 *
 * Run with:
 *   cd apps/backend
 *   npx ts-node -T scripts/resync-testschule-absence-translations.ts
 */
import { Client } from 'pg';

const ORG_ID = '8e5ec09a-c2b7-458f-bf28-b8081a6af409';

const DB = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'restart',
};

type T = { name: string; description: string | null };
const SYS: Record<string, { DE: T; FR: T; IT: T; EN: T }> = {
  SICKNESS: {
    DE: {
      name: 'Krankheit',
      description:
        'Ab dem 3. Tag ist ein Arztzeugnis erforderlich (Schweizer Standard).',
    },
    FR: {
      name: 'Maladie',
      description: 'Certificat médical requis dès le 3e jour (standard suisse).',
    },
    IT: {
      name: 'Malattia',
      description:
        'Certificato medico richiesto dal 3° giorno (standard svizzero).',
    },
    EN: {
      name: 'Sick leave',
      description: 'Medical certificate required from day 3 (Swiss standard).',
    },
  },
  ACCIDENT: {
    DE: {
      name: 'Unfall',
      description: 'Unfallmeldung erforderlich; Lohnfortzahlung gemäss UVG.',
    },
    FR: {
      name: 'Accident',
      description:
        'Déclaration d’accident requise; maintien du salaire selon la LAA.',
    },
    IT: {
      name: 'Infortunio',
      description:
        'Notifica d’infortunio richiesta; salario garantito secondo la LAINF.',
    },
    EN: {
      name: 'Accident',
      description:
        'Accident report required; salary continuation per Swiss accident insurance (UVG/LAA/LAINF).',
    },
  },
  CHILDCARE_SICK: {
    DE: {
      name: 'Kind krank',
      description:
        'Betreuung kranker Kinder: max. 3 Tage pro Ereignis (Art. 36 ArG).',
    },
    FR: {
      name: 'Enfant malade',
      description:
        'Soins à un enfant malade: max. 3 jours par évènement (art. 36 LTr).',
    },
    IT: {
      name: 'Figlio malato',
      description:
        'Assistenza a un figlio malato: max. 3 giorni per evento (art. 36 LL).',
    },
    EN: {
      name: 'Sick child care',
      description:
        'Care for a sick child: max. 3 days per event (Swiss Labor Act art. 36).',
    },
  },
  TRAINING: {
    DE: {
      name: 'Weiterbildung',
      description: 'Externe oder interne berufliche Weiterbildung.',
    },
    FR: {
      name: 'Formation continue',
      description: 'Formation continue interne ou externe.',
    },
    IT: {
      name: 'Formazione continua',
      description: 'Formazione continua interna o esterna.',
    },
    EN: {
      name: 'Training',
      description: 'Internal or external professional training.',
    },
  },
  FUNERAL: {
    DE: {
      name: 'Trauerfall',
      description:
        'Todesfall in der nahen Familie; bis zu 3 Tage bezahlte Absenz.',
    },
    FR: {
      name: 'Décès',
      description: 'Décès d’un proche; jusqu’à 3 jours d’absence rémunérée.',
    },
    IT: {
      name: 'Lutto',
      description:
        'Decesso di un familiare prossimo; fino a 3 giorni di assenza retribuita.',
    },
    EN: {
      name: 'Bereavement',
      description:
        'Death of a close family member; up to 3 days of paid leave.',
    },
  },
  MOVE: {
    DE: {
      name: 'Umzug',
      description: 'Tag des Wohnungsumzugs; 1 bezahlter Tag pro Jahr.',
    },
    FR: {
      name: 'Déménagement',
      description: 'Jour de déménagement; 1 jour rémunéré par an.',
    },
    IT: {
      name: 'Trasloco',
      description: 'Giorno del trasloco; 1 giorno retribuito all’anno.',
    },
    EN: {
      name: 'Moving day',
      description: 'Day of residential move; 1 paid day per year.',
    },
  },
  MILITARY_SERVICE: {
    DE: {
      name: 'Militärdienst',
      description:
        'Obligatorische Dienstpflicht; Lohnfortzahlung via Erwerbsersatzordnung (EO).',
    },
    FR: {
      name: 'Service militaire',
      description:
        'Service militaire obligatoire; compensation via les Allocations pour perte de gain (APG).',
    },
    IT: {
      name: 'Servizio militare',
      description:
        'Servizio militare obbligatorio; indennità tramite l’Indennità di perdita di guadagno (IPG).',
    },
    EN: {
      name: 'Military service',
      description:
        'Mandatory Swiss military service; income compensation via EO/APG/IPG.',
    },
  },
  CIVIL_SERVICE: {
    DE: {
      name: 'Zivildienst',
      description: 'Ersatzdienst statt Militärdienst; Lohnfortzahlung via EO.',
    },
    FR: {
      name: 'Service civil',
      description:
        'Service civil en remplacement du service militaire; compensation via APG.',
    },
    IT: {
      name: 'Servizio civile',
      description:
        'Servizio civile in sostituzione del servizio militare; indennità tramite IPG.',
    },
    EN: {
      name: 'Civil service',
      description:
        'Civil service in lieu of military duty; income compensation via EO/APG/IPG.',
    },
  },
  OTHER: {
    DE: {
      name: 'Sonstiges',
      description:
        'Andere bezahlte oder unbezahlte Abwesenheit; Genehmigung erforderlich.',
    },
    FR: {
      name: 'Autre',
      description:
        'Autre absence rémunérée ou non rémunérée; approbation requise.',
    },
    IT: {
      name: 'Altro',
      description:
        'Altra assenza retribuita o non retribuita; approvazione richiesta.',
    },
    EN: {
      name: 'Other',
      description: 'Other paid or unpaid absence; requires approval.',
    },
  },
};

async function main() {
  const c = new Client(DB);
  await c.connect();
  console.log('▶ Connected');

  const cats = await c.query(
    `SELECT id, system_code FROM employee_absence_categories
     WHERE organization_id = $1 AND is_system = true`,
    [ORG_ID],
  );
  console.log(`  Found ${cats.rows.length} system categories`);

  let count = 0;
  for (const row of cats.rows as Array<{ id: string; system_code: string }>) {
    const defs = SYS[row.system_code];
    if (!defs) {
      console.warn(`  (skip) unknown system_code: ${row.system_code}`);
      continue;
    }
    for (const locale of ['DE', 'FR', 'IT', 'EN'] as const) {
      const t = defs[locale];
      await c.query(
        `INSERT INTO employee_absence_category_translations
           (category_id, locale, name, description, version)
         VALUES ($1, $2, $3, $4, 1)
         ON CONFLICT (category_id, locale)
         DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, "updatedAt" = now()`,
        [row.id, locale, t.name, t.description],
      );
      count++;
    }
  }
  console.log(`✓ Resynced ${count} translations`);

  await c.end();
}

main().catch((err) => {
  console.error('\n❌ Resync failed:', err);
  process.exit(1);
});
