"use client"

import { useCallback, useEffect, useState } from "react"
import { BellRing, Check, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { getRestockStatus, requestRestock } from "@/lib/restock-demand"
import { cn } from "@/lib/utils"

type VariantRequestState = {
  requested: boolean
  statusLoading: boolean
  submitting: boolean
}

const initialVariantState: VariantRequestState = {
  requested: false,
  statusLoading: true,
  submitting: false,
}

export function RestockRequestButton({ variantId }: { variantId: string }) {
  const t = useTranslations()
  const [states, setStates] = useState<Record<string, VariantRequestState>>({})
  const state = states[variantId] || initialVariantState

  const updateVariantState = useCallback((
    targetVariantId: string,
    update: Partial<VariantRequestState>
  ) => {
    setStates((current) => ({
      ...current,
      [targetVariantId]: {
        ...(current[targetVariantId] || initialVariantState),
        ...update,
      },
    }))
  }, [])

  useEffect(() => {
    const targetVariantId = variantId
    updateVariantState(targetVariantId, {
      requested: false,
      statusLoading: true,
    })

    getRestockStatus(targetVariantId)
      .then((status) => {
        updateVariantState(targetVariantId, {
          requested: status.requested,
        })
      })
      .catch(() => {
        updateVariantState(targetVariantId, { requested: false })
      })
      .finally(() => {
        updateVariantState(targetVariantId, { statusLoading: false })
      })
  }, [variantId, updateVariantState])

  const handleRequest = async () => {
    const targetVariantId = variantId
    updateVariantState(targetVariantId, { submitting: true })
    try {
      await requestRestock(targetVariantId)
      updateVariantState(targetVariantId, { requested: true })
      toast.success(t("restock_request_success"))
    } catch {
      toast.error(t("restock_request_failed"))
    } finally {
      updateVariantState(targetVariantId, { submitting: false })
    }
  }

  return (
    <button
      disabled={state.requested || state.statusLoading || state.submitting}
      onClick={handleRequest}
      className={cn(
        "w-full flex items-center justify-center gap-2 border py-3.5 text-sm font-medium tracking-wide transition-colors",
        state.requested
          ? "border-border/50 bg-muted text-muted-foreground cursor-not-allowed"
          : "border-foreground/30 text-foreground hover:border-gold hover:text-gold",
        (state.statusLoading || state.submitting) && "cursor-wait text-muted-foreground"
      )}
    >
      {state.statusLoading || state.submitting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : state.requested ? (
        <Check className="size-4" />
      ) : (
        <BellRing className="size-4" />
      )}
      {state.requested ? t("restock_requested") : t("request_restock")}
    </button>
  )
}
