import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class MaterialReturnLineInputDto {
  @IsMongoId() materialVariantId!: string;
  @IsMongoId() lotId!: string;
  @IsNumber() @Min(0.001) qtyBase!: number;
}

export class CreateMaterialReturnDto {
  @IsMongoId() jobSlipId!: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MaterialReturnLineInputDto)
  lines!: MaterialReturnLineInputDto[];
  @IsOptional() @IsString() notes?: string;
}
