type PageLocation = { pathname: string; search: string; hash: string }

/** Giữ trang và bộ lọc hiện tại; tin chi tiết là một lớp popup trên cùng trang. */
export function jobDetailHref(jobId: string | null, location: PageLocation): string {
  const params = new URLSearchParams(location.search)
  if (jobId) params.set('tin', jobId)
  else params.delete('tin')
  const search = params.toString()
  return `${location.pathname}${search ? `?${search}` : ''}${location.hash}`
}
