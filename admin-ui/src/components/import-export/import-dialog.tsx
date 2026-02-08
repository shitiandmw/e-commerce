"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Download, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react"
import { downloadCSV, generateTemplate, readFileAsText, parseCSV } from "@/lib/csv"

export interface ImportResult {
  total: number
  success: number
  failed: number
  errors: string[]
}

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  templateHeaders: string[]
  templateFilename: string
  onImport: (
    rows: Record<string, string>[],
    onProgress: (current: number, total: number) => void
  ) => Promise<ImportResult>
}

type ImportState = "idle" | "parsing" | "importing" | "done"

export function ImportDialog({
  open,
  onOpenChange,
  title,
  description,
  templateHeaders,
  templateFilename,
  onImport,
}: ImportDialogProps) {
  const t = useTranslations("importExport")
  const [state, setState] = React.useState<ImportState>("idle")
  const [file, setFile] = React.useState<File | null>(null)
  const [progress, setProgress] = React.useState({ current: 0, total: 0 })
  const [result, setResult] = React.useState<ImportResult | null>(null)
  const [parseError, setParseError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const reset = React.useCallback(() => {
    setState("idle")
    setFile(null)
    setProgress({ current: 0, total: 0 })
    setResult(null)
    setParseError(null)
  }, [])

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) reset()
      onOpenChange(open)
    },
    [onOpenChange, reset]
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (!selected.name.endsWith(".csv")) {
        setParseError(t("importDialog.pleaseSelectCsv"))
        return
      }
      setFile(selected)
      setParseError(null)
    }
  }

  const handleDownloadTemplate = () => {
    const template = generateTemplate(templateHeaders)
    downloadCSV(template, templateFilename)
  }

  const handleImport = async () => {
    if (!file) return

    try {
      setState("parsing")
      const text = await readFileAsText(file)
      const rows = parseCSV(text)

      if (rows.length === 0) {
        setParseError(t("importDialog.csvEmpty"))
        setState("idle")
        return
      }

      // Validate headers
      const csvHeaders = Object.keys(rows[0])
      const missingHeaders = templateHeaders.filter(
        (h) => !csvHeaders.includes(h)
      )
      if (missingHeaders.length > 0) {
        setParseError(
          t("importDialog.missingColumns", { columns: missingHeaders.join(", ") })
        )
        setState("idle")
        return
      }

      setState("importing")
      setProgress({ current: 0, total: rows.length })

      const importResult = await onImport(rows, (current, total) => {
        setProgress({ current, total })
      })

      setResult(importResult)
      setState("done")
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : t("importDialog.errorOccurred")
      )
      setState("idle")
    }
  }

  const progressPercent =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent onClose={() => handleOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {state === "idle" && (
            <>
              {/* Template Download */}
              <button
                onClick={handleDownloadTemplate}
                className="flex w-full items-center gap-3 rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Download className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">{t("importDialog.downloadTemplate")}</p>
                  <p className="text-xs">
                    {t("importDialog.templateDescription")}
                  </p>
                </div>
              </button>

              {/* File Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary hover:bg-accent/50"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                {file ? (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-muted-foreground">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium">
                      {t("importDialog.clickToSelect")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("importDialog.onlyCsv")}
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Parse Error */}
              {parseError && (
                <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>{parseError}</p>
                </div>
              )}
            </>
          )}

          {(state === "parsing" || state === "importing") && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm font-medium">
                  {state === "parsing"
                    ? t("importDialog.parsingCsv")
                    : t("importDialog.importingProgress", { current: progress.current, total: progress.total })}
                </p>
              </div>
              {state === "importing" && (
                <div className="space-y-1">
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {progressPercent}%
                  </p>
                </div>
              )}
            </div>
          )}

          {state === "done" && result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {result.failed === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
                <p className="text-sm font-medium">{t("importDialog.importComplete")}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-2xl font-bold">{result.total}</p>
                  <p className="text-xs text-muted-foreground">{t("importDialog.total")}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {result.success}
                  </p>
                  <p className="text-xs text-green-600">{t("importDialog.success")}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">
                    {result.failed}
                  </p>
                  <p className="text-xs text-red-600">{t("importDialog.failed")}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-md bg-destructive/5 p-3">
                  <p className="text-xs font-medium text-destructive mb-1">
                    {t("importDialog.errors")}
                  </p>
                  <ul className="space-y-1">
                    {result.errors.slice(0, 20).map((error, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-1.5 text-xs text-destructive"
                      >
                        <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {error}
                      </li>
                    ))}
                    {result.errors.length > 20 && (
                      <li className="text-xs text-muted-foreground">
                        {t("importDialog.moreErrors", { count: result.errors.length - 20 })}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {state === "idle" && (
            <>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                {t("importDialog.cancel")}
              </Button>
              <Button onClick={handleImport} disabled={!file}>
                <Upload className="mr-2 h-4 w-4" />
                {t("importDialog.import")}
              </Button>
            </>
          )}
          {state === "done" && (
            <Button onClick={() => handleOpenChange(false)}>{t("importDialog.close")}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
