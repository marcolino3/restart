import { parse, validate, buildSchema } from 'graphql';
import { createMaxDepthRule } from './max-depth.validation-rule';

const schema = buildSchema(`
  type Node {
    id: ID!
    child: Node
  }
  type Query {
    root: Node
  }
`);

function depthErrors(query: string, maxDepth: number): string[] {
  const rule = createMaxDepthRule(maxDepth);
  return validate(schema, parse(query), [rule]).map((e) => e.message);
}

describe('createMaxDepthRule', () => {
  it('accepts a query within the depth limit', () => {
    const query = `{ root { child { id } } }`; // depth 2
    expect(depthErrors(query, 3)).toHaveLength(0);
  });

  it('rejects a query exceeding the depth limit', () => {
    const query = `{ root { child { child { child { id } } } } }`; // depth 4
    const errors = depthErrors(query, 3);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/too deep/);
  });

  it('does not count introspection meta-fields toward depth', () => {
    const query = `{ __schema { types { name } } }`;
    expect(depthErrors(query, 1)).toHaveLength(0);
  });

  it('resolves depth through fragments without infinite recursion', () => {
    const query = `
      { root { ...NodeFields } }
      fragment NodeFields on Node { child { child { id } } }
    `; // depth 3 via fragment
    expect(depthErrors(query, 3)).toHaveLength(0);
    expect(depthErrors(query, 2).length).toBeGreaterThan(0);
  });
});
