// Frozen migration data. Do not import current entities or application seeders here.
export const ABSENCE_CATEGORY_SNAPSHOTS = [
  {
    code: 'VACATION',
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
    code: 'MEDICAL_APPOINTMENT',
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
    code: 'THERAPY_APPOINTMENT',
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
    code: 'OFFICIAL_APPOINTMENT',
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
    code: 'WEDDING',
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
    code: 'COMPENSATION',
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
    code: 'UNPAID_LEAVE',
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
];
