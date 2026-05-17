import DataLoader from 'dataloader';
import { DataSource, In } from 'typeorm';
import { CurriculumNode } from '../entities/curriculum-node.entity';

type ChainRow = { start_id: string; id: string; depth: number };

async function batchAncestors(
  dataSource: DataSource,
  organizationId: string,
  nodeIds: readonly string[],
): Promise<CurriculumNode[][]> {
  const chainRows = await dataSource.query<ChainRow[]>(
    `WITH RECURSIVE chain AS (
       SELECT id AS start_id, id, parent_id, 0 AS depth
         FROM curriculum_nodes
        WHERE id = ANY($1::uuid[])
          AND organization_id = $2
       UNION ALL
       SELECT c.start_id, n.id, n.parent_id, c.depth + 1
         FROM curriculum_nodes n
         JOIN chain c ON n.id = c.parent_id
        WHERE n.organization_id = $2
          AND c.depth < 16
     )
     SELECT start_id::text AS start_id,
            id::text       AS id,
            depth
       FROM chain
      WHERE depth > 0
      ORDER BY start_id, depth ASC`,
    [nodeIds as string[], organizationId],
  );

  if (chainRows.length === 0) {
    return nodeIds.map(() => []);
  }

  const ancestorIds = Array.from(new Set(chainRows.map((r) => r.id)));
  const ancestorNodes = await dataSource.getRepository(CurriculumNode).find({
    where: { id: In(ancestorIds), organizationId },
    relations: ['translations'],
  });
  const byId = new Map(ancestorNodes.map((n) => [n.id, n]));

  const grouped = new Map<string, CurriculumNode[]>();
  for (const row of chainRows) {
    const node = byId.get(row.id);
    if (!node) continue;
    const arr = grouped.get(row.start_id) ?? [];
    arr.push(node);
    grouped.set(row.start_id, arr);
  }

  return nodeIds.map((id) => grouped.get(id) ?? []);
}

/**
 * Per-request DataLoader registry for CurriculumNode field resolvers.
 *
 * `ancestors` was previously resolved with a while-loop of single-row
 * fetches per node, producing O(nodes * depth) queries on heatmap-style
 * pages (~800 queries for a typical classroom). This batches the whole
 * ancestor chain into one recursive CTE + one translations fetch per
 * request, regardless of how many lessons GraphQL asks ancestors for.
 *
 * Loaders are keyed by organizationId so multi-tenant isolation cannot
 * leak across a single request — but in practice each request only
 * touches one org.
 */
export class CurriculumNodeLoaders {
  private readonly ancestorsLoaderByOrg = new Map<
    string,
    DataLoader<string, CurriculumNode[]>
  >();

  constructor(private readonly dataSource: DataSource) {}

  ancestorsLoader(organizationId: string): DataLoader<string, CurriculumNode[]> {
    let loader = this.ancestorsLoaderByOrg.get(organizationId);
    if (!loader) {
      loader = new DataLoader<string, CurriculumNode[]>((nodeIds) =>
        batchAncestors(this.dataSource, organizationId, nodeIds),
      );
      this.ancestorsLoaderByOrg.set(organizationId, loader);
    }
    return loader;
  }
}
