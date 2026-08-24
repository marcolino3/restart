import { registerEnumType } from '@nestjs/graphql';

export enum SystemEmployeeAbsenceCategory {
  VACATION = 'VACATION', // Ferien
  SICKNESS = 'SICKNESS',
  ACCIDENT = 'ACCIDENT',
  CHILDCARE_SICK = 'CHILDCARE_SICK',
  TRAINING = 'TRAINING',
  FUNERAL = 'FUNERAL',
  MOVE = 'MOVE', // Umzug
  MILITARY_SERVICE = 'MILITARY_SERVICE', // Militärdienst
  CIVIL_SERVICE = 'CIVIL_SERVICE', // Ersatzdienst/Zivildienst
  MEDICAL_APPOINTMENT = 'MEDICAL_APPOINTMENT', // Arzttermin
  THERAPY_APPOINTMENT = 'THERAPY_APPOINTMENT', // Therapietermin
  OFFICIAL_APPOINTMENT = 'OFFICIAL_APPOINTMENT', // Behoerdentermin
  WEDDING = 'WEDDING', // Eigene Hochzeit
  COMPENSATION = 'COMPENSATION', // Kompensation von Mehrstunden
  UNPAID_LEAVE = 'UNPAID_LEAVE', // Unbezahlter Urlaub
  OTHER = 'OTHER',
}

registerEnumType(SystemEmployeeAbsenceCategory, {
  name: 'SystemEmployeeAbsenceCategory',
  description: 'Supported System Employee Absence Category',
});
