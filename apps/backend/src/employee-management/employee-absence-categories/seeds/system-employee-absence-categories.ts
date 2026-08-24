import { Locale } from '@/database/enums/locale.enum';
import { AbsenceEntryPrecision } from '../interfaces/absence-entry-precision.enum';
import { SystemEmployeeAbsenceCategory } from '../interfaces/system-employee-absence-categories.enum';

export type SystemEmployeeAbsenceCategoryDefaults = {
  code: SystemEmployeeAbsenceCategory;
  countsAsWorkTime: boolean;
  isPaid: boolean;
  affectsVacationBalance: boolean;
  defaultIsVacationCapable: boolean;
  reducesVacationEntitlementAfterDays: number | null;
  requiresCertificate: boolean;
  certificateRequiredFromDay: number | null;
  maxDaysPerYear: number | null;
  defaultPercentage: number;
  requiresApproval: boolean;
  allowsDateRange: boolean;
  entryPrecision: AbsenceEntryPrecision;
  maxDaysPerRequest: number | null;
  color: string | null;
  iconName: string | null;
  sortOrder: number;
  translations: Record<Locale, { name: string; description?: string }>;
};

export const SYSTEM_EMPLOYEE_ABSENCE_CATEGORIES: SystemEmployeeAbsenceCategoryDefaults[] =
  [
    {
      // OR 329a: at least 4 weeks per year (5 weeks under 20); planned in
      // advance and approved by the employer, so it is a request.
      code: SystemEmployeeAbsenceCategory.VACATION,
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: true,
      defaultIsVacationCapable: false,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: false,
      certificateRequiredFromDay: null,
      maxDaysPerYear: null,
      defaultPercentage: 100,
      requiresApproval: true,
      allowsDateRange: true,
      entryPrecision: AbsenceEntryPrecision.DAY,
      maxDaysPerRequest: null,
      color: '#22C55E',
      iconName: 'sun',
      sortOrder: 5,
      translations: {
        DE: {
          name: 'Ferien',
          description:
            'Bezahlte Ferien gemaess Ferienanspruch (mind. 4 Wochen, Art. 329a OR); im Voraus zu beantragen.',
        },
        FR: {
          name: 'Vacances',
          description:
            'Vacances payées selon le droit aux vacances (min. 4 semaines, art. 329a CO); à demander à l’avance.',
        },
        IT: {
          name: 'Vacanze',
          description:
            'Vacanze pagate secondo il diritto alle vacanze (min. 4 settimane, art. 329a CO); da richiedere in anticipo.',
        },
        EN: {
          name: 'Vacation',
          description:
            'Paid vacation per entitlement (min. 4 weeks, CO art. 329a); to be requested in advance.',
        },
      },
    },
    {
      code: SystemEmployeeAbsenceCategory.SICKNESS,
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: false,
      reducesVacationEntitlementAfterDays: 30,
      requiresCertificate: true,
      certificateRequiredFromDay: 3,
      maxDaysPerYear: null,
      defaultPercentage: 100,
      requiresApproval: false,
      allowsDateRange: false,
      entryPrecision: AbsenceEntryPrecision.HALF_DAY,
      maxDaysPerRequest: null,
      color: '#EF4444',
      iconName: 'thermometer',
      sortOrder: 10,
      translations: {
        DE: {
          name: 'Krankheit',
          description:
            'Ab dem 3. Tag ist ein Arztzeugnis erforderlich (Schweizer Standard).',
        },
        FR: {
          name: 'Maladie',
          description:
            'Certificat médical requis dès le 3e jour (standard suisse).',
        },
        IT: {
          name: 'Malattia',
          description:
            'Certificato medico richiesto dal 3° giorno (standard svizzero).',
        },
        EN: {
          name: 'Sick leave',
          description:
            'Medical certificate required from day 3 (Swiss standard).',
        },
      },
    },
    {
      code: SystemEmployeeAbsenceCategory.ACCIDENT,
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: false,
      reducesVacationEntitlementAfterDays: 30,
      requiresCertificate: true,
      certificateRequiredFromDay: 1,
      maxDaysPerYear: null,
      defaultPercentage: 100,
      requiresApproval: false,
      allowsDateRange: false,
      entryPrecision: AbsenceEntryPrecision.HALF_DAY,
      maxDaysPerRequest: null,
      color: '#F97316',
      iconName: 'heart-pulse',
      sortOrder: 20,
      translations: {
        DE: {
          name: 'Unfall',
          description:
            'Unfallmeldung erforderlich; Lohnfortzahlung gemäss UVG.',
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
    },
    {
      code: SystemEmployeeAbsenceCategory.CHILDCARE_SICK,
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: false,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: true,
      certificateRequiredFromDay: 1,
      maxDaysPerYear: 10,
      defaultPercentage: 100,
      requiresApproval: false,
      allowsDateRange: true,
      entryPrecision: AbsenceEntryPrecision.HALF_DAY,
      maxDaysPerRequest: 3,
      color: '#F59E0B',
      iconName: 'baby',
      sortOrder: 30,
      translations: {
        DE: {
          name: 'Kind krank',
          description:
            'Betreuung kranker Kinder: max. 3 Tage pro Ereignis, 10 Tage pro Jahr (Art. 329h OR, Art. 36 ArG); Arztzeugnis auf Verlangen.',
        },
        FR: {
          name: 'Enfant malade',
          description:
            'Soins à un enfant malade: max. 3 jours par évènement, 10 jours par an (art. 329h CO, art. 36 LTr); certificat médical sur demande.',
        },
        IT: {
          name: 'Figlio malato',
          description:
            'Assistenza a un figlio malato: max. 3 giorni per evento, 10 giorni all’anno (art. 329h CO, art. 36 LL); certificato medico su richiesta.',
        },
        EN: {
          name: 'Sick child care',
          description:
            'Care for a sick child: max. 3 days per event, 10 days per year (CO art. 329h, Labour Act art. 36); medical certificate on request.',
        },
      },
    },
    {
      code: SystemEmployeeAbsenceCategory.TRAINING,
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: true,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: false,
      certificateRequiredFromDay: null,
      maxDaysPerYear: null,
      defaultPercentage: 100,
      requiresApproval: true,
      allowsDateRange: true,
      entryPrecision: AbsenceEntryPrecision.DAY,
      maxDaysPerRequest: null,
      color: '#3B82F6',
      iconName: 'graduation-cap',
      sortOrder: 40,
      translations: {
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
    },
    {
      code: SystemEmployeeAbsenceCategory.FUNERAL,
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: true,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: false,
      certificateRequiredFromDay: null,
      maxDaysPerYear: 3,
      defaultPercentage: 100,
      requiresApproval: false,
      allowsDateRange: true,
      entryPrecision: AbsenceEntryPrecision.HALF_DAY,
      maxDaysPerRequest: 3,
      color: '#6B7280',
      iconName: 'flower',
      sortOrder: 50,
      translations: {
        DE: {
          name: 'Trauerfall',
          description:
            'Todesfall in der nahen Familie; bis zu 3 Tage bezahlte Absenz.',
        },
        FR: {
          name: 'Décès',
          description:
            'Décès d’un proche; jusqu’à 3 jours d’absence rémunérée.',
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
    },
    {
      code: SystemEmployeeAbsenceCategory.MOVE,
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: true,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: false,
      certificateRequiredFromDay: null,
      maxDaysPerYear: 1,
      defaultPercentage: 100,
      requiresApproval: true,
      allowsDateRange: false,
      entryPrecision: AbsenceEntryPrecision.DAY,
      maxDaysPerRequest: null,
      color: '#8B5CF6',
      iconName: 'truck',
      sortOrder: 60,
      translations: {
        DE: {
          name: 'Umzug',
          description:
            'Tag des Wohnungsumzugs; 1 bezahlter Tag pro Jahr, im Voraus zu beantragen.',
        },
        FR: {
          name: 'Déménagement',
          description:
            'Jour de déménagement; 1 jour rémunéré par an, à demander à l’avance.',
        },
        IT: {
          name: 'Trasloco',
          description:
            'Giorno del trasloco; 1 giorno retribuito all’anno, da richiedere in anticipo.',
        },
        EN: {
          name: 'Moving day',
          description:
            'Day of residential move; 1 paid day per year, to be requested in advance.',
        },
      },
    },
    {
      code: SystemEmployeeAbsenceCategory.MILITARY_SERVICE,
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: false,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: true,
      certificateRequiredFromDay: 1,
      maxDaysPerYear: null,
      defaultPercentage: 100,
      requiresApproval: true,
      allowsDateRange: true,
      entryPrecision: AbsenceEntryPrecision.DAY,
      maxDaysPerRequest: null,
      color: '#10B981',
      iconName: 'shield',
      sortOrder: 70,
      translations: {
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
    },
    {
      code: SystemEmployeeAbsenceCategory.CIVIL_SERVICE,
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: false,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: true,
      certificateRequiredFromDay: 1,
      maxDaysPerYear: null,
      defaultPercentage: 100,
      requiresApproval: true,
      allowsDateRange: true,
      entryPrecision: AbsenceEntryPrecision.DAY,
      maxDaysPerRequest: null,
      color: '#14B8A6',
      iconName: 'shield-check',
      sortOrder: 80,
      translations: {
        DE: {
          name: 'Zivildienst',
          description:
            'Ersatzdienst statt Militärdienst; Lohnfortzahlung via EO.',
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
    },
    {
      code: SystemEmployeeAbsenceCategory.MEDICAL_APPOINTMENT,
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: true,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: false,
      certificateRequiredFromDay: null,
      maxDaysPerYear: null,
      defaultPercentage: 100,
      requiresApproval: false,
      allowsDateRange: false,
      entryPrecision: AbsenceEntryPrecision.TIME,
      maxDaysPerRequest: null,
      color: '#EC4899',
      iconName: 'stethoscope',
      sortOrder: 32,
      translations: {
        DE: {
          name: 'Arzttermin',
          description:
            'Arzt- oder Zahnarzttermin waehrend der Arbeitszeit; nach Moeglichkeit an Randzeiten legen. Stundenweise als Anwesenheitsgrad erfassen.',
        },
        FR: {
          name: 'Rendez-vous médical',
          description:
            'Rendez-vous chez le médecin ou le dentiste pendant les heures de travail; à placer si possible en début ou fin de journée.',
        },
        IT: {
          name: 'Visita medica',
          description:
            'Visita medica o dentistica durante l’orario di lavoro; da fissare possibilmente a inizio o fine giornata.',
        },
        EN: {
          name: 'Medical appointment',
          description:
            'Doctor or dentist appointment during working hours; schedule at the edges of the day where possible. Record hours via the attendance rate.',
        },
      },
    },
    {
      code: SystemEmployeeAbsenceCategory.THERAPY_APPOINTMENT,
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: true,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: false,
      certificateRequiredFromDay: null,
      maxDaysPerYear: null,
      defaultPercentage: 100,
      requiresApproval: false,
      allowsDateRange: false,
      entryPrecision: AbsenceEntryPrecision.TIME,
      maxDaysPerRequest: null,
      color: '#D946EF',
      iconName: 'hand-heart',
      sortOrder: 34,
      translations: {
        DE: {
          name: 'Therapietermin',
          description:
            'Physio-, Psycho- oder andere aerztlich verordnete Therapie waehrend der Arbeitszeit. Stundenweise als Anwesenheitsgrad erfassen.',
        },
        FR: {
          name: 'Rendez-vous thérapeutique',
          description:
            'Physiothérapie, psychothérapie ou autre thérapie prescrite pendant les heures de travail.',
        },
        IT: {
          name: 'Seduta terapeutica',
          description:
            'Fisioterapia, psicoterapia o altra terapia prescritta durante l’orario di lavoro.',
        },
        EN: {
          name: 'Therapy appointment',
          description:
            'Physiotherapy, psychotherapy or other prescribed therapy during working hours. Record hours via the attendance rate.',
        },
      },
    },
    {
      code: SystemEmployeeAbsenceCategory.OFFICIAL_APPOINTMENT,
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: true,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: false,
      certificateRequiredFromDay: null,
      maxDaysPerYear: null,
      defaultPercentage: 100,
      requiresApproval: false,
      allowsDateRange: false,
      entryPrecision: AbsenceEntryPrecision.TIME,
      maxDaysPerRequest: null,
      color: '#64748B',
      iconName: 'landmark',
      sortOrder: 36,
      translations: {
        DE: {
          name: 'Behoerdentermin',
          description:
            'Amtlicher Termin, der nicht ausserhalb der Arbeitszeit moeglich ist (Behoerde, Gericht, Zeugenaussage).',
        },
        FR: {
          name: 'Rendez-vous administratif',
          description:
            'Rendez-vous officiel impossible en dehors des heures de travail (administration, tribunal, témoignage).',
        },
        IT: {
          name: 'Appuntamento ufficiale',
          description:
            'Appuntamento ufficiale non possibile fuori dall’orario di lavoro (autorità, tribunale, testimonianza).',
        },
        EN: {
          name: 'Official appointment',
          description:
            'Official appointment that cannot take place outside working hours (authority, court, witness testimony).',
        },
      },
    },
    {
      code: SystemEmployeeAbsenceCategory.WEDDING,
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: true,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: false,
      certificateRequiredFromDay: null,
      maxDaysPerYear: 2,
      defaultPercentage: 100,
      requiresApproval: true,
      allowsDateRange: true,
      entryPrecision: AbsenceEntryPrecision.DAY,
      maxDaysPerRequest: 2,
      color: '#F43F5E',
      iconName: 'gem',
      sortOrder: 55,
      translations: {
        DE: {
          name: 'Hochzeit',
          description:
            'Eigene Hochzeit oder eingetragene Partnerschaft; bis zu 2 bezahlte Tage, im Voraus zu beantragen.',
        },
        FR: {
          name: 'Mariage',
          description:
            'Propre mariage ou partenariat enregistré; jusqu’à 2 jours rémunérés, à demander à l’avance.',
        },
        IT: {
          name: 'Matrimonio',
          description:
            'Proprio matrimonio o unione registrata; fino a 2 giorni retribuiti, da richiedere in anticipo.',
        },
        EN: {
          name: 'Wedding',
          description:
            'Own wedding or registered partnership; up to 2 paid days, to be requested in advance.',
        },
      },
    },
    {
      code: SystemEmployeeAbsenceCategory.COMPENSATION,
      countsAsWorkTime: false,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: true,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: false,
      certificateRequiredFromDay: null,
      maxDaysPerYear: null,
      defaultPercentage: 100,
      requiresApproval: true,
      allowsDateRange: true,
      entryPrecision: AbsenceEntryPrecision.DAY,
      maxDaysPerRequest: null,
      color: '#0EA5E9',
      iconName: 'clock',
      sortOrder: 85,
      translations: {
        DE: {
          name: 'Kompensation',
          description:
            'Abbau von Mehrstunden; auch mehrtaegig. Genehmigung erforderlich.',
        },
        FR: {
          name: 'Compensation',
          description:
            "Récupération d'heures supplémentaires; approbation requise.",
        },
        IT: {
          name: 'Compensazione',
          description: 'Recupero di ore supplementari; approvazione richiesta.',
        },
        EN: {
          name: 'Compensation',
          description: 'Time off in lieu of overtime; requires approval.',
        },
      },
    },
    {
      code: SystemEmployeeAbsenceCategory.UNPAID_LEAVE,
      countsAsWorkTime: false,
      isPaid: false,
      affectsVacationBalance: false,
      defaultIsVacationCapable: true,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: false,
      certificateRequiredFromDay: null,
      maxDaysPerYear: null,
      defaultPercentage: 100,
      requiresApproval: true,
      allowsDateRange: true,
      entryPrecision: AbsenceEntryPrecision.DAY,
      maxDaysPerRequest: null,
      color: '#A78BFA',
      iconName: 'plane',
      sortOrder: 90,
      translations: {
        DE: {
          name: 'Unbezahlter Urlaub',
          description: 'Unbezahlte Abwesenheit; Genehmigung erforderlich.',
        },
        FR: {
          name: 'Congé non payé',
          description: 'Absence non rémunérée; approbation requise.',
        },
        IT: {
          name: 'Congedo non retribuito',
          description: 'Assenza non retribuita; approvazione richiesta.',
        },
        EN: {
          name: 'Unpaid leave',
          description: 'Unpaid absence; requires approval.',
        },
      },
    },
    {
      code: SystemEmployeeAbsenceCategory.OTHER,
      countsAsWorkTime: false,
      isPaid: false,
      affectsVacationBalance: false,
      defaultIsVacationCapable: true,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: false,
      certificateRequiredFromDay: null,
      maxDaysPerYear: null,
      defaultPercentage: 100,
      requiresApproval: true,
      allowsDateRange: true,
      entryPrecision: AbsenceEntryPrecision.HALF_DAY,
      maxDaysPerRequest: null,
      color: '#9CA3AF',
      iconName: 'help-circle',
      sortOrder: 999,
      translations: {
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
    },
  ];
