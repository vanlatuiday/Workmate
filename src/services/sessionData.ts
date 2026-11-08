// Nạp dữ liệu riêng của tài khoản đang đăng nhập; đăng xuất / đổi tài khoản thì xóa khỏi bộ nhớ.
import { useAdminStore } from '@context/adminStore'
import { useCandidateStore } from '@context/candidateStore'
import { useCompanyStore } from '@context/companyStore'
import { useMatchStore } from '@context/matchStore'
import { useSettingsStore } from '@context/settingsStore'
import { loadAdminSeekers, loadCandidates } from './candidateService'
import { loadAdminPairs, startConnections, stopConnections } from './connectionService'

const quiet = (p: Promise<unknown>) => p.catch(() => undefined)

export function loadSessionData(role: string | undefined) {
  stopConnections()
  useCandidateStore.getState().set([])
  useMatchStore.getState().clear()
  useCompanyStore.getState().clear()
  useSettingsStore.getState().reset()
  if (!role) return
  if (role === 'admin') {
    void quiet(loadAdminPairs())
    void quiet(loadAdminSeekers())
    void quiet(useAdminStore.getState().loadReports())
    return
  }
  void quiet(startConnections())
  void quiet(useSettingsStore.getState().load(role === 'jobseeker' ? 'seeker' : 'recruiter'))
  void quiet(useMatchStore.getState().load(role))
  if (role === 'recruiter') {
    void quiet(loadCandidates())
    void quiet(useCompanyStore.getState().load())
  }
}
