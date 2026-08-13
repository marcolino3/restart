import { registerEnumType } from '@nestjs/graphql';

/**
 * External calendar backends an absence can be mirrored to. Persisted as a
 * plain varchar (not a PG enum) so adding a provider never needs an
 * `ALTER TYPE … ADD VALUE` migration — see the 55P04 rule in CLAUDE.md.
 */
export enum CalendarProvider {
  GOOGLE = 'GOOGLE',
}

registerEnumType(CalendarProvider, { name: 'CalendarProvider' });
