import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { DateTime } from 'luxon';
import { TimeTrackingPeriodsService } from '@/employee-management/time-tracking-periods/time-tracking-periods.service';
import { BalanceRecomputeService } from './balance-recompute.service';

/**
 * Nächtlicher Full-Reconcile des materialisierten Ledgers (Safety-Net, Plan §1b).
 *
 * Notwendig für Korrektheit, nicht nur Hygiene: das Ledger wird sonst nur bei
 * Mutationen geschrieben — Tage ohne jegliche Erfassung (fehlende Einträge)
 * hätten keine Zeile und würden im Saldo nicht als Minuszeit erscheinen.
 * Der Cron materialisiert pro Org die laufende Periode vom Stichtag bis heute,
 * idempotent (delete + insert pro Mitarbeiter-Bereich im Recompute).
 */
@Injectable()
export class TimeTrackingReconcileService {
  private readonly logger = new Logger(TimeTrackingReconcileService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly balanceRecompute: BalanceRecomputeService,
    private readonly periods: TimeTrackingPeriodsService,
  ) {}

  @Cron('0 2 * * *', { timeZone: 'Europe/Zurich' })
  async nightlyReconcile(): Promise<void> {
    const started = Date.now();
    const orgs = await this.dataSource.query<{ organization_id: string }[]>(
      `SELECT DISTINCT m.organization_id::text AS organization_id
         FROM employees e
         JOIN memberships m ON m.employee_id = e.id
        WHERE e.time_tracking_enabled = true
          AND e."isActive" = true AND m."isActive" = true`,
    );
    for (const { organization_id: orgId } of orgs) {
      try {
        await this.reconcileOrg(orgId);
      } catch (err) {
        // Eine fehlerhafte Org darf die übrigen nicht blockieren.
        this.logger.error(
          `Reconcile für Org ${orgId} fehlgeschlagen: ${String(err)}`,
        );
      }
    }
    this.logger.log(
      `Nightly reconcile: ${orgs.length} Org(s) in ${Date.now() - started}ms`,
    );
  }

  /** Laufende Periode (Stichtag → heute) einer Org vollständig materialisieren. */
  async reconcileOrg(organizationId: string): Promise<void> {
    const today = DateTime.now().setZone('Europe/Zurich').toISODate() as string;
    const period = await this.periods.ensurePeriodForDate(
      organizationId,
      today,
    );
    await this.balanceRecompute.recomputeOrgRange(
      organizationId,
      period.startDate,
      today,
    );
  }
}
