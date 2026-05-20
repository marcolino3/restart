import { Locale } from '@/database/enums/locale.enum';
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
  color: string | null;
  iconName: string | null;
  sortOrder: number;
  translations: Record<Locale, { name: string; description?: string }>;
};

export const SYSTEM_EMPLOYEE_ABSENCE_CATEGORIES: SystemEmployeeAbsenceCategoryDefaults[] =
  [
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
      requiresCertificate: false,
      certificateRequiredFromDay: null,
      maxDaysPerYear: 3,
      defaultPercentage: 100,
      requiresApproval: false,
      color: '#F59E0B',
      iconName: 'baby',
      sortOrder: 30,
      translations: {
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
      requiresApproval: false,
      color: '#8B5CF6',
      iconName: 'truck',
      sortOrder: 60,
      translations: {
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
      requiresApproval: false,
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
      requiresApproval: false,
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
