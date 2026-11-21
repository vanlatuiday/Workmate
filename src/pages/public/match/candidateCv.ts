import type { CvData } from '@components/cv/CvSheet'
import type { CandidateProfile } from '@services/candidateService'

/**
 * Hồ sơ ứng viên (máy chủ đã ẩn bớt: tên viết tắt khi chưa kết nối, không có SĐT/email) -> dữ liệu tờ CV.
 * Không có `phone`/`email` nên CvSheet bản nhà tuyển dụng hiện "Mở sau khi kết nối".
 * Ảnh: máy chủ chỉ trả `avatarUrl` khi ứng viên bật hiện ảnh; không có thì CvSheet vẽ chữ cái đầu.
 */
export function toCvDataFromCandidate(p: CandidateProfile): CvData {
  const personal = p.birthDate !== undefined || p.gender !== undefined
  return {
    fullName: p.name,
    headline: p.headline ?? '',
    avatarUrl: p.avatarUrl ?? null,
    phone: '',
    area: p.area,
    birthDate: p.birthDate ?? null,
    gender: p.gender ?? null,
    showPersonal: personal,
    intro: p.summary,
    about: p.about ?? '',
    skills: p.criteria.skills,
    skillLevels: p.skillLevels ?? {},
    hobbies: p.hobbies ?? [],
    experience: (p.experience ?? []).map((e) => ({ ...e, bullets: e.bullets ?? [] })),
    availability: p.criteria.slots,
    availableFrom: p.availableFrom ?? null,
    salaryMin: Math.round(p.criteria.salaryMinK * 1000),
    maxDistanceKm: p.criteria.maxDistanceKm,
    jobTypes: p.criteria.jobTypes,
  }
}
