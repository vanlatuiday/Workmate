import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested,
} from 'class-validator'

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value)

export class ModerationDto {
  @IsIn(['approved', 'rejected', 'hidden', 'pending'])
  status!: 'approved' | 'rejected' | 'hidden' | 'pending'

  /** Lý do từ chối / ẩn */
  @IsOptional() @Transform(trim) @IsString() @MaxLength(500)
  reason?: string
}

export class CompanyAdminDto {
  @IsOptional() @IsBoolean()
  verified?: boolean

  @IsOptional() @IsBoolean()
  locked?: boolean
}

export class WeightsDto {
  @IsNumber() @Min(0) @Max(100) skills!: number
  @IsNumber() @Min(0) @Max(100) schedule!: number
  @IsNumber() @Min(0) @Max(100) salary!: number
  @IsNumber() @Min(0) @Max(100) distance!: number
  @IsNumber() @Min(0) @Max(100) jobType!: number
}

/** Cấu hình hệ thống: gửi trường nào cập nhật trường đó */
export class ConfigDto {
  @IsOptional() @ValidateNested() @Type(() => WeightsDto)
  weights?: WeightsDto

  @IsOptional() @IsArray() @ArrayMaxSize(200) @IsString({ each: true }) @MaxLength(100, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value.map((w) => (typeof w === 'string' ? w.trim() : w)).filter(Boolean) : value))
  bannedWords?: string[]

  @IsOptional() @IsInt() @Min(0) @Max(1000)
  minWageK?: number

  @IsOptional() @IsInt() @Min(1) @Max(15)
  defaultRadiusKm?: number

  @IsOptional() @IsBoolean()
  registrationOpen?: boolean
}
