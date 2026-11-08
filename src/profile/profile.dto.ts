import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateNested,
} from 'class-validator'
import { JOB_TYPES } from '../jobs/jobs.dto'

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

  @IsOptional() @IsArray() @ArrayMaxSize(21)
  @Matches(/^[0-6]-[0-2]$/, { each: true, message: 'Ô lịch rảnh phải có dạng "ngày-buổi", vd. 0-2' })
  availability?: string[]

  @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => ExperienceDto)
  experience?: ExperienceDto[]
}
