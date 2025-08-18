import { registerEnumType } from '@nestjs/graphql';

export enum Persona {
  ADMIN = 'ADMIN',
  HR = 'HR',
  OFFICE = 'OFFICE',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  STUDENT = 'STUDENT',
  EMPLOYEE = 'EMPLOYEE',
}

registerEnumType(Persona, { name: 'Persona' });
