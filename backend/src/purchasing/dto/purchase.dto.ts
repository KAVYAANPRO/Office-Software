import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PurchaseLineInputDto {
  @IsMongoId() materialVariantId!: string;
  @IsMongoId() uomId!: string;
  @IsNumber() @Min(0.001) qty!: number;
  @IsNumber() @Min(0) rate!: number;
}

export class CreatePurchaseDto {
  @IsMongoId() supplierId!: string;
  @IsOptional() @IsString() supplierInvoiceNo?: string;
  @IsOptional() @IsNumber() @Min(0) otherCharges?: number;
  @IsOptional() @IsString() notes?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineInputDto)
  lines!: PurchaseLineInputDto[];
}

export class UpdatePurchaseDto {
  @IsOptional() @IsString() supplierInvoiceNo?: string;
  @IsOptional() @IsNumber() @Min(0) otherCharges?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineInputDto)
  lines?: PurchaseLineInputDto[];
}

export class CancelPurchaseDto {
  @IsString() @MinLength(1) reason!: string;
}
