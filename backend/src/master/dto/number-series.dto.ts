import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class EnsureNumberSeriesDto {
  @IsString() @MinLength(1) docType!: string;
  @IsString() @MinLength(1) fy!: string;
  @IsString() @MinLength(1) prefix!: string;
  @IsOptional() @IsInt() @Min(1) pad?: number;
}
