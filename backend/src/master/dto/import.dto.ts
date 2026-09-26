import { IsIn, IsString, MinLength } from 'class-validator';

export const IMPORTABLE_ENTITIES = ['suppliers', 'customers', 'materials', 'job-workers'] as const;
export type ImportableEntity = (typeof IMPORTABLE_ENTITIES)[number];

export class ImportCsvDto {
  @IsString()
  @MinLength(1)
  csv!: string;
}
