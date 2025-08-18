import { registerEnumType } from '@nestjs/graphql';

export enum SystemEmployeeAbsenceCategory {
  SICKNESS = 'SICKNESS',
  ACCIDENT = 'ACCIDENT',
  CHILDCARE_SICK = 'CHILDCARE_SICK',
  TRAINING = 'TRAINING',
  FUNERAL = 'FUNERAL',
  MOVE = 'MOVE', // Umzug
  MILITARY_SERVICE = 'MILITARY_SERVICE', // Militärdienst
  CIVIL_SERVICE = 'CIVIL_SERVICE', // Ersatzdienst/Zivildienst
  OTHER = 'OTHER',
}

registerEnumType(SystemEmployeeAbsenceCategory, {
  name: 'SystemEmployeeAbsenceCategory',
  description: 'Supported System Employee Absence Category',
});
