import { DataSource, FindManyOptions } from 'typeorm';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { SchoolClassEnrollment } from '@/school-management/school-class-enrollments/entities/school-class-enrollment.entity';
import { StudentEnrollmentLoaders } from './student-enrollment-loaders';

type Enrollment = Partial<SchoolClassEnrollment>;

const ORG = 'org-1';
const OTHER_ORG = 'org-2';

const classA = { id: 'class-a', name: 'Klasse A' } as SchoolClass;
const classB = { id: 'class-b', name: 'Klasse B' } as SchoolClass;

const makeDataSource = (rows: Enrollment[]) => {
  const find = jest.fn().mockResolvedValue(rows);
  const dataSource = {
    getRepository: jest.fn().mockReturnValue({ find }),
  } as unknown as DataSource;
  return { dataSource, find };
};

describe('StudentEnrollmentLoaders', () => {
  it('batches many students into a single repository query and maps in input order', async () => {
    const { dataSource, find } = makeDataSource([
      { studentId: 's1', schoolClass: classA, enrolledAt: '2024-08-01' },
      { studentId: 's2', schoolClass: classB, enrolledAt: '2024-08-01' },
    ]);
    const loaders = new StudentEnrollmentLoaders(dataSource);

    const [c1, c2, c3] = await Promise.all([
      loaders.currentClassLoader(ORG).load('s1'),
      loaders.currentClassLoader(ORG).load('s2'),
      loaders.currentClassLoader(ORG).load('s3'),
    ]);

    // One batched query for all three IDs (no N+1).
    expect(find).toHaveBeenCalledTimes(1);
    expect(c1).toBe(classA);
    expect(c2).toBe(classB);
    // No active enrollment → null.
    expect(c3).toBeNull();
  });

  it('picks the most recent active enrollment per student (enrolledAt DESC)', async () => {
    // Repository returns enrolledAt DESC; the first row per student must win.
    const { dataSource } = makeDataSource([
      { studentId: 's1', schoolClass: classB, enrolledAt: '2024-08-01' },
      { studentId: 's1', schoolClass: classA, enrolledAt: '2023-08-01' },
    ]);
    const loaders = new StudentEnrollmentLoaders(dataSource);

    const current = await loaders.currentClassLoader(ORG).load('s1');

    expect(current).toBe(classB);
  });

  it('scopes the query to the org and only active, not-left enrollments', async () => {
    const { dataSource, find } = makeDataSource([]);
    const loaders = new StudentEnrollmentLoaders(dataSource);

    await loaders.currentClassLoader(ORG).load('s1');

    const options = find.mock.calls[0][0] as FindManyOptions<SchoolClassEnrollment>;
    const where = options.where as Record<string, unknown>;
    expect(where.organizationId).toBe(ORG);
    expect(where.isActive).toBe(true);
    // leftAt must be filtered to IS NULL and studentId constrained via IN.
    expect(where.leftAt).toBeDefined();
    expect(where.studentId).toBeDefined();
    expect(options.relations).toContain('schoolClass.gradeLevels');
  });

  it('keeps a separate loader per org so tenants cannot share a cache', async () => {
    const { dataSource } = makeDataSource([]);
    const loaders = new StudentEnrollmentLoaders(dataSource);

    const loaderOrg1 = loaders.currentClassLoader(ORG);
    const loaderOrg2 = loaders.currentClassLoader(OTHER_ORG);

    expect(loaderOrg1).not.toBe(loaderOrg2);
    // Same org returns the memoized instance.
    expect(loaders.currentClassLoader(ORG)).toBe(loaderOrg1);
  });
});
