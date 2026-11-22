import { Link, useLocation, type LinkProps } from 'react-router-dom'
import { jobDetailHref } from './jobDetailHref'

/** Link chia sẻ được; mở popup mà không rời trang đang xem. */
export default function JobDetailLink({ jobId, state, replace, ...props }: Omit<LinkProps, 'to'> & { jobId: string }) {
  const location = useLocation()
  const alreadyOpen = !!new URLSearchParams(location.search).get('tin')
  return <Link {...props} to={jobDetailHref(jobId, location)} replace={replace ?? alreadyOpen} state={{
    ...state,
    jobDetailFrom: alreadyOpen ? location.state?.jobDetailFrom : `${location.pathname}${location.search}${location.hash}`,
  }} />
}
