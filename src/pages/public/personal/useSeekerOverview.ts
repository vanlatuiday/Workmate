import { useEffect, useState } from 'react'
import api from '@services/api'
import { useAuthStore } from '@context/authStore'
import { useConnectionStore, type Hire } from '@context/connectionStore'
import type { CatalogCompany, CatalogJob } from '@context/catalogStore'
import type { SeekerProfile } from '@context/profileStore'
import type { ReviewItem } from '@services/connectionService'

interface Overview {
  profile: Omit<SeekerProfile, 'salaryMin'> & { salaryMinK: number }
  hires: Hire[]
  reviews: ReviewItem[]
  jobs: CatalogJob[]
  companies: CatalogCompany[]
}

export function useSeekerOverview() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const hires = useConnectionStore((s) => s.hires)
  const reviews = useConnectionStore((s) => s.reviews)
  const [attempt, retry] = useState(0)
  const [state, setState] = useState<{ token: string; data?: Overview; error?: boolean }>()
  const active = user?.role === 'jobseeker' && !!token

  useEffect(() => {
    if (!active) return
    const controller = new AbortController()
    const config = { signal: controller.signal }
    setState({ token })
    void Promise.all([
      api.get<Overview['profile']>('/seeker/profile', config),
      api.get<Hire[]>('/hires', config),
      api.get<ReviewItem[]>(`/reviews/seekers/${encodeURIComponent(user.id)}`, config),
      api.get<{ jobs: CatalogJob[]; companies: CatalogCompany[] }>('/catalog', config),
    ]).then(([profile, hired, rated, catalog]) => {
      if (!controller.signal.aborted) setState({ token, data: { profile: profile.data, hires: hired.data, reviews: rated.data, ...catalog.data } })
    }).catch(() => {
      if (!controller.signal.aborted) setState({ token, error: true })
    })
    return () => controller.abort()
  }, [active, token, user?.id, attempt, hires, reviews])

  // Không hiện dữ liệu tài khoản trước trong lúc chuyển phiên đăng nhập.
  const current = active && state?.token === token ? state : undefined
  return { active, data: current?.data, error: current?.error, retry: () => retry((n) => n + 1) }
}
