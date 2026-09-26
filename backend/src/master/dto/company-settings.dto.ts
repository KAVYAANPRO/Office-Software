import { IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class UpdateCompanySettingsDto {
  @IsOptional() @IsString() @MinLength(1) legalName?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() gstin?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() currentFinancialYear?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) overReceiptTolerancePct?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) shortageTolerancePct?: number;
}
