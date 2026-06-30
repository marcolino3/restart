import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { TeamsModule } from '@/employee-management/teams/teams.module';
import { BalanceRecomputeService } from './balance-recompute.service';
import { WorkTimeBalanceService } from './work-time-balance.service';
import { WorkTimeBalanceResolver } from './work-time-balance.resolver';
import { TimeTrackingAccessService } from './time-tracking-access.service';

/**
 * Berechnungs-Kern der Arbeitszeiterfassung: reine Engine (work-time-calculation.ts)
 * + Ledger-Recompute-Service + Saldo-/Auswertungs-Read-API. Andere Module
 * injizieren BalanceRecomputeService, um nach Mutationen (Zeiteintrag, Absenz,
 * Ferien, Feiertag, Vertrag) das materialisierte Tages-Ledger gezielt neu zu
 * berechnen.
 */
@Module({
  imports: [DatabaseModule, TeamsModule],
  providers: [
    BalanceRecomputeService,
    WorkTimeBalanceService,
    WorkTimeBalanceResolver,
    TimeTrackingAccessService,
  ],
  exports: [
    BalanceRecomputeService,
    WorkTimeBalanceService,
    TimeTrackingAccessService,
  ],
})
export class WorkTimeCalculationModule {}
