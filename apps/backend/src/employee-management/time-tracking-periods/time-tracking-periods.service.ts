import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { OrganizationSettingsService } from '@/organization-settings/organization-settings.service';
import {
  TimeTrackingPeriod,
  TimeTrackingPeriodStatus,
} from './entities/time-tracking-period.entity';

const PERIOD_ANCHOR_KEY = 'TIMETRACKING_PERIOD_ANCHOR';
const DEFAULT_ANCHOR = '01-01';

@Injectable()
export class TimeTrackingPeriodsService {
  constructor(
    @InjectRepository(TimeTrackingPeriod)
    private readonly repo: Repository<TimeTrackingPeriod>,
    private readonly orgSettings: OrganizationSettingsService,
  ) {}

  findAll(organizationId: string): Promise<TimeTrackingPeriod[]> {
    return this.repo.find({
      where: { organizationId, isActive: true },
      order: { startDate: 'DESC' },
    });
  }

  /** Org-Stichtag (MM-DD) aus den verschlüsselten Settings, Default 01-01. */
  private async getAnchor(organizationId: string): Promise<{
    month: number;
    day: number;
  }> {
    const raw =
      (await this.orgSettings.getDecryptedValue(
        organizationId,
        PERIOD_ANCHOR_KEY,
      )) ?? DEFAULT_ANCHOR;
    const [mm, dd] = raw.split('-').map((s) => parseInt(s, 10));
    const month = Number.isInteger(mm) && mm >= 1 && mm <= 12 ? mm : 1;
    const day = Number.isInteger(dd) && dd >= 1 && dd <= 31 ? dd : 1;
    return { month, day };
  }

  /** [start,end] der Periode, die `date` enthält, anhand des Stichtags. */
  private periodBounds(
    anchor: { month: number; day: number },
    date: DateTime,
  ): { start: DateTime; end: DateTime } {
    let start = DateTime.fromObject({
      year: date.year,
      month: anchor.month,
      day: anchor.day,
    });
    if (date < start) start = start.minus({ years: 1 });
    const end = start.plus({ years: 1 }).minus({ days: 1 });
    return { start, end };
  }

  private buildLabel(start: DateTime, end: DateTime): string {
    return start.year === end.year
      ? `${start.year}`
      : `${start.year}/${String(end.year).slice(2)}`;
  }

  /** Erzeugt (idempotent) die Periode, die das angegebene Datum enthält. */
  async ensurePeriodForDate(
    organizationId: string,
    isoDate: string,
  ): Promise<TimeTrackingPeriod> {
    const anchor = await this.getAnchor(organizationId);
    const { start, end } = this.periodBounds(anchor, DateTime.fromISO(isoDate));
    const startDate = start.toISODate() as string;
    const existing = await this.repo.findOne({
      where: { organizationId, startDate, isActive: true },
    });
    if (existing) return existing;
    const period = this.repo.create({
      organizationId,
      startDate,
      endDate: end.toISODate() as string,
      label: this.buildLabel(start, end),
      status: TimeTrackingPeriodStatus.OPEN,
    });
    return this.repo.save(period);
  }

  /**
   * Wirft, wenn der Datumsbereich eine GESPERRTE Periode berührt. Von allen
   * Schreibpfaden der Zeiterfassung (Einträge, Absenzen, Ferien) aufzurufen —
   * zum Ändern muss ein Admin die Periode zuerst wieder öffnen.
   */
  async assertRangeUnlocked(
    organizationId: string,
    fromDate: string,
    toDate: string,
  ): Promise<void> {
    const locked = await this.repo.findOne({
      where: {
        organizationId,
        isActive: true,
        status: TimeTrackingPeriodStatus.LOCKED,
        startDate: LessThanOrEqual(toDate),
        endDate: MoreThanOrEqual(fromDate),
      },
    });
    if (locked) {
      throw new BadRequestException(
        `Die Abrechnungsperiode ${locked.label} ist gesperrt.`,
      );
    }
  }

  async setStatus(
    id: string,
    organizationId: string,
    status: TimeTrackingPeriodStatus,
  ): Promise<TimeTrackingPeriod> {
    const period = await this.repo.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!period) throw new NotFoundException(`Period ${id} not found`);
    period.status = status;
    return this.repo.save(period);
  }
}
