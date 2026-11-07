import { applyDecorators } from '@nestjs/common'
import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateNested,
} from 'class-validator'
import { DISTRICT_GEO } from '../common/geo'

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value)

export const JOB_TYPES = ['full-time', 'part-time', 'shift', 'seasonal', 'flexible', 'event', 'freelance'] as const

export class PhotoDto {
  @IsOptional() @IsString() @MaxLength(200)
  id?: string

  @IsOptional() @IsString() @MaxLength(500)
  url?: string

  @Transform(trim) @IsString() @MaxLength(300)
  alt!: string
}

// Quy tắc từng trường viết một lần, dùng cho cả tạo mới (bắt buộc) và sửa (tùy chọn)
const rules = {
  title: () => applyDecorators(Transform(trim), IsString(), MinLength(3), MaxLength(120)),
  description: () => applyDecorators(Transform(trim), IsString(), MaxLength(4000)),
  jobType: () => applyDecorators(IsIn(JOB_TYPES)),
  district: () => applyDecorators(IsIn(Object.keys(DISTRICT_GEO))),
  skills: () => applyDecorators(IsArray(), ArrayMaxSize(20), IsString({ each: true }), MaxLength(60, { each: true })),
  slots: () => applyDecorators(IsArray(), ArrayMaxSize(21), Matches(/^[0-6]-[0-2]$/, { each: true, message: 'Ca làm phải có dạng "ngày-buổi", vd. 0-2' })),
  salaryMinK: () => applyDecorators(IsInt(), Min(0), Max(10000)),
  salaryMaxK: () => applyDecorators(IsInt(), Min(0), Max(10000)),
  quantity: () => applyDecorators(IsInt(), Min(1), Max(20)),
  radiusKm: () => applyDecorators(IsInt(), Min(1), Max(15)),
  photo: () => applyDecorators(ValidateNested(), Type(() => PhotoDto)),
}
const optional = (d: PropertyDecorator) => applyDecorators(IsOptional(), d)

/** Nội dung nhà tuyển dụng gửi khi đăng tin (khớp trường của PostedJob ở frontend) */
export class CreateJobDto {
  @rules.title() title!: string
  @rules.description() description!: string
  @rules.jobType() jobType!: (typeof JOB_TYPES)[number]
  @rules.district() district!: string
  @rules.skills() skills!: string[]
  @rules.slots() slots!: string[]
  @rules.salaryMinK() salaryMinK!: number
  @rules.salaryMaxK() salaryMaxK!: number
  /** Bỏ trống → server tự dựng từ lương */
  @IsOptional() @Transform(trim) @IsString() @MaxLength(80) salaryLabel?: string
  /** Bỏ trống → server tự dựng từ ca làm */
  @IsOptional() @Transform(trim) @IsString() @MaxLength(120) shiftLabel?: string
  @rules.quantity() quantity!: number
  @rules.radiusKm() radiusKm!: number
  @rules.photo() photo!: PhotoDto
}

/** Sửa tin: mọi trường tùy chọn */
export class UpdateJobDto {
  @optional(rules.title()) title?: string
  @optional(rules.description()) description?: string
  @optional(rules.jobType()) jobType?: (typeof JOB_TYPES)[number]
  @optional(rules.district()) district?: string
  @optional(rules.skills()) skills?: string[]
  @optional(rules.slots()) slots?: string[]
  @optional(rules.salaryMinK()) salaryMinK?: number
  @optional(rules.salaryMaxK()) salaryMaxK?: number
  @IsOptional() @Transform(trim) @IsString() @MaxLength(80) salaryLabel?: string
  @IsOptional() @Transform(trim) @IsString() @MaxLength(120) shiftLabel?: string
  @optional(rules.quantity()) quantity?: number
  @optional(rules.radiusKm()) radiusKm?: number
  @optional(rules.photo()) photo?: PhotoDto
}

export class JobStatusDto {
  @IsIn(['open', 'paused', 'closed'])
  status!: 'open' | 'paused' | 'closed'
}
