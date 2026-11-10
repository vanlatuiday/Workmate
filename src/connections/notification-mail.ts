import type { NotificationKind } from '@prisma/client'

export type MailItem = { kind: NotificationKind; side: 'seeker' | 'recruiter'; jobTitle: string; companyName: string }

/** Một thư liệt kê tối đa ngần này dòng, phần còn lại gộp thành "và N thông báo khác" */
const MAX_LINES = 10

/** Mốc gửi thư tóm tắt gần nhất: 8:00 giờ Việt Nam (01:00 UTC, Việt Nam không đổi giờ theo mùa) */
export function digestCutoff(now: Date): Date {
  const cutoff = new Date(now)
  cutoff.setUTCHours(1, 0, 0, 0)
  if (cutoff > now) cutoff.setUTCDate(cutoff.getUTCDate() - 1)
  return cutoff
}

/**
 * Nội dung một dòng. Phía doanh nghiệp không nhắc tên ứng viên: họ tên đầy đủ chỉ mở sau khi kết nối,
 * và email thì nằm lại trong hộp thư kể cả khi ứng viên đổi ý.
 */
export function lineOf({ kind, side, jobTitle: job, companyName: company }: MailItem): string {
  const forSeeker = side === 'seeker'
  switch (kind) {
    case 'interest': return forSeeker ? `${company} quan tâm đến hồ sơ của bạn cho vị trí ${job}` : `Có ứng viên mới ứng tuyển vị trí ${job}`
    case 'considering': return `${company} đang cân nhắc hồ sơ của bạn cho vị trí ${job}`
    case 'connected': return forSeeker ? `Bạn và ${company} đã kết nối cho vị trí ${job}` : `Bạn đã kết nối với một ứng viên cho vị trí ${job}`
    case 'interview_invited': return `${company} mời bạn phỏng vấn vị trí ${job}`
    case 'interview_confirmed': return `Ứng viên đã xác nhận lịch phỏng vấn vị trí ${job}`
    case 'interview_declined': return `Ứng viên đã từ chối lịch phỏng vấn vị trí ${job}`
    case 'interview_cancelled': return `${company} đã hủy lịch phỏng vấn vị trí ${job}`
    case 'offer': return `${company} mời bạn nhận việc vị trí ${job}`
    case 'offer_accepted': return `Ứng viên đã xác nhận đi làm vị trí ${job}`
    case 'offer_declined': return `Ứng viên đã từ chối nhận việc vị trí ${job}`
    case 'offer_withdrawn': return `${company} đã rút lời mời nhận việc vị trí ${job}`
    case 'rejected': return `${company} chưa chọn bạn cho vị trí ${job}`
    case 'review': return forSeeker ? `${company} đã đánh giá bạn ở vị trí ${job}` : `Ứng viên đã đánh giá doanh nghiệp ở vị trí ${job}`
  }
}

/** Tên tin và tên công ty do người dùng nhập nên phải thoát ký tự trước khi đưa vào HTML */
const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** Địa chỉ frontend: lấy từ CORS_ORIGIN để không phải khai báo thêm một biến trùng ý nghĩa */
const appUrl = () => (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '')

export function composeMail(items: MailItem[]) {
  const lines = items.map(lineOf)
  const shown = lines.slice(0, MAX_LINES)
  const more = lines.length - shown.length
  const subject = lines.length === 1 ? `Workmate: ${lines[0]}` : `Workmate: bạn có ${lines.length} thông báo mới`
  const base = appUrl()
  const inbox = `${base}/thong-bao`
  const settings = `${base}${items[0].side === 'seeker' ? '/tim-viec/cai-dat' : '/tuyen-dung/cai-dat'}`
  const moreText = more > 0 ? `và ${more} thông báo khác` : ''
  const stop = 'Bạn nhận thư này theo lựa chọn trong Cài đặt. Đổi tần suất hoặc tắt email tại:'

  return {
    subject,
    text: [
      'Chào bạn,', '', ...shown.map((l) => `- ${l}`), ...(moreText ? [`- ${moreText}`] : []), '',
      `Xem chi tiết: ${inbox}`, '', `${stop} ${settings}`,
    ].join('\n'),
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#242522">
  <p style="font-size:18px;font-weight:600;margin:0 0 16px">Workmate</p>
  <ul style="margin:0 0 20px;padding-left:20px">${shown.map((l) => `<li style="margin:0 0 8px">${escapeHtml(l)}</li>`).join('')}${moreText ? `<li style="margin:0 0 8px">${moreText}</li>` : ''}</ul>
  <p style="margin:0 0 20px"><a href="${inbox}" style="color:#242522;font-weight:600">Xem chi tiết trên Workmate</a></p>
  <p style="margin:0;color:#454640;font-size:14px">${stop} <a href="${settings}" style="color:#454640">Cài đặt</a></p>
</div>`,
  }
}
