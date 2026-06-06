import DataLoader from 'dataloader';
import { DataSource, In, IsNull } from 'typeorm';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { SchoolClassEnrollment } from '@/school-management/school-class-enrollments/entities/school-class-enrollment.entity';

/**
 * Lädt die aktuelle (aktive, leftAt IS NULL) Klasse pro Schüler in einem
 * einzigen Batch. Resolved das `currentClass`-Feld der Schülerliste.
 *
 * Ohne Batching würde die Schülerliste pro Zeile eine Enrollment-Query
 * absetzen (N+1). Hier sammelt der DataLoader alle Student-IDs eines Requests
 * und holt deren aktive Einschreibungen + Klassen + Stufen in einer Query.
 */
async function batchCurrentClass(
  dataSource: DataSource,
  organizationId: string,
  studentIds: readonly string[],
): Promise<(SchoolClass | null)[]> {
  const enrollments = await dataSource
    .getRepository(SchoolClassEnrollment)
    .find({
      where: {
        studentId: In(studentIds as string[]),
        organizationId,
        isActive: true,
        leftAt: IsNull(),
      },
      relations: ['schoolClass', 'schoolClass.gradeLevels'],
      order: { enrolledAt: 'DESC' },
    });

  // enrolledAt DESC → die erste aktive Einschreibung je Schüler ist die jüngste.
  const byStudent = new Map<string, SchoolClass>();
  for (const enrollment of enrollments) {
    if (!byStudent.has(enrollment.studentId) && enrollment.schoolClass) {
      byStudent.set(enrollment.studentId, enrollment.schoolClass);
    }
  }

  return studentIds.map((id) => byStudent.get(id) ?? null);
}

/**
 * Per-Request DataLoader-Registry für Student-Field-Resolver, gekeyt nach
 * organizationId, damit Multi-Tenant-Isolation innerhalb eines Requests nicht
 * leaken kann. Wird im GraphQL-Context (app.module.ts) pro Request neu erzeugt.
 */
export class StudentEnrollmentLoaders {
  private readonly currentClassLoaderByOrg = new Map<
    string,
    DataLoader<string, SchoolClass | null>
  >();

  constructor(private readonly dataSource: DataSource) {}

  currentClassLoader(
    organizationId: string,
  ): DataLoader<string, SchoolClass | null> {
    let loader = this.currentClassLoaderByOrg.get(organizationId);
    if (!loader) {
      loader = new DataLoader<string, SchoolClass | null>((studentIds) =>
        batchCurrentClass(this.dataSource, organizationId, studentIds),
      );
      this.currentClassLoaderByOrg.set(organizationId, loader);
    }
    return loader;
  }
}