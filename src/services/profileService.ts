// Hồ sơ người tìm việc trên máy chủ (/api/seeker/profile). `profileStore` vẫn là nguồn đọc của
// giao diện; file này nạp hồ sơ về và đẩy thay đổi lên (gom các lần gõ, gửi sau SAVE_DELAY ms).
import toast from 'react-hot-toast'
import api from './api'
import { apiErrorMessage } from './authService'
import { useAuthStore } from '@context/authStore'
import { registerProfileSync, useProfileStore, type SeekerProfile } from '@context/profileStore'
import type { JobType } from '@/types'

/** Dạng máy chủ trả về: lương tính bằng nghìn đồng/giờ */
interface ProfileResponse extends Omit<SeekerProfile, 'salaryMin'> {
  salaryMinK: number
  avatarUrl: string | null
  updatedAt: string
}
type ProfileBody = Partial<Omit<ProfileResponse, 'avatarUrl' | 'updatedAt'>>

const SAVE_DELAY = 700

const fromServer = (r: ProfileResponse): SeekerProfile => ({
  fullName: r.fullName, phone: r.phone, intro: r.intro, about: r.about, showAvatar: r.showAvatar, published: r.published,
  area: r.area, jobTypes: r.jobTypes as JobType[], salaryMin: r.salaryMinK * 1000, maxDistanceKm: r.maxDistanceKm,
  skills: r.skills, experience: r.experience, availability: r.availability,
})

function toBody(patch: Partial<SeekerProfile>): ProfileBody {
  const { salaryMin, experience, ...rest } = patch
  return {
    ...rest,
    ...(salaryMin !== undefined && { salaryMinK: Math.max(0, Math.round(salaryMin / 1000)) }),
    // Dòng kinh nghiệm đang gõ dở (chưa có chữ nào) vẫn gửi để giữ đúng thứ tự và id
    ...(experience && { experience: experience.map(({ id, title, company, period }) => ({ id, title, company, period })) }),
  }
}

/** Chỉ đồng bộ khi đang đăng nhập bằng tài khoản người tìm việc */
export const syncsWithServer = () => useAuthStore.getState().user?.role === 'jobseeker'

let pending: Partial<SeekerProfile> = {}
let timer: ReturnType<typeof setTimeout> | null = null
let inflight: Promise<void> = Promise.resolve()
/** Tăng mỗi lần đổi tài khoản: phản hồi của tài khoản cũ về muộn thì bỏ */
let generation = 0

async function flush(): Promise<void> {
  if (timer) { clearTimeout(timer); timer = null }
  const patch = pending
  pending = {}
  if (!Object.keys(patch).length) return
  // Gửi lần lượt để bản sau không bị bản trước ghi đè trên máy chủ
  inflight = inflight.then(async () => {
    try {
      await api.patch<ProfileResponse>('/seeker/profile', toBody(patch))
    } catch (err) {
      toast.error(`Chưa lưu được hồ sơ: ${apiErrorMessage(err)}`, { id: 'profile-save' })
    }
  })
  return inflight
}

/** Gọi từ profileStore mỗi lần hồ sơ đổi */
export function queueProfileSave(patch: Partial<SeekerProfile>): void {
  if (!syncsWithServer()) return
  pending = { ...pending, ...patch }
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => { void flush() }, SAVE_DELAY)
}

/** Nạp hồ sơ của người đang đăng nhập; tài khoản khác / khách → về hồ sơ mẫu trên máy */
export async function loadProfile(): Promise<void> {
  const gen = ++generation
  pending = {}
  if (timer) { clearTimeout(timer); timer = null }
  const store = useProfileStore.getState()
  if (!syncsWithServer()) {
    store.resetLocal()
    return
  }
  try {
    const res = await api.get<ProfileResponse>('/seeker/profile')
    if (gen === generation) store.replace(fromServer(res.data), res.data.avatarUrl)
  } catch {
    /* mất kết nối: giữ bản đang có trên máy */
  }
}

/** Tải ảnh đại diện lên; trả về thông báo lỗi hoặc null */
export async function uploadAvatar(file: File): Promise<string | null> {
  const form = new FormData()
  form.append('file', file)
  try {
    const res = await api.post<ProfileResponse>('/seeker/profile/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    useProfileStore.getState().setAvatarUrl(res.data.avatarUrl)
    return null
  } catch (err) {
    if ((err as { response?: { status?: number } }).response?.status === 413) return 'Ảnh lớn hơn 2MB.'
    return apiErrorMessage(err, 'Không tải được ảnh lên.')
  }
}

registerProfileSync({ save: queueProfileSave, uploadAvatar, active: syncsWithServer, reload: loadProfile })

// Đóng tab khi vừa gõ xong: gửi nốt phần chưa lưu (keepalive để trình duyệt không hủy giữa chừng)
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    const token = useAuthStore.getState().token
    if (!Object.keys(pending).length || !token || !syncsWithServer()) return
    const base = import.meta.env.VITE_API_URL ?? '/api'
    void fetch(`${base}/seeker/profile`, {
      method: 'PATCH', keepalive: true,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(toBody(pending)),
    })
    pending = {}
  })
}
