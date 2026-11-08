import toast from 'react-hot-toast'
import PreviewDock from './PreviewDock'
import { Group, Switch } from './ui'
import type { ProfileApi } from './useProfileDraft'

/** Nhóm 07 — Công khai: công tắc công khai, gợi ý mục còn thiếu, nút xem bản doanh nghiệp thấy. */
export default function PublishTile({ api }: { api: ProfileApi }) {
  const { profile, set, percent, missing } = api
  const toggle = () => {
    const next = !profile.published
    set('published', next)
    if (next) toast.success('Đã công khai hồ sơ')
  }
  return (
    <Group title="Công khai" index={7}>
      <Switch id="sw-publish" checked={profile.published} onChange={toggle} label="Công khai hồ sơ" />
      {percent < 60 && <p className="text-sm text-page-muted">Nên điền thêm: {missing.slice(0, 2).join(', ')}.</p>}
      <PreviewDock api={api} />
    </Group>
  )
}
