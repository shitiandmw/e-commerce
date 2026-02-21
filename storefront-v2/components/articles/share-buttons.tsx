"use client"

interface ShareButtonsProps {
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

export function ShareButtons({ title }: ShareButtonsProps) {
  function handleShare(getUrl: (url: string, title: string) => string) {
    const url = window.location.href
    window.open(getUrl(url, title), "_blank", "noopener,noreferrer,width=600,height=400")
  }

  return (
    <div className="flex items-center gap-3">
      {platforms.map((p) => (
        <button
          key={p.name}
          onClick={() => handleShare(p.getUrl)}
          className="px-4 py-2 text-xs border border-border/50 text-muted-foreground hover:text-gold hover:border-gold/50 transition-colors"
        >
          {p.name}
        </button>
      ))}
    </div>
  )
}
