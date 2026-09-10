import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class GenerateContractDocumentDto {
  @IsUUID()
  contractId: string;

  // The (possibly user-adjusted) rendered HTML from the review editor. It is
  // sanitized again server-side before any rendering.
  @IsString()
  @MaxLength(500_000)
  html: string;

  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  headerHtml?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  footerHtml?: string;

  @IsOptional()
  @IsBoolean()
  showLogo?: boolean;

  @IsIn(['pdf', 'docx'])
  format: 'pdf' | 'docx';
}
