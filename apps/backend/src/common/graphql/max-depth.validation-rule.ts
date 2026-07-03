import {
  GraphQLError,
  Kind,
  type ASTNode,
  type FragmentDefinitionNode,
  type ValidationContext,
} from 'graphql';

/**
 * Dependency-free query-depth limiter for Apollo/GraphQL.
 *
 * Deeply nested queries (e.g. recursive traversal over self-referential
 * relations like team/curriculum ancestors) can be used to force expensive
 * resolver fan-out — a cheap DoS vector. This validation rule rejects any
 * operation whose selection nesting exceeds `maxDepth` before execution.
 *
 * Introspection fields (`__schema`, `__type`) are ignored so tooling and the
 * dev landing page keep working.
 */
export function createMaxDepthRule(maxDepth: number) {
  return (context: ValidationContext) => {
    const fragments: Record<string, FragmentDefinitionNode> = {};

    for (const def of context.getDocument().definitions) {
      if (def.kind === Kind.FRAGMENT_DEFINITION) {
        fragments[def.name.value] = def;
      }
    }

    const measure = (node: ASTNode, depth: number, seen: Set<string>): void => {
      if (depth > maxDepth) {
        context.reportError(
          new GraphQLError(
            `Query is too deep: depth ${depth} exceeds maximum of ${maxDepth}.`,
            { nodes: [node] },
          ),
        );
        return;
      }

      const selectionSet =
        'selectionSet' in node ? node.selectionSet : undefined;
      if (!selectionSet) return;

      for (const selection of selectionSet.selections) {
        if (selection.kind === Kind.FIELD) {
          // Introspection meta-fields don't count toward user query depth.
          if (selection.name.value.startsWith('__')) continue;
          const nextDepth = selection.selectionSet ? depth + 1 : depth;
          measure(selection, nextDepth, seen);
        } else if (selection.kind === Kind.INLINE_FRAGMENT) {
          measure(selection, depth, seen);
        } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
          const name = selection.name.value;
          // Guard against fragment cycles.
          if (seen.has(name)) continue;
          const fragment = fragments[name];
          if (fragment) {
            measure(fragment, depth, new Set(seen).add(name));
          }
        }
      }
    };

    return {
      OperationDefinition(operation) {
        measure(operation, 0, new Set<string>());
      },
    };
  };
}
