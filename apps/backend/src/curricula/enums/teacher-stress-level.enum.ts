import { registerEnumType } from '@nestjs/graphql';

/**
 * LK-Selbstbeobachtung: Eigener Stresslevel der Lehrkraft während der Lektion.
 */
export enum TeacherStressLevel {
  RELAXED = 'RELAXED',
  NORMAL = 'NORMAL',
  STRESSED = 'STRESSED',
}

registerEnumType(TeacherStressLevel, {
  name: 'TeacherStressLevel',
  description: 'LK-Stresslevel: RELAXED / NORMAL / STRESSED.',
});
