"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"

interface ExportButtonProps {
  onExport: () => Promise<void>
  label?: string
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ExportButton({
  onExport,
  label,
  variant = "outline",
  size = "default",
}: ExportButtonProps) {
  const t = useTranslations("importExport")
  const [isExporting, setIsExporting] = React.useState(false)

  const handleExport = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      await onExport()
    } catch (err) {
      console.error("Export failed:", err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {label ?? t("exportButton.defaultLabel")}
    </Button>
  )
}
