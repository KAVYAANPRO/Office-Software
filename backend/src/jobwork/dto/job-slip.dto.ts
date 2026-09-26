import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CHARGE_BASES, JOB_TYPES } from '../schemas/job-slip.schema';

export class JobSlipExpectedOutputInputDto {
  @IsOptional() @IsMongoId() colourId?: string;
  @IsOptional() @IsMongoId() sizeId?: string;
  @IsOptional() @IsMongoId() materialVariantId?: string;
  @IsNumber() @Min(0.001) expectedQty!: number;
}

export class CreateJobSlipDto {
  @IsIn(JOB_TYPES) jobType!: (typeof JOB_TYPES)[number];
  @IsMongoId() jobWorkerId!: string;
  @IsMongoId() designId!: string;
  @IsOptional() @IsMongoId() productionOrderId?: string;
  @IsOptional() @IsMongoId() processingTypeId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => JobSlipExpectedOutputInputDto)
  expectedOutputLines!: JobSlipExpectedOutputInputDto[];

  @IsOptional() @IsDateString() expectedCompletionDate?: string;
  @IsIn(CHARGE_BASES) chargeBasis!: (typeof CHARGE_BASES)[number];
  @IsNumber() @Min(0) agreedRate!: number;
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class SetJobSlipStatusDto {
  @IsIn(['IN_PROCESS', 'READY']) status!: 'IN_PROCESS' | 'READY';
}

export class CancelJobSlipDto {
  @IsString() @MinLength(1) reason!: string;
}

export class ShortCloseJobSlipDto {
  @IsString() @MinLength(1) reason!: string;
}

export class WriteOffJobSlipDto {
  @IsString() @MinLength(1) reason!: string;
}

export class DispatchDeclarationDto {
  @IsNumber() @Min(0) qty!: number;
  @IsOptional() @IsString() note?: string;
}
