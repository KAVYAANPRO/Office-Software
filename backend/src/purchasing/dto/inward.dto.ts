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

export class InwardLineInputDto {
  @IsMongoId() purchaseLineId!: string;
  @IsNumber() @Min(0.001) qty!: number;
  @IsOptional() @IsString() lotNo?: string;
}

export class CreateInwardDto {
  @IsMongoId() purchaseId!: string;
  @IsMongoId() locationId!: string;
  @IsOptional() @IsString() remarks?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InwardLineInputDto)
  lines!: InwardLineInputDto[];
}

export class CancelInwardDto {
  @IsString() @MinLength(1) reason!: string;
}
