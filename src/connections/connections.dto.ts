import { Transform } from 'class-transformer'
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsISO8601, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength,
} from 'class-validator'

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value)

export const REVIEW_MAX_TAGS = 3
export const REVIEW_MAX_COMMENT = 300

export class SendMessageDto {
  @Transform(trim) @IsString() @MinLength(1, { message: 'Tin nhắn trống' }) @MaxLength(2000)
  text!: string
}

class PairDto {
  @IsString() @MinLength(1) @MaxLength(64)
  jobId!: string

  @IsString() @MinLength(1) @MaxLength(64)
  seekerId!: string
}

export class InviteInterviewDto extends PairDto {
  @IsArray() @ArrayMinSize(1, { message: 'Cần ít nhất 1 khung giờ' }) @ArrayMaxSize(3, { message: 'Tối đa 3 khung giờ' }) @IsISO8601({}, { each: true })
  slots!: string[]

  @IsIn(['onsite', 'online'])
  mode!: 'onsite' | 'online'

  @Transform(trim) @IsString() @MinLength(1, { message: 'Cần địa điểm hoặc ghi chú cuộc gọi' }) @MaxLength(300)
  place!: string

  @IsOptional() @Transform(trim) @IsString() @MaxLength(500)
  note?: string
}

export class ConfirmInterviewDto {
  @IsISO8601()
  slot!: string
}

export class OfferDto extends PairDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày bắt đầu phải có dạng YYYY-MM-DD' })
  startDate!: string

  @IsOptional() @Transform(trim) @IsString() @MaxLength(500)
  note?: string
}

export class ReasonDto {
  @IsOptional() @Transform(trim) @IsString() @MaxLength(300)
  reason?: string
}

export class ReviewDto extends PairDto {
  @IsInt() @Min(1) @Max(5)
  stars!: number

  @IsArray() @ArrayMaxSize(REVIEW_MAX_TAGS) @IsString({ each: true }) @MaxLength(60, { each: true })
  tags!: string[]

  @IsOptional() @Transform(trim) @IsString() @MaxLength(REVIEW_MAX_COMMENT)
  comment?: string
}
