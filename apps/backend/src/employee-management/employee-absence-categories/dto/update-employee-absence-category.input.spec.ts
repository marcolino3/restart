import { Test } from '@nestjs/testing';
import {
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
} from '@nestjs/graphql';
import { GraphQLInputObjectType, GraphQLSchema } from 'graphql';
import { EmployeeAbsenceCategoriesResolver } from '../employee-absence-categories.resolver';

/**
 * Regression test: `PartialType` copies `@Field({ defaultValue })` metadata
 * from the create input into the update input. GraphQL then fills every
 * omitted field with that default, so a partial update (e.g. translations
 * only) silently reset `allowsDateRange`, `isPaid`, ... to their create
 * defaults — and tripped the "maxDaysPerRequest requires allowsDateRange"
 * guard for categories with a per-request limit. Defaults belong in the
 * service (`input.x ?? default`), never on the input type.
 */
describe('UpdateEmployeeAbsenceCategoryInput (schema)', () => {
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    const factory = app.get(GraphQLSchemaFactory);
    schema = await factory.create([EmployeeAbsenceCategoriesResolver]);
  });

  it.each([
    'UpdateEmployeeAbsenceCategoryInput',
    'CreateEmployeeAbsenceCategoryInput',
  ])('%s declares no field defaults', (typeName) => {
    const type = schema.getType(typeName) as GraphQLInputObjectType;
    expect(type).toBeDefined();
    const withDefaults = Object.values(type.getFields())
      .filter((f) => f.defaultValue !== undefined)
      .map((f) => f.name);
    expect(withDefaults).toEqual([]);
  });
});
