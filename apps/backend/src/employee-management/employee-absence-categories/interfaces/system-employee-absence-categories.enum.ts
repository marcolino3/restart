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
  COMPENSATION = 'COMPENSATION', // Kompensation von Mehrstunden
  UNPAID_LEAVE = 'UNPAID_LEAVE', // Unbezahlter Urlaub
  OTHER = 'OTHER',
}

registerEnumType(SystemEmployeeAbsenceCategory, {
  name: 'SystemEmployeeAbsenceCategory',
  description: 'Supported System Employee Absence Category',
});
