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

export class JobReceiptLineInputDto {
  @IsOptional() @IsMongoId() colourId?: string;
  @IsOptional() @IsMongoId() sizeId?: string;
  @IsOptional() @IsMongoId() materialVariantId?: string;

  @IsNumber() @Min(0) receivedQty!: number;
  @IsOptional() @IsNumber() @Min(0) acceptedQty?: number;
  @IsOptional() @IsNumber() @Min(0) rejectedQty?: number;
  @IsOptional() @IsNumber() @Min(0) damagedQty?: number;
}

export class CreateJobReceiptDto {
  @IsMongoId() jobSlipId!: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => JobReceiptLineInputDto)
  lines!: JobReceiptLineInputDto[];
  @IsOptional() @IsNumber() @Min(0) otherCharges?: number;
  @IsOptional() @IsString() remarks?: string;
}

export class CancelJobReceiptDto {
  @IsString() @MinLength(1) reason!: string;
}
