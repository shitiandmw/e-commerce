"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  useAttributeTemplates,
  useCreateAttributeTemplate,
} from "@/hooks/use-attribute-templates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { ChevronDown, ChevronUp, Plus, Trash2, Save } from "lucide-react"

export interface AttributeItem {
  key: string
  value: string
}

interface ProductAttributesEditorProps {
  value: AttributeItem[]
  onChange: (value: AttributeItem[]) => void
}

export function ProductAttributesEditor({
  value,
  onChange,
}: ProductAttributesEditorProps) {
  const t = useTranslations("products")
  const [collapsed, setCollapsed] = React.useState(false)
  const [keysInput, setKeysInput] = React.useState("")
  const [templateName, setTemplateName] = React.useState("")
  const [showSaveTemplate, setShowSaveTemplate] = React.useState(false)

  const { data: templatesData } = useAttributeTemplates()
  const createTemplate = useCreateAttributeTemplate()
  const templates = templatesData?.attribute_templates ?? []

  const handleTemplateSelect = (templateId: string) => {
    if (!templateId) return
    const template = templates.find((t) => t.id === templateId)
    if (!template) return
    // Merge template attributes with existing, preserving existing values
    const existingKeys = new Set(value.map((a) => a.key))
    const newItems = template.attributes
      .filter((key) => !existingKeys.has(key))
      .map((key) => ({ key, value: "" }))
    onChange([...value, ...newItems])
  }
  const handleKeysSubmit = () => {
    const keys = keysInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
    if (keys.length === 0) return
    const existingKeys = new Set(value.map((a) => a.key))
    const newItems = keys
      .filter((key) => !existingKeys.has(key))
      .map((key) => ({ key, value: "" }))
    onChange([...value, ...newItems])
    setKeysInput("")
  }

  const handleValueChange = (index: number, newValue: string) => {
    const updated = [...value]
    updated[index] = { ...updated[index], value: newValue }
    onChange(updated)
  }

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim() || value.length === 0) return
    await createTemplate.mutateAsync({
      name: templateName.trim(),
      attributes: value.map((a) => a.key),
    })
    setTemplateName("")
    setShowSaveTemplate(false)
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between p-6"
        onClick={() => setCollapsed(!collapsed)}
      >
        <h2 className="text-lg font-semibold">{t("attributes.title")}</h2>
        {collapsed ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <div className="px-6 pb-6 space-y-4">
          {/* Template selector */}
          <div className="space-y-2">
            <Label>{t("attributes.selectTemplate")}</Label>
            <Select
              value=""
              onChange={(e) => handleTemplateSelect(e.target.value)}
            >
              <option value="">{t("attributes.selectTemplatePlaceholder")}</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {`${tpl.name} (${tpl.attributes.length})`}
                </option>
              ))}
            </Select>
          </div>

          {/* Manual keys input */}
          <div className="space-y-2">
            <Label>{t("attributes.addKeys")}</Label>
            <div className="flex gap-2">
              <Input
                value={keysInput}
                onChange={(e) => setKeysInput(e.target.value)}
                placeholder={t("attributes.addKeysPlaceholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleKeysSubmit()
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleKeysSubmit}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Key-value list */}
          {value.length > 0 && (
            <div className="space-y-2">
              {value.map((attr, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm font-medium min-w-[80px] shrink-0">
                    {attr.key}
                  </span>
                  <Input
                    value={attr.value}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                    placeholder={t("attributes.valuePlaceholder")}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(index)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Save as template */}
          {value.length > 0 && (
            <div className="pt-2 border-t">
              {showSaveTemplate ? (
                <div className="flex gap-2">
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder={t("attributes.templateNamePlaceholder")}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveAsTemplate}
                    disabled={createTemplate.isPending || !templateName.trim()}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {t("attributes.save")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSaveTemplate(false)}
                  >
                    {t("attributes.cancel")}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveTemplate(true)}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {t("attributes.saveAsTemplate")}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
