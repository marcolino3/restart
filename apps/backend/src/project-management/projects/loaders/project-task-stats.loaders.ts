import DataLoader from 'dataloader';
import { DataSource, In } from 'typeorm';
import { Task } from '@/project-management/tasks/entities/task.entity';
import { TaskStatus } from '@/project-management/tasks/entities/task-status.enum';
import { ProjectTaskStats } from '../entities/project-task-stats.output';

/**
 * Batcht die Aufgaben-Zähler (total/done) aller Projekte eines Requests in
 * eine einzige GROUP-BY-Query. Ohne Batching würde die Projektliste pro Karte
 * zwei COUNT-Queries absetzen (N+1).
 */
async function batchTaskStats(
  dataSource: DataSource,
  organizationId: string,
  projectIds: readonly string[],
): Promise<ProjectTaskStats[]> {
  const rows = await dataSource
    .getRepository(Task)
    .createQueryBuilder('task')
    .select('task.project_id', 'projectId')
    .addSelect('COUNT(*)::int', 'total')
    .addSelect(
      `COUNT(*) FILTER (WHERE task.status = :done)::int`,
      'done',
    )
    .where({ projectId: In(projectIds as string[]), organizationId })
    .andWhere('task."isActive" = true')
    .setParameter('done', TaskStatus.DONE)
    .groupBy('task.project_id')
    .getRawMany<{ projectId: string; total: number; done: number }>();

  const byProject = new Map(rows.map((r) => [r.projectId, r]));
  return projectIds.map((id) => {
    const row = byProject.get(id);
    return { total: row?.total ?? 0, done: row?.done ?? 0 };
  });
}

/**
 * Per-Request DataLoader-Registry für Projekt-Field-Resolver, gekeyt nach
 * organizationId, damit Multi-Tenant-Isolation innerhalb eines Requests nicht
 * leaken kann. Wird im GraphQL-Context (app.module.ts) pro Request neu erzeugt.
 */
export class ProjectTaskStatsLoaders {
  private readonly statsLoaderByOrg = new Map<
    string,
    DataLoader<string, ProjectTaskStats>
  >();

  constructor(private readonly dataSource: DataSource) {}

  statsLoader(organizationId: string): DataLoader<string, ProjectTaskStats> {
    let loader = this.statsLoaderByOrg.get(organizationId);
    if (!loader) {
      loader = new DataLoader((projectIds) =>
        batchTaskStats(this.dataSource, organizationId, projectIds),
      );
      this.statsLoaderByOrg.set(organizationId, loader);
    }
    return loader;
  }
}
