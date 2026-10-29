import { useCallback, useMemo } from 'react'
import { useProfileStore, type ExperienceItem, type SeekerProfile } from '@context/profileStore'
import type { JobType } from '@/types'

export type { ExperienceItem }

/** Hồ sơ đang chỉnh — đọc/ghi thẳng vào profileStore (lưu ngay, giữ qua lần tải lại; ảnh đại diện chỉ giữ trong phiên). */
export type ProfileDraft = SeekerProfile & {
  /** Object URL của ảnh đại diện vừa tải lên */
  avatarUrl: string | null
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
  const stored = useProfileStore((s) => s.profile)
  const avatarUrl = useProfileStore((s) => s.avatarUrl)
  const update = useProfileStore((s) => s.update)
  const setAvatarFile = useProfileStore((s) => s.setAvatarFile)
  const profile = useMemo<ProfileDraft>(() => ({ ...stored, avatarUrl }), [stored, avatarUrl])

  // Các thao tác đọc hồ sơ mới nhất từ store lúc gọi, nên callback không đổi giữa các lần render
  const cur = () => useProfileStore.getState().profile

  const set = useCallback(<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    if (key === 'avatarUrl') return // ảnh đổi qua setAvatarFile
    update({ [key]: value } as Partial<SeekerProfile>)
  }, [update])

  const toggleCell = useCallback((key: string) => {
    const a = cur().availability
    update({ availability: a.includes(key) ? a.filter((k) => k !== key) : [...a, key] })
  }, [update])

  const toggleJobType = useCallback((t: JobType) => {
    const j = cur().jobTypes
    update({ jobTypes: j.includes(t) ? j.filter((x) => x !== t) : [...j, t] })
  }, [update])

  const addSkill = useCallback((s: string) => {
    const v = s.trim()
    if (!v) return
    const skills = cur().skills
    if (skills.some((x) => x.toLowerCase() === v.toLowerCase())) return
    update({ skills: [...skills, v] })
  }, [update])

  const removeSkill = useCallback((s: string) => {
    update({ skills: cur().skills.filter((x) => x !== s) })
  }, [update])

  const addExperience = useCallback(() => {
    update({ experience: [...cur().experience, { id: `kn-${Date.now()}`, title: '', company: '', period: '' }] })
  }, [update])

  const updateExperience = useCallback((id: string, patch: Partial<ExperienceItem>) => {
    update({ experience: cur().experience.map((e) => (e.id === id ? { ...e, ...patch } : e)) })
  }, [update])

  const removeExperience = useCallback((id: string) => {
    update({ experience: cur().experience.filter((e) => e.id !== id) })
  }, [update])

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
