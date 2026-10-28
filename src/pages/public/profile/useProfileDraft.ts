import { useCallback, useMemo, useState } from 'react'
import { AVAILABILITY_DEFAULT, PROFILE_DEFAULT } from '@pages/jobseeker/mockData'
import type { JobType } from '@/types'

export type ExperienceItem = { id: string; title: string; company: string; period: string }

/** Bản nháp hồ sơ — chỉ nằm trong state của trang, tải lại là mất (chưa nối API). */
export type ProfileDraft = {
  fullName: string
  /** 1–2 câu giới thiệu (mẫu) */
  intro: string
  /** Đoạn giới thiệu dài hơn (mẫu) */
  about: string
  /** Object URL của ảnh đại diện vừa tải lên */
  avatarUrl: string | null
  showAvatar: boolean
  published: boolean
  area: string
  jobTypes: JobType[]
  salaryMin: number
  maxDistanceKm: number
  skills: string[]
  experience: ExperienceItem[]
  /** Khóa `${chỉ số ngày}-${chỉ số buổi}` của các ô rảnh */
  availability: string[]
}

const INITIAL: ProfileDraft = {
  fullName: PROFILE_DEFAULT.fullName,
  intro: 'Sinh viên năm cuối ở Đà Nẵng, quen làm ca tối và cuối tuần. Thích việc cần giao tiếp và làm việc nhóm.',
  about:
    'Mình đã làm phục vụ quán cà phê và cộng tác viên sự kiện hơn hai năm. Mình đúng giờ, học nhanh, không ngại việc nặng vào cuối tuần. Mình muốn tìm công việc gần nhà để có thể làm đều đặn.',
  avatarUrl: null,
  showAvatar: true,
  published: false,
  area: PROFILE_DEFAULT.area,
  jobTypes: [...PROFILE_DEFAULT.jobTypes],
  salaryMin: PROFILE_DEFAULT.salaryMin,
  maxDistanceKm: PROFILE_DEFAULT.maxDistanceKm,
  skills: [...PROFILE_DEFAULT.skills],
  experience: PROFILE_DEFAULT.experience.map((e) => ({ ...e })),
  availability: [...AVAILABILITY_DEFAULT],
}

/** Các mục tính vào mức hoàn thiện: nhãn + điều kiện đã điền */
function checklist(p: ProfileDraft): { label: string; done: boolean }[] {
  return [
    { label: 'tên', done: p.fullName.trim().length > 0 },
    { label: 'giới thiệu ngắn', done: p.intro.trim().length > 0 },
    { label: 'ít nhất 3 ca rảnh', done: p.availability.length >= 3 },
    { label: 'ít nhất 3 kỹ năng', done: p.skills.length >= 3 },
    { label: 'kinh nghiệm', done: p.experience.length >= 1 },
    { label: 'mức lương mong muốn', done: p.salaryMin > 0 },
    { label: 'khoảng cách tối đa', done: p.maxDistanceKm > 0 },
    { label: 'loại việc', done: p.jobTypes.length >= 1 },
    { label: 'ảnh đại diện', done: !!p.avatarUrl },
  ]
}

/** Mức hoàn thiện 0–100 */
export function completeness(p: ProfileDraft): number {
  const list = checklist(p)
  return Math.round((list.filter((i) => i.done).length / list.length) * 100)
}

export function useProfileDraft() {
  const [profile, setProfile] = useState<ProfileDraft>(INITIAL)

  const set = useCallback(<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setProfile((p) => ({ ...p, [key]: value }))
  }, [])

  const toggleCell = useCallback((key: string) => {
    setProfile((p) => ({
      ...p,
      availability: p.availability.includes(key) ? p.availability.filter((k) => k !== key) : [...p.availability, key],
    }))
  }, [])

  const toggleJobType = useCallback((t: JobType) => {
    setProfile((p) => ({
      ...p,
      jobTypes: p.jobTypes.includes(t) ? p.jobTypes.filter((x) => x !== t) : [...p.jobTypes, t],
    }))
  }, [])

  const addSkill = useCallback((s: string) => {
    const v = s.trim()
    if (!v) return
    setProfile((p) => (p.skills.some((x) => x.toLowerCase() === v.toLowerCase()) ? p : { ...p, skills: [...p.skills, v] }))
  }, [])

  const removeSkill = useCallback((s: string) => {
    setProfile((p) => ({ ...p, skills: p.skills.filter((x) => x !== s) }))
  }, [])

  const addExperience = useCallback(() => {
    setProfile((p) => ({
      ...p,
      experience: [...p.experience, { id: `kn-${Date.now()}`, title: '', company: '', period: '' }],
    }))
  }, [])

  const updateExperience = useCallback((id: string, patch: Partial<ExperienceItem>) => {
    setProfile((p) => ({ ...p, experience: p.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))
  }, [])

  const removeExperience = useCallback((id: string) => {
    setProfile((p) => ({ ...p, experience: p.experience.filter((e) => e.id !== id) }))
  }, [])

  /** Đổi ảnh: thu hồi object URL cũ để khỏi rò bộ nhớ */
  const setAvatarFile = useCallback((file: File) => {
    setProfile((p) => {
      if (p.avatarUrl) URL.revokeObjectURL(p.avatarUrl)
      return { ...p, avatarUrl: URL.createObjectURL(file) }
    })
  }, [])

  const percent = useMemo(() => completeness(profile), [profile])
  const missing = useMemo(() => checklist(profile).filter((i) => !i.done).map((i) => i.label), [profile])

  return {
    profile, set, toggleCell, toggleJobType, addSkill, removeSkill,
    addExperience, updateExperience, removeExperience, setAvatarFile, percent, missing,
  }
}

export type ProfileApi = ReturnType<typeof useProfileDraft>

/** Chữ viết tắt cho vòng ảnh, vd. "Nguyễn Minh Anh" -> "MA" */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const tail = parts.slice(-2)
  return tail.map((w) => w[0]).join('').toUpperCase()
}

/** Tên rút gọn cho doanh nghiệp, vd. "Nguyễn Minh Anh" -> "Minh Anh N." */
export function shortName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return parts[0] ?? ''
  return `${parts.slice(1).join(' ')} ${parts[0][0].toUpperCase()}.`
}

export const fmtMoney = (n: number) => `${n.toLocaleString('vi-VN')}đ`
