import { useState } from 'react'

export default function AccountAvatar({ initial, url }: { initial: string; url?: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  return (
    <span aria-hidden="true" className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-current text-xs font-medium">
      {initial}
      {url && url !== failedUrl && (
        <img
          src={url}
          alt=""
          className="absolute inset-0 h-full w-full bg-page-surface object-cover"
          onError={() => setFailedUrl(url)}
        />
      )}
    </span>
  )
}
