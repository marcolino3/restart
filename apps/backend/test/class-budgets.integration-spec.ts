/**
 * Integration tests for the class budget module against a real PostgreSQL
 * database: multi-tenant isolation, teacher class scoping, school-year
 * boundaries, budget maths and the DB constraints.
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=class-budgets
 */
import { DataSource, Repository } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Module,
  NotFoundException,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';

import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Persona } from '@/common/enums/persona.enum';
import { SchoolClassTeacherRole } from '@/database/enums/school-class-teacher-role.enum';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { ClassBudgetAccessService } from '@/school-management/class-budgets/class-budget-access.service';
import { ClassBudgetsService } from '@/school-management/class-budgets/class-budgets.service';
import { ClassExpensesService } from '@/school-management/class-budgets/class-expenses.service';
import { ClassBudget } from '@/school-management/class-budgets/entities/class-budget.entity';
import { ClassExpense } from '@/school-management/class-budgets/entities/class-expense.entity';
import { ExpenseCategory } from '@/school-management/class-budgets/entities/expense-category.entity';
import { ExpenseCategoriesService } from '@/school-management/class-budgets/expense-categories.service';
import { GradeLevel } from '@/school-management/grade-levels/entities/grade-level.entity';
import { SchoolClassTeacher } from '@/school-management/school-classes/entities/school-class-teacher.entity';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import {
  addDays,
  schoolYearFor,
  today,
} from '@/school-management/school-classes/lib/school-year';
import { SchoolClassesService } from '@/school-management/school-classes/school-classes.service';
import { User } from '@/users/entities/user.entity';
import { cleanDatabase, createTestingApp } from './test-utils';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClassBudget,
      ClassExpense,
      ExpenseCategory,
      SchoolClass,
      SchoolClassTeacher,
      GradeLevel,
      Employee,
      Organization,
    ]),
  ],
  providers: [
    SchoolClassesService,
    ClassBudgetAccessService,
    ClassBudgetsService,
    ClassExpensesService,
    ExpenseCategoriesService,
  ],
})
class ClassBudgetsTestModule {}

describe('Class budgets (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let budgets: ClassBudgetsService;
  let expenses: ClassExpensesService;
  let categories: ExpenseCategoriesService;

  let orgRepo: Repository<Organization>;
  let userRepo: Repository<User>;
  let membershipRepo: Repository<Membership>;
  let employeeRepo: Repository<Employee>;
  let classRepo: Repository<SchoolClass>;
  let assignmentRepo: Repository<SchoolClassTeacher>;
  let categoryRepo: Repository<ExpenseCategory>;
  let budgetRepo: Repository<ClassBudget>;

  let orgId: string;
  let otherOrgId: string;

  // Org default cut-off is 1 August.
  const current = schoolYearFor(today(), {
    schoolYearStartMonth: 8,
    schoolYearStartDay: 1,
  });
  const YEAR = current.startYear;
  const lastDayOfPreviousYear = addDays(current.start, -1);

  const admin = (organizationId: string): TokenPayload => ({
    sub: '00000000-0000-4000-8000-000000000001',
    orgId: organizationId,
    roles: ['ORG_ADMIN'],
    permissions: [
      'CLASS_BUDGET_MANAGE',
      'CLASS_EXPENSE_READ',
      'CLASS_EXPENSE_WRITE',
    ],
  });

  const createTeacher = async (
    firstName: string,
    organizationId = orgId,
  ): Promise<{ token: TokenPayload; employeeId: string }> => {
    const user = await userRepo.save(
      userRepo.create({ firstName, lastName: 'Test' }),
    );
    const employee = await employeeRepo.save(
      employeeRepo.create({
        organizationId,
        profile: { firstName, lastName: 'Test' },
        accountLinkStatus: 'LEGACY',
      }),
    );
    const membership = await membershipRepo.save(
      membershipRepo.create({
        organizationId,
        userId: user.id,
        employeeId: employee.id,
        persona: Persona.TEACHER,
      }),
    );
    return {
      employeeId: employee.id,
      token: {
        sub: user.id,
        orgId: organizationId,
        membershipId: membership.id,
        roles: ['EMPLOYEE'],
        permissions: ['CLASS_EXPENSE_READ', 'CLASS_EXPENSE_WRITE'],
      },
    };
  };

  const createClass = (name: string, organizationId = orgId) =>
    classRepo.save(classRepo.create({ name, organizationId }));

  const assignTeacher = (
    schoolClassId: string,
    employeeId: string,
    organizationId = orgId,
  ) =>
    assignmentRepo.save(
      assignmentRepo.create({
        schoolClassId,
        employeeId,
        organizationId,
        role: SchoolClassTeacherRole.LEAD,
        validFrom: '2020-08-01',
        validTo: null,
      }),
    );

  const createCategory = (name: string, organizationId = orgId) =>
    categories.create({ name }, organizationId);

  beforeAll(async () => {
    const app = await createTestingApp([ClassBudgetsTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    budgets = module.get(ClassBudgetsService);
    expenses = module.get(ClassExpensesService);
    categories = module.get(ExpenseCategoriesService);

    orgRepo = dataSource.getRepository(Organization);
    userRepo = dataSource.getRepository(User);
    membershipRepo = dataSource.getRepository(Membership);
    employeeRepo = dataSource.getRepository(Employee);
    classRepo = dataSource.getRepository(SchoolClass);
    assignmentRepo = dataSource.getRepository(SchoolClassTeacher);
    categoryRepo = dataSource.getRepository(ExpenseCategory);
    budgetRepo = dataSource.getRepository(ClassBudget);
  }, 30000);

  afterAll(async () => {
    await dataSource?.destroy();
    await module?.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    const org = await orgRepo.save(
      orgRepo.create({ name: 'Testschule', subdomain: `t${Date.now()}` }),
    );
    orgId = org.id;
    const other = await orgRepo.save(
      orgRepo.create({ name: 'Fremdschule', subdomain: `f${Date.now()}` }),
    );
    otherOrgId = other.id;
  });

  describe('multi-tenant isolation', () => {
    it('refuses a budget for a class of another organization', async () => {
      const foreignClass = await createClass('Fremdklasse', otherOrgId);

      await expect(
        budgets.upsert(
          {
            schoolClassId: foreignClass.id,
            schoolYearStart: YEAR,
            amount: 100,
          },
          orgId,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(await budgetRepo.count()).toBe(0);
    });

    it('refuses an expense on a class of another organization, even for an admin', async () => {
      const foreignClass = await createClass('Fremdklasse', otherOrgId);
      const category = await createCategory('Material');

      await expect(
        expenses.create(
          {
            schoolClassId: foreignClass.id,
            categoryId: category.id,
            expenseDate: current.start,
            amount: 10,
          },
          orgId,
          admin(orgId),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuses an expense that uses a category of another organization', async () => {
      const ownClass = await createClass('Klasse A');
      const foreignCategory = await createCategory(
        'Fremdkategorie',
        otherOrgId,
      );

      await expect(
        expenses.create(
          {
            schoolClassId: ownClass.id,
            categoryId: foreignCategory.id,
            expenseDate: current.start,
            amount: 10,
          },
          orgId,
          admin(orgId),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('hides expenses, summaries and categories of another organization', async () => {
      const foreignClass = await createClass('Fremdklasse', otherOrgId);
      const foreignCategory = await createCategory(
        'Fremdkategorie',
        otherOrgId,
      );
      const foreignExpense = await expenses.create(
        {
          schoolClassId: foreignClass.id,
          categoryId: foreignCategory.id,
          expenseDate: current.start,
          amount: 99,
        },
        otherOrgId,
        admin(otherOrgId),
      );

      expect(
        await expenses.findAll({ schoolYearStart: YEAR }, orgId, admin(orgId)),
      ).toEqual([]);
      expect(await categories.findAllByOrgId(orgId, true)).toEqual([]);
      await expect(
        expenses.findOne(foreignExpense.id, orgId, admin(orgId)),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        expenses.remove(foreignExpense.id, orgId, admin(orgId)),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        budgets.summary(foreignClass.id, YEAR, orgId, admin(orgId)),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        categories.update({ id: foreignCategory.id, name: 'Gekapert' }, orgId),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        categories.reorder([foreignCategory.id], orgId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('allows the same category name in two organizations but not twice in one', async () => {
      await createCategory('Material');
      await expect(
        createCategory('Material', otherOrgId),
      ).resolves.toBeDefined();
      await expect(createCategory('Material')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('teacher class scoping', () => {
    it('limits a teacher to the classes they teach', async () => {
      const anna = await createTeacher('Anna');
      const classA = await createClass('Klasse A');
      const classB = await createClass('Klasse B');
      await assignTeacher(classA.id, anna.employeeId);
      const category = await createCategory('Material');
      const input = {
        categoryId: category.id,
        expenseDate: current.start,
        amount: 25,
      };
      await expenses.create(
        { ...input, schoolClassId: classB.id },
        orgId,
        admin(orgId),
      );

      await expect(
        expenses.create(
          { ...input, schoolClassId: classB.id },
          orgId,
          anna.token,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        budgets.summary(classB.id, YEAR, orgId, anna.token),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        expenses.findAll(
          { schoolYearStart: YEAR, schoolClassId: classB.id },
          orgId,
          anna.token,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      const own = await expenses.create(
        { ...input, schoolClassId: classA.id },
        orgId,
        anna.token,
      );
      const visible = await expenses.findAll(
        { schoolYearStart: YEAR },
        orgId,
        anna.token,
      );
      expect(visible.map((expense) => expense.id)).toEqual([own.id]);
      expect(own.createdByMembershipId).toBe(anna.token.membershipId);
    });

    it('does not let a teacher move an expense into a class they do not teach', async () => {
      const anna = await createTeacher('Anna');
      const classA = await createClass('Klasse A');
      const classB = await createClass('Klasse B');
      await assignTeacher(classA.id, anna.employeeId);
      const category = await createCategory('Material');
      const own = await expenses.create(
        {
          schoolClassId: classA.id,
          categoryId: category.id,
          expenseDate: current.start,
          amount: 25,
        },
        orgId,
        anna.token,
      );

      await expect(
        expenses.update(
          { id: own.id, schoolClassId: classB.id },
          orgId,
          anna.token,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lets a teacher change only their own expenses of the running school year', async () => {
      const anna = await createTeacher('Anna');
      const ben = await createTeacher('Ben');
      const classA = await createClass('Klasse A');
      await assignTeacher(classA.id, anna.employeeId);
      await assignTeacher(classA.id, ben.employeeId);
      const category = await createCategory('Material');
      const base = { schoolClassId: classA.id, categoryId: category.id };

      const bens = await expenses.create(
        { ...base, expenseDate: current.start, amount: 10 },
        orgId,
        ben.token,
      );
      const annasClosedYear = await expenses.create(
        { ...base, expenseDate: lastDayOfPreviousYear, amount: 10 },
        orgId,
        anna.token,
      );
      const annasCurrent = await expenses.create(
        { ...base, expenseDate: current.end, amount: 10 },
        orgId,
        anna.token,
      );

      await expect(
        expenses.update({ id: bens.id, amount: 1 }, orgId, anna.token),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        expenses.remove(bens.id, orgId, anna.token),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        expenses.update(
          { id: annasClosedYear.id, amount: 1 },
          orgId,
          anna.token,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      const updated = await expenses.update(
        { id: annasCurrent.id, amount: 12.5 },
        orgId,
        anna.token,
      );
      expect(updated.amount).toBe(12.5);

      // A budget manager may change any of them.
      await expect(
        expenses.update({ id: bens.id, amount: 11 }, orgId, admin(orgId)),
      ).resolves.toMatchObject({ amount: 11 });
      await expect(
        expenses.remove(annasClosedYear.id, orgId, admin(orgId)),
      ).resolves.toBeDefined();
    });
  });

  describe('summary', () => {
    it('sums per category inside the school year boundaries only', async () => {
      const classA = await createClass('Klasse A');
      const material = await createCategory('Material');
      const trips = await createCategory('Ausflüge');
      await budgets.upsert(
        { schoolClassId: classA.id, schoolYearStart: YEAR, amount: 100 },
        orgId,
      );
      const book = (categoryId: string, expenseDate: string, amount: number) =>
        expenses.create(
          { schoolClassId: classA.id, categoryId, expenseDate, amount },
          orgId,
          admin(orgId),
        );
      await book(material.id, current.start, 0.1); // first day counts
      await book(material.id, current.end, 0.2); // last day counts
      await book(trips.id, current.start, 40);
      await book(trips.id, lastDayOfPreviousYear, 500); // previous year
      await book(trips.id, addDays(current.end, 1), 500); // next year

      const summary = await budgets.summary(
        classA.id,
        YEAR,
        orgId,
        admin(orgId),
      );

      expect(summary.schoolYear).toMatchObject({
        start: current.start,
        end: current.end,
        startYear: YEAR,
      });
      expect(summary.budget).toBe(100);
      expect(summary.spent).toBe(40.3);
      expect(summary.remaining).toBe(59.7);
      expect(summary.isOverBudget).toBe(false);
      expect(
        summary.byCategory.map((row) => [row.category.name, row.total]),
      ).toEqual([
        ['Material', 0.3],
        ['Ausflüge', 40],
      ]);

      const previous = await budgets.summary(
        classA.id,
        YEAR - 1,
        orgId,
        admin(orgId),
      );
      expect(previous.spent).toBe(500);
      expect(previous.budget).toBeNull();
      expect(previous.isOverBudget).toBe(false);
    });

    it('flags an overrun without blocking the expense', async () => {
      const classA = await createClass('Klasse A');
      const material = await createCategory('Material');
      await budgets.upsert(
        { schoolClassId: classA.id, schoolYearStart: YEAR, amount: 50 },
        orgId,
      );

      await expect(
        expenses.create(
          {
            schoolClassId: classA.id,
            categoryId: material.id,
            expenseDate: current.start,
            amount: 50.01,
          },
          orgId,
          admin(orgId),
        ),
      ).resolves.toBeDefined();

      const summary = await budgets.summary(
        classA.id,
        YEAR,
        orgId,
        admin(orgId),
      );
      expect(summary.isOverBudget).toBe(true);
      expect(summary.remaining).toBe(-0.01);
    });

    it('keeps archived categories in the breakdown of booked expenses', async () => {
      const classA = await createClass('Klasse A');
      const material = await createCategory('Material');
      await expenses.create(
        {
          schoolClassId: classA.id,
          categoryId: material.id,
          expenseDate: current.start,
          amount: 5,
        },
        orgId,
        admin(orgId),
      );
      await categories.archive(material.id, orgId);

      const summary = await budgets.summary(
        classA.id,
        YEAR,
        orgId,
        admin(orgId),
      );
      expect(summary.byCategory).toHaveLength(1);
      expect(await categories.findAllByOrgId(orgId)).toEqual([]);
    });
  });

  describe('budgets', () => {
    it('upserts one budget per class and school year', async () => {
      const classA = await createClass('Klasse A');
      const input = { schoolClassId: classA.id, schoolYearStart: YEAR };

      const created = await budgets.upsert({ ...input, amount: 100 }, orgId);
      const updated = await budgets.upsert(
        { ...input, amount: 250.5, note: 'Erhöht' },
        orgId,
      );

      expect(updated.id).toBe(created.id);
      expect(await budgetRepo.count()).toBe(1);
      const [stored] = await budgets.findAllByOrgId(orgId, YEAR);
      expect(stored).toMatchObject({ amount: 250.5, note: 'Erhöht' });
    });

    it('rejects a duplicate budget row at the database level', async () => {
      const classA = await createClass('Klasse A');
      const row = {
        organizationId: orgId,
        schoolClassId: classA.id,
        schoolYearStart: YEAR,
        amount: 1,
        currency: 'CHF',
      };
      await budgetRepo.insert(row);
      await expect(budgetRepo.insert(row)).rejects.toThrow();
    });

    it('copies last year only into classes without a budget, within the org', async () => {
      const classA = await createClass('Klasse A');
      const classB = await createClass('Klasse B');
      const foreignClass = await createClass('Fremdklasse', otherOrgId);
      const upsert = (
        schoolClassId: string,
        schoolYearStart: number,
        amount: number,
        organizationId = orgId,
      ) =>
        budgets.upsert(
          { schoolClassId, schoolYearStart, amount },
          organizationId,
        );
      await upsert(classA.id, YEAR - 1, 100);
      await upsert(classB.id, YEAR - 1, 200);
      await upsert(classB.id, YEAR, 999); // must survive
      await upsert(foreignClass.id, YEAR - 1, 300, otherOrgId);

      const result = await budgets.copyFromPreviousYear(orgId, YEAR);

      expect(
        result
          .map((budget) => [budget.schoolClassId, budget.amount])
          .sort((a, b) => Number(a[1]) - Number(b[1])),
      ).toEqual([
        [classA.id, 100],
        [classB.id, 999],
      ]);
      expect(await budgets.findAllByOrgId(otherOrgId, YEAR)).toEqual([]);
    });

    it('lists the school years that hold data for the caller, newest first', async () => {
      const classA = await createClass('Klasse A');
      const material = await createCategory('Material');
      await budgets.upsert(
        { schoolClassId: classA.id, schoolYearStart: YEAR - 3, amount: 10 },
        orgId,
      );
      await expenses.create(
        {
          schoolClassId: classA.id,
          categoryId: material.id,
          expenseDate: lastDayOfPreviousYear,
          amount: 5,
        },
        orgId,
        admin(orgId),
      );

      const years = await budgets.availableSchoolYears(orgId, admin(orgId));

      expect(years.map((year) => year.startYear)).toEqual([
        YEAR,
        YEAR - 1,
        YEAR - 3,
      ]);
    });
  });

  describe('categories', () => {
    it('rejects new expenses on an archived category', async () => {
      const classA = await createClass('Klasse A');
      const material = await createCategory('Material');
      await categories.archive(material.id, orgId);

      await expect(
        expenses.create(
          {
            schoolClassId: classA.id,
            categoryId: material.id,
            expenseDate: current.start,
            amount: 5,
          },
          orgId,
          admin(orgId),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('cannot hard-delete a category that still has expenses (FK RESTRICT)', async () => {
      const classA = await createClass('Klasse A');
      const material = await createCategory('Material');
      await expenses.create(
        {
          schoolClassId: classA.id,
          categoryId: material.id,
          expenseDate: current.start,
          amount: 5,
        },
        orgId,
        admin(orgId),
      );

      await expect(categoryRepo.delete({ id: material.id })).rejects.toThrow();
    });

    it('appends new categories and reorders them', async () => {
      const first = await createCategory('Material');
      const second = await createCategory('Ausflüge');
      expect([first.position, second.position]).toEqual([0, 1]);

      const reordered = await categories.reorder([second.id, first.id], orgId);

      expect(reordered.map((category) => category.name)).toEqual([
        'Ausflüge',
        'Material',
      ]);
    });
  });
});
