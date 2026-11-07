// Điểm vào để xuất dữ liệu demo của frontend ra JSON (chạy qua export-demo.mjs, không chạy trực tiếp).
// Chỉ ĐỌC mã của frontend; không sửa gì bên đó.
import { DEMO_ACCOUNTS } from '@constants/demoAccounts'
import { COMPANIES } from '@pages/public/jobs/data'
import { MATCH_JOBS, POSITIONS, RECRUITER_POSITION_JOBS, SEEKER_JOBS, CANDIDATES, DEMO_COMPANY } from '@pages/public/match/data'
import { MOCK_JOBS } from '@pages/recruiter/mockData'
import { useProfileStore } from '@context/profileStore'
import { useCompanyStore } from '@context/companyStore'
import { useDemoStore } from '@context/demoStore'
import { useAdminStore } from '@context/adminStore'
import { useMatchStore } from '@context/matchStore'
import { useSettingsStore } from '@context/settingsStore'
import { writeFileSync } from 'node:fs'

// Bỏ các hàm (action) của store, chỉ giữ dữ liệu
const dataOnly = (s: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(s).filter(([, v]) => typeof v !== 'function'))

const out = {
  exportedAt: new Date().toISOString(),
  demoAccounts: DEMO_ACCOUNTS,
  companies: COMPANIES,
  demoCompany: DEMO_COMPANY,
  matchJobs: MATCH_JOBS,
  positions: POSITIONS, // { id, job (MockJob), req, radiusKm }
  recruiterPositionJobs: RECRUITER_POSITION_JOBS,
  seekerJobs: SEEKER_JOBS,
  mockJobs: MOCK_JOBS,
  candidates: CANDIDATES,
  profile: useProfileStore.getState().profile,
  companyProfile: useCompanyStore.getState().profile,
  demo: dataOnly(useDemoStore.getState() as unknown as Record<string, unknown>),
  admin: dataOnly(useAdminStore.getState() as unknown as Record<string, unknown>),
  match: dataOnly(useMatchStore.getState() as unknown as Record<string, unknown>),
  settings: dataOnly(useSettingsStore.getState() as unknown as Record<string, unknown>),
}

writeFileSync(process.env.SEED_OUT as string, JSON.stringify(out, null, 2) + '\n')
