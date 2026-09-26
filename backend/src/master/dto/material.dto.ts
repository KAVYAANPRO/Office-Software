import { IsMongoId, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateMaterialDto {
  @IsString() @MinLength(1) name!: string;
  @IsMongoId() categoryId!: string;
  @IsOptional() @IsString() fabricType?: string;
  @IsMongoId() baseUomId!: string;
  @IsOptional() @IsNumber() @Min(0) minStockQty?: number;
}

export class UpdateMaterialDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsMongoId() categoryId?: string;
  @IsOptional() @IsString() fabricType?: string;
  @IsOptional() @IsMongoId() baseUomId?: string;
  @IsOptional() @IsNumber() @Min(0) minStockQty?: number;
}

export class CreateMaterialVariantDto {
  @IsMongoId() colourId!: string;
  @IsOptional() @IsString() code?: string;
}
