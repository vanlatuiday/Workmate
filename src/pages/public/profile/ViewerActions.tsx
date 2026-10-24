// Nút hành động của người xem — chỉ giả lập, chưa có backend: bấm hiện thông báo "(demo)".
import { useState } from 'react'
import { Bookmark, BookmarkCheck, CalendarPlus, MessageSquare, UserPlus, UserCheck } from 'lucide-react'
import type { ProfileKind } from './model'
import { useView } from './context'
import { Btn } from './ui'

export default function ViewerActions({ kind }: { kind: ProfileKind }) {
  const { notify } = useView()
  const [on, setOn] = useState(false) // đã lưu hồ sơ / đã theo dõi
  const toggle = (doneText: string, undoText: string) => {
    notify(on ? undoText : doneText)
    setOn(!on)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {kind === 'seeker' ? (
        <>
          <Btn variant="primary" onClick={() => notify('Đã gửi (demo)')}>
            <MessageSquare className="h-4 w-4" aria-hidden />
            Nhắn tin
          </Btn>
          <Btn onClick={() => notify('Đã gửi lời mời phỏng vấn (demo)')}>
            <CalendarPlus className="h-4 w-4" aria-hidden />
            Mời phỏng vấn
          </Btn>
          <Btn pressed={on} onClick={() => toggle('Đã lưu hồ sơ (demo)', 'Đã bỏ lưu hồ sơ (demo)')}>
            {on ? <BookmarkCheck className="h-4 w-4" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />}
            {on ? 'Đã lưu hồ sơ' : 'Lưu hồ sơ'}
          </Btn>
        </>
      ) : (
        <>
          <Btn variant="primary" pressed={on} onClick={() => toggle('Đã theo dõi (demo)', 'Đã bỏ theo dõi (demo)')}>
            {on ? <UserCheck className="h-4 w-4" aria-hidden /> : <UserPlus className="h-4 w-4" aria-hidden />}
            {on ? 'Đang theo dõi' : 'Theo dõi'}
          </Btn>
          <Btn onClick={() => notify('Đã gửi (demo)')}>
            <MessageSquare className="h-4 w-4" aria-hidden />
            Nhắn tin
          </Btn>
        </>
      )}
    </div>
  )
}
