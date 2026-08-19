import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { OrganizationProfileInput } from './organization-profile.input';
import {
  CareModel,
  EducationLevel,
  SchoolType,
  Sponsorship,
} from '@restart/shared-schemas/organizations/organization-enums';

/**
 * The classification columns are plain varchars (CLAUDE.md 55P04 rule), so the
 * database accepts anything. `@IsIn` is the only thing keeping typos out of
 * them — these tests guard exactly that.
 */
describe('OrganizationProfileInput classification validation', () => {
  const validateInput = (input: Partial<OrganizationProfileInput>) =>
    validate(plainToInstance(OrganizationProfileInput, input));

  const propertiesOf = async (input: Partial<OrganizationProfileInput>) =>
    (await validateInput(input)).map((error) => error.property);

  it('accepts the full set of valid classification values', async () => {
    expect(
      await validateInput({
        name: 'Montessori Rietberg',
        sponsorship: Sponsorship.PRIVAT_ANERKANNT,
        schoolType: SchoolType.MONTESSORI,
        careModel: CareModel.TAGESSCHULE,
        activeLevels: [
          EducationLevel.KINDERGARTEN_CASA,
          EducationLevel.PRIMARSTUFE,
        ],
        language: 'de-CH',
        contactSalutation: 'MRS',
      }),
    ).toEqual([]);
  });

  it.each([
    ['sponsorship', { sponsorship: 'STAATLICH' }],
    ['schoolType', { schoolType: 'TAGESSCHULE' }],
    ['careModel', { careModel: 'GANZTAGS' }],
    ['language', { language: 'de-XX' }],
    ['contactSalutation', { contactSalutation: 'HERR' }],
  ])('rejects an invalid %s', async (property, input) => {
    expect(await propertiesOf(input)).toContain(property);
  });

  it('rejects an unknown education level inside activeLevels', async () => {
    expect(await propertiesOf({ activeLevels: ['TERTIAERSTUFE'] })).toContain(
      'activeLevels',
    );
  });

  it('accepts an empty activeLevels array', async () => {
    expect(await validateInput({ activeLevels: [] })).toEqual([]);
  });
});
