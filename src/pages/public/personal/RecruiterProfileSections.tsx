import { Link } from 'react-router-dom'
import {
  ArrowUpRight, Building2, BriefcaseBusiness, CalendarDays, Clock3, Coffee, Gift,
  Globe2, GraduationCap, Heart, MapPin, ShieldCheck, Sparkles, Target, Users,
} from 'lucide-react'
import { LINK } from '@utils/ui'
import { cn } from '@utils/cn'
import { Card, Detail } from './personalPrototypeParts'

/** Các khối giữ chỗ để duyệt bố cục doanh nghiệp; chưa hiển thị tin hoặc phúc lợi thật. */
export default function RecruiterProfileSections() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <Card title="Giới thiệu doanh nghiệp" icon={Building2} className="personal-preview-about">
          <p className="mt-4 text-sm leading-7 text-page-muted">Câu chuyện, định hướng và những điều làm nên doanh nghiệp của bạn sẽ được giới thiệu tại đây.</p>
          <dl className="mt-6 space-y-4">
            <Detail icon={BriefcaseBusiness} label="Lĩnh vực" />
            <Detail icon={Users} label="Quy mô" />
            <Detail icon={CalendarDays} label="Năm thành lập" />
          </dl>
        </Card>
        <Card title="Thông tin tuyển dụng" icon={Target}>
          <dl className="mt-5 space-y-4">
            <Detail icon={BriefcaseBusiness} label="Hình thức" value="Chưa chọn" />
            <Detail icon={Clock3} label="Ca tuyển dụng" value="Chưa chọn" />
            <Detail icon={MapPin} label="Khu vực tuyển" value="Chưa chọn" />
          </dl>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card title="Văn hóa" icon={Sparkles} className="personal-preview-skills">
          <div className="flex flex-wrap gap-2">
            {[{ label: 'Giá trị cốt lõi', icon: Heart }, { label: 'Môi trường', icon: Globe2 }, { label: 'Đội ngũ', icon: Users }].map(({ label, icon: Icon }) => (
              <span key={label} className="personal-preview-chip"><Icon aria-hidden className="h-3.5 w-3.5" />{label}</span>
            ))}
          </div>
        </Card>
        <Card title="Địa điểm làm việc" icon={MapPin} className="personal-preview-row">
          <div className="personal-preview-timeline">
            <h3 className="text-sm font-semibold">Địa điểm hoặc chi nhánh</h3>
            <p className="mt-1 text-sm text-page-muted">Địa chỉ và khu vực làm việc</p>
          </div>
        </Card>
        <Card title="Vị trí đang tuyển" icon={BriefcaseBusiness} className="personal-preview-row">
          <div>
            <div className="space-y-5">
              {[1, 2].map((item) => (
                <div key={item} className="personal-preview-timeline grid gap-3 sm:grid-cols-[1fr_1fr]">
                  <div><h3 className="text-sm font-semibold">Vị trí tuyển dụng</h3><p className="mt-1 text-sm text-page-muted">Lịch làm · Mức lương</p></div>
                  <div aria-hidden className="personal-preview-lines space-y-2 pt-1"><span /><span /><span /></div>
                </div>
              ))}
            </div>
            <Link to="/tuyen-dung/tin-dang" className={cn(LINK, 'mt-4 inline-flex min-h-9 items-center gap-1.5 text-sm')}>
              Quản lý tin tuyển dụng<ArrowUpRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
        </Card>
        <Card title="Phúc lợi" icon={Gift} className="personal-preview-row">
          <div className="grid grid-cols-5 gap-2" aria-label="Các mục phúc lợi mẫu">
            {[ShieldCheck, Coffee, GraduationCap, Heart, Gift].map((Icon, index) => (
              <div key={index} className="flex flex-col items-center gap-2 text-center text-xs text-page-muted">
                <span className="personal-preview-hobby"><Icon aria-hidden className="h-5 w-5" strokeWidth={1.5} /></span>
                <span>Phúc lợi {index + 1}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
