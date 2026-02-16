"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="zh-CN">
      <body style={{ background: "#0c0c0c", color: "#f5f5f5", fontFamily: "system-ui, sans-serif" }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "1rem",
          textAlign: "center",
        }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#c9a96e", marginBottom: "1rem" }}>
            出错了
          </h1>
          <p style={{ color: "#999", marginBottom: "2rem", maxWidth: "28rem" }}>
            抱歉，页面加载时发生了错误。请稍后重试。
          </p>
          <button
            onClick={reset}
            style={{
              background: "#c9a96e",
              color: "#0c0c0c",
              border: "none",
              borderRadius: "0.375rem",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            重试
          </button>
        </div>
      </body>
    </html>
  )
}
