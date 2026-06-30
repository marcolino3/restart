import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { BalanceRecomputeService } from './balance-recompute.service';

/**
 * Berechnungs-Kern der Arbeitszeiterfassung: reine Engine (work-time-calculation.ts)
 * + Ledger-Recompute-Service. Andere Module injizieren BalanceRecomputeService,
 * um nach Mutationen (Zeiteintrag, Absenz, Ferien, Feiertag, Vertrag) das
 * materialisierte Tages-Ledger gezielt neu zu berechnen.
 */
@Module({
  imports: [DatabaseModule],
  providers: [BalanceRecomputeService],
  exports: [BalanceRecomputeService],
})
export class WorkTimeCalculationModule {}
