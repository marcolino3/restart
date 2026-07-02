import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { WorkTimeReportService } from './work-time-report.service';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * PDF-Export der Arbeitszeitauswertung: GET /api/time-tracking/report
 * (REST statt GraphQL wegen Binär-Antwort). Zugriffs-Scoping läuft
 * service-seitig über TimeTrackingAccessService (self/Admin/Lead).
 */
@Controller('time-tracking')
export class WorkTimeReportController {
  constructor(private readonly reportService: WorkTimeReportService) {}

  @Get('report')
  @UseGuards(BetterAuthGuard)
  async report(
    @CurrentUser() user: TokenPayload,
    @Res() res: Response,
    @Query('employeeId') employeeId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('locale') locale?: string,
  ): Promise<void> {
    if (!employeeId) throw new BadRequestException('employeeId is required');
    if (!ISO_DATE.test(from ?? '') || !ISO_DATE.test(to ?? '')) {
      throw new BadRequestException('from/to must be YYYY-MM-DD');
    }
    const reportLocale = locale?.toUpperCase() === 'EN' ? 'EN' : 'DE';
    const { buffer, filename } =
      await this.reportService.buildEmployeeReportPdf(
        user,
        employeeId,
        from,
        to,
        reportLocale,
      );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(buffer);
  }
}
