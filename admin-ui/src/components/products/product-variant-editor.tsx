"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  AlertTriangle,
  Ban,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  createEditorKey,
  getConfigurationErrors,
  getVariantCombinationTitle,
  reconcileVariantMatrix,
  type EditorVariant,
  type ProductVariantConfiguration,
} from "@/lib/product-variant-config"

type Props = {
  value: ProductVariantConfiguration
  onChange: (value: ProductVariantConfiguration) => void
  productTitle: string
  mode: "create" | "edit"
}

export function ProductVariantEditor({
  value,
  onChange,
  productTitle,
  mode,
}: Props) {
  const t = useTranslations("products")
  const [valueInputs, setValueInputs] = React.useState<Record<string, string>>({})
  const [localMessage, setLocalMessage] = React.useState("")
  const errors = getConfigurationErrors(value)

  const updateOption = (
    optionKey: string,
    update: (option: ProductVariantConfiguration["options"][number]) => ProductVariantConfiguration["options"][number]
  ) => {
    onChange({
      ...value,
      options: value.options.map((option) =>
        option.key === optionKey ? update(option) : option
      ),
    })
  }

  const addOption = () => {
    onChange({
      ...value,
      options: [
        ...value.options,
        { key: createEditorKey("option"), title: "", values: [] },
      ],
    })
  }

  const removeOption = (optionKey: string) => {
    const option = value.options.find((item) => item.key === optionKey)
    if (option?.id) {
      setLocalMessage(t("variantEditor.existingOptionRemovalBlocked"))
      return
    }
    const next = {
      ...value,
      options: value.options.filter((item) => item.key !== optionKey),
    }
    onChange(reconcileVariantMatrix(next, productTitle))
  }

  const addOptionValue = (optionKey: string) => {
    const nextValue = (valueInputs[optionKey] || "").trim()
    if (!nextValue) return
    const option = value.options.find((item) => item.key === optionKey)
    if (option?.values.some((item) => item.value.toLowerCase() === nextValue.toLowerCase())) {
      setLocalMessage(t("variantEditor.duplicateValue"))
      return
    }
    const next = {
      ...value,
      options: value.options.map((item) =>
        item.key === optionKey
          ? {
              ...item,
              values: [...item.values, { key: createEditorKey("value"), value: nextValue }],
            }
          : item
      ),
    }
    setValueInputs((current) => ({ ...current, [optionKey]: "" }))
    setLocalMessage("")
    onChange(reconcileVariantMatrix(next, productTitle))
  }

  const removeOptionValue = (optionKey: string, valueKey: string) => {
    const persistedUsers = value.variants.filter(
      (variant) => variant.id && variant.option_values[optionKey] === valueKey
    )
    if (persistedUsers.length > 0) {
      setLocalMessage(t("variantEditor.existingValueRemovalBlocked", {
        count: persistedUsers.length,
      }))
      return
    }
    const next = {
      ...value,
      options: value.options.map((option) =>
        option.key === optionKey
          ? { ...option, values: option.values.filter((item) => item.key !== valueKey) }
          : option
      ),
      variants: value.variants.filter(
        (variant) => variant.option_values[optionKey] !== valueKey
      ),
    }
    setLocalMessage("")
    onChange(reconcileVariantMatrix(next, productTitle))
  }

  const updateVariant = (variantKey: string, patch: Partial<EditorVariant>) => {
    onChange({
      ...value,
      variants: value.variants.map((variant) =>
        variant.key === variantKey ? { ...variant, ...patch } : variant
      ),
    })
  }

  const updateVariantOption = (
    variant: EditorVariant,
    optionKey: string,
    optionValueKey: string
  ) => {
    const optionValues = { ...variant.option_values, [optionKey]: optionValueKey }
    updateVariant(variant.key, {
      option_values: optionValues,
      title: getVariantCombinationTitle(value.options, optionValues),
    })
  }

  const removeOrDeleteVariant = (variant: EditorVariant) => {
    if (!variant.id) {
      onChange({
        ...value,
        variants: value.variants.filter((item) => item.key !== variant.key),
      })
      return
    }
    updateVariant(variant.key, { status: "delete" })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t("form.options")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("variantEditor.optionsHint")}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            <Plus className="mr-2 h-4 w-4" />
            {t("form.addOption")}
          </Button>
        </div>

        {value.options.map((option) => (
          <div key={option.key} className="space-y-3 rounded-md border p-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label>{t("form.optionName")}</Label>
                <Input
                  value={option.title}
                  onChange={(event) =>
                    updateOption(option.key, (current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder={t("form.optionNamePlaceholder")}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeOption(option.key)}
                title={t("variantEditor.removeOption")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {option.values.map((item) => (
                <span
                  key={item.key}
                  className="inline-flex h-8 items-center gap-1 border bg-muted px-2 text-sm"
                >
                  {item.value}
                  <button
                    type="button"
                    onClick={() => removeOptionValue(option.key, item.key)}
                    aria-label={t("variantEditor.removeValue", { value: item.value })}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              <div className="flex min-w-[220px] flex-1 gap-2">
                <Input
                  value={valueInputs[option.key] || ""}
                  onChange={(event) =>
                    setValueInputs((current) => ({
                      ...current,
                      [option.key]: event.target.value,
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      addOptionValue(option.key)
                    }
                  }}
                  placeholder={t("variantEditor.valuePlaceholder")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => addOptionValue(option.key)}
                  title={t("variantEditor.addValue")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {localMessage && (
          <div className="flex items-start gap-2 text-sm text-amber-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{localMessage}</span>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t("form.variants")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("variantEditor.variantsHint")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(reconcileVariantMatrix(value, productTitle))}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("variantEditor.syncMatrix")}
          </Button>
        </div>

        {errors.length > 0 && (
          <div className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {errors.join("；")}
          </div>
        )}

        <div className="space-y-3">
          {value.variants.map((variant) => {
            const pendingDelete = variant.status === "delete"
            return (
              <div
                key={variant.key}
                className={`space-y-3 rounded-md border p-4 ${pendingDelete ? "opacity-60" : ""}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{variant.title}</span>
                    {pendingDelete ? (
                      <Badge variant="destructive">{t("variantEditor.pendingDelete")}</Badge>
                    ) : variant.status === "stopped" ? (
                      <Badge variant="secondary">{t("variantEditor.stopped")}</Badge>
                    ) : (
                      <Badge variant="outline">{t("variantEditor.active")}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {pendingDelete ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateVariant(variant.key, {
                            status: variant.initial_status === "stopped" ? "stopped" : "active",
                          })
                        }
                      >
                        <RotateCcw className="mr-1.5 h-4 w-4" />
                        {t("variantEditor.undo")}
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateVariant(variant.key, {
                              status: variant.status === "stopped" ? "active" : "stopped",
                            })
                          }
                        >
                          {variant.status === "stopped" ? (
                            <RotateCcw className="mr-1.5 h-4 w-4" />
                          ) : (
                            <Ban className="mr-1.5 h-4 w-4" />
                          )}
                          {variant.status === "stopped"
                            ? t("variantEditor.restore")
                            : t("variantEditor.stop")}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOrDeleteVariant(variant)}
                          title={
                            variant.id
                              ? t("variantEditor.permanentDelete")
                              : t("variantEditor.removeUnsaved")
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {!pendingDelete && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {value.options.map((option) => (
                      <div key={option.key} className="space-y-2">
                        <Label>{option.title || t("form.optionName")}</Label>
                        <Select
                          value={variant.option_values[option.key] || ""}
                          onChange={(event) =>
                            updateVariantOption(variant, option.key, event.target.value)
                          }
                        >
                          <option value="">{t("variantEditor.selectValue")}</option>
                          {option.values.map((item) => (
                            <option key={item.key} value={item.key}>
                              {item.value}
                            </option>
                          ))}
                        </Select>
                      </div>
                    ))}
                    <div className="space-y-2">
                      <Label>{t("form.variantSku")}</Label>
                      <Input
                        value={variant.sku}
                        onChange={(event) => updateVariant(variant.key, { sku: event.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("form.variantPrice")}</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.price}
                        onChange={(event) =>
                          updateVariant(variant.key, { price: Number(event.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("form.variantCurrency")}</Label>
                      <Select
                        value={variant.currency_code}
                        onChange={(event) =>
                          updateVariant(variant.key, { currency_code: event.target.value })
                        }
                      >
                        {mode === "create" || variant.currency_code === "usd" ? <option value="usd">USD</option> : null}
                        <option value="eur">EUR</option>
                        <option value="gbp">GBP</option>
                        <option value="cny">CNY</option>
                        <option value="jpy">JPY</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("form.variantInventory")}</Label>
                      <Input
                        type="number"
                        min="0"
                        value={variant.inventory_quantity}
                        disabled={mode === "edit" && !!variant.id}
                        onChange={(event) =>
                          updateVariant(variant.key, {
                            inventory_quantity: Number(event.target.value),
                          })
                        }
                      />
                    </div>
                    <label className="flex items-center gap-2 self-end pb-2 text-sm">
                      <input
                        type="checkbox"
                        checked={variant.manage_inventory}
                        onChange={(event) =>
                          updateVariant(variant.key, {
                            manage_inventory: event.target.checked,
                          })
                        }
                      />
                      {t("form.manageInventory")}
                    </label>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
