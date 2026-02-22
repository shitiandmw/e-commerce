"use client"

import { useState } from "react"
import { Share2, Link2, Check } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

interface SharePopoverProps {
  title: string
}

const platforms = [
  {
    name: "Facebook",
    getUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "X",
    getUrl: (url: string, title: string) =>
      `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: "WhatsApp",
    getUrl: (url: string, title: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
]

export function SharePopover({ title }: SharePopoverProps) {
  const [copied, setCopied] = useState(false)

  function handleShare(getUrl: (url: string, title: string) => string) {
    const url = window.location.href
    window.open(getUrl(url, title), "_blank", "noopener,noreferrer,width=600,height=400")
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex size-12 items-center justify-center border border-border/50 text-muted-foreground hover:text-gold hover:border-gold transition-colors"
          aria-label="分享"
        >
          <Share2 className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-2">
        <div className="flex flex-col gap-1">
          {platforms.map((p) => (
            <button
              key={p.name}
              onClick={() => handleShare(p.getUrl)}
              className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:text-gold hover:bg-accent transition-colors rounded"
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={handleCopyLink}
            className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:text-gold hover:bg-accent transition-colors rounded flex items-center gap-2"
          >
            {copied ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
            {copied ? "已复制" : "复制链接"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
