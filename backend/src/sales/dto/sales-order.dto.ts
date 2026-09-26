import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class SalesOrderLineInputDto {
  @IsMongoId() designVariantId!: string;
  @IsNumber() @Min(0.001) qty!: number;
  @IsOptional() @IsNumber() @Min(0) unitRate?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) discountPct?: number;
  @IsOptional() @IsNumber() @Min(0) extraDiscountAmt?: number;
}

export class CreateSalesOrderDto {
  @IsMongoId() customerId!: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SalesOrderLineInputDto)
  lines!: SalesOrderLineInputDto[];
  @IsOptional() @IsString() notes?: string;
}

export class CancelSalesOrderDto {
  @IsString() @MinLength(1) reason!: string;
}
