import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsObject, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateIf, ValidateNested,
} from 'class-validator'
import { JOB_TYPES } from '../jobs/jobs.dto'

export const GENDERS = ['nam', 'nu', 'khac'] as const

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value)

export class ExperienceDto {
  /** id cũ (giữ thứ tự / định danh ở frontend); bỏ trống = dòng mới */
  @IsOptional() @IsString() @MaxLength(40)
  id?: string

  @Transform(trim) @IsString() @MaxLength(120)
  title!: string

  @Transform(trim) @IsString() @MaxLength(120)
  company!: string

  @Transform(trim) @IsString() @MaxLength(60)
  period!: string

  @IsOptional() @IsArray() @ArrayMaxSize(8) @Transform(({ value }) => (Array.isArray(value) ? value.map((v) => (typeof v === 'string' ? v.trim() : v)) : value))
  @IsString({ each: true }) @MaxLength(200, { each: true })
  bullets?: string[]
}

/** Sửa hồ sơ: mọi trường tùy chọn. `experience` nếu gửi thì thay cả danh sách */
export class UpdateProfileDto {
  @IsOptional() @Transform(trim) @IsString() @MaxLength(80)
  fullName?: string

  @IsOptional() @Transform(trim) @IsString() @Matches(/^[0-9+ .()-]{0,20}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string

  @IsOptional() @Transform(trim) @IsString() @MaxLength(300)
  intro?: string

  @IsOptional() @Transform(trim) @IsString() @MaxLength(2000)
  about?: string

  @IsOptional() @IsBoolean()
  showAvatar?: boolean

  @IsOptional() @IsBoolean()
  published?: boolean

  /** YYYY-MM-DD; null = có thể bắt đầu ngay */
  @IsOptional() @ValidateIf((o) => o.availableFrom !== null) @IsDateString({ strict: true }, { message: 'Ngày bắt đầu không hợp lệ' }) @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày bắt đầu không hợp lệ' })
  availableFrom?: string | null

  @IsOptional() @Transform(trim) @IsString() @MaxLength(80)
  area?: string

  @IsOptional() @IsArray() @ArrayMaxSize(JOB_TYPES.length) @IsIn(JOB_TYPES, { each: true })
  jobTypes?: (typeof JOB_TYPES)[number][]

  /** Lương tối thiểu, nghìn đồng/giờ */
  @IsOptional() @IsInt() @Min(0) @Max(10000)
  salaryMinK?: number

  @IsOptional() @IsInt() @Min(1) @Max(50)
  maxDistanceKm?: number

  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @MaxLength(60, { each: true })
  skills?: string[]

  @IsOptional() @Transform(trim) @IsString() @MaxLength(80)
  headline?: string

  /** YYYY-MM-DD hoặc null */
  @IsOptional() @ValidateIf((o) => o.birthDate !== null) @IsDateString({ strict: true }, { message: 'Ngày sinh không hợp lệ' }) @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày sinh không hợp lệ' })
  birthDate?: string | null

  @IsOptional() @ValidateIf((o) => o.gender !== null) @IsIn(GENDERS, { message: 'Giới tính không hợp lệ' })
  gender?: (typeof GENDERS)[number] | null

  @IsOptional() @IsBoolean()
  showPersonal?: boolean

  /** Tên kỹ năng → 1..5; khóa lạ (không có trong skills) bị bỏ khi lưu */
  @IsOptional() @IsObject()
  skillLevels?: Record<string, number>

  @IsOptional() @IsArray() @ArrayMaxSize(10) @Transform(({ value }) => (Array.isArray(value) ? value.map((v) => (typeof v === 'string' ? v.trim() : v)) : value))
  @IsString({ each: true }) @MaxLength(40, { each: true })
  hobbies?: string[]

  @IsOptional() @IsArray() @ArrayMaxSize(28)
  @Matches(/^[0-6]-[0-3]$/, { each: true, message: 'Ô lịch rảnh phải có dạng "ngày-buổi", vd. 0-3' })
  availability?: string[]

  @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => ExperienceDto)
  experience?: ExperienceDto[]
}
