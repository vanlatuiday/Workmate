// Lưới bento 3 tầng dùng chung cho hai loại hồ sơ: tầng 1 (cốt lõi), tầng 2 (ô tóm tắt), tầng 3 (modal chi tiết / form sửa).
import { useMemo, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { useReducedMotion } from '@hooks/useReducedMotion'
import type { ProfileKind } from './model'
import { useProfileStore } from './store'
import { companyCompletion, seekerCompletion } from './logic'
import type { CellDef } from './context'
import { seekerCells } from './seekerCells'
import { companyCells } from './companyCells'
import { matchCell } from './matchCell'
import { CompanyCore, SeekerCore } from './Cores'
import CompletionBar from './CompletionBar'
import Modal from './Modal'
import Tile from './Tile'
import SeekerForm from './seekerForms'
import CompanyForm from './companyForms'

/** Độ rộng ô theo vị trí: A và M rộng 2 cột; F rộng 2 cột (4 cột khi có ô M để lấp hàng cuối) */
const SPAN = { A: 'md:col-span-2', M: 'md:col-span-2', F: 'md:col-span-2' } as Record<string, string>

type Dialog = { id: string; mode: 'view' | 'edit' }

export default function ProfileBento({ kind, owner, showMatch }: { kind: ProfileKind; owner: boolean; showMatch: boolean }) {
  const seeker = useProfileStore((s) => s.seeker)
  const company = useProfileStore((s) => s.company)
  const reduced = useReducedMotion()
  const [dialog, setDialog] = useState<Dialog | null>(null)

  // Tầng 2: A–E, rồi M (nếu có), rồi F — để hàng cuối của lưới 4 cột luôn đầy
  const tiles = useMemo(() => {
    const base: CellDef[] = kind === 'seeker' ? seekerCells(seeker, owner) : companyCells(company, owner)
    if (!showMatch) return base
    return [...base.slice(0, 5), matchCell(kind, seeker, company), base[5]]
  }, [kind, owner, showMatch, seeker, company])

  const checks = kind === 'seeker' ? seekerCompletion(seeker) : companyCompletion(company)
  const close = () => setDialog(null)

  // Ô tương ứng với một id; id của form dùng chung (vd. Địa chỉ → 'contact') ưu tiên ô trùng id
  const cellOf = (id: string) => tiles.find((t) => t.id === id) ?? tiles.find((t) => t.editId === id)
  const dialogCell = dialog ? cellOf(dialog.id) : undefined
  const editTitle = dialog?.id === 'core' ? 'thông tin cốt lõi' : (dialogCell?.label ?? '')

  return (
    <>
      <div className="mt-5 space-y-5">
        {kind === 'seeker' ? (
          <SeekerCore p={seeker} owner={owner} reduced={reduced} onEdit={() => setDialog({ id: 'core', mode: 'edit' })} />
        ) : (
          <CompanyCore c={company} owner={owner} reduced={reduced} onEdit={() => setDialog({ id: 'core', mode: 'edit' })} />
        )}
        {owner && <CompletionBar checks={checks} onPick={(cell) => setDialog({ id: cell, mode: 'edit' })} />}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {tiles.map((t, i) => (
            <Tile
              key={t.id}
              id={t.id}
              label={t.label}
              owner={owner && t.slot !== 'M'}
              index={i + 1}
              reduced={reduced}
              className={t.slot === 'F' && showMatch ? 'md:col-span-2 lg:col-span-4' : SPAN[t.slot]}
              onOpen={() => setDialog({ id: t.id, mode: 'view' })}
              onEdit={() => setDialog({ id: t.editId ?? t.id, mode: 'edit' })}
            >
              {t.summary}
            </Tile>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {dialog && (
          <Modal
            key={`${dialog.id}-${dialog.mode}`}
            cellId={dialogCell?.id ?? dialog.id}
            title={dialog.mode === 'edit' ? `Sửa ${editTitle}` : (dialogCell?.label ?? '')}
            onClose={close}
          >
            {dialog.mode === 'view' ? (
              dialogCell?.detail
            ) : kind === 'seeker' ? (
              <SeekerForm id={dialog.id} onClose={close} />
            ) : (
              <CompanyForm id={dialog.id} onClose={close} />
            )}
          </Modal>
        )}
      </AnimatePresence>
    </>
  )
}
