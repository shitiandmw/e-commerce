"use client"

import { useState, useEffect, useMemo } from "react"
import { useTranslations, useLocale } from "next-intl"
import {
  useCreateServiceZone,
  useUpdateServiceZone,
  type ServiceZone,
  type FulfillmentSet,
} from "@/hooks/use-shipping"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { COUNTRY_GROUPS, type Country } from "@/lib/countries"
import { ChevronDown, ChevronRight, Search } from "lucide-react"

interface ServiceZoneFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fulfillmentSets: FulfillmentSet[]
  editZone?: ServiceZone | null
  editFulfillmentSetId?: string
}

export function ServiceZoneForm({
  open,
  onOpenChange,
  fulfillmentSets,
  editZone,
  editFulfillmentSetId,
}: ServiceZoneFormProps) {
  const t = useTranslations("shipping")
  const locale = useLocale()
  const isZh = locale.startsWith("zh")
  const countryLabel = (c: Country) => (isZh ? c.zh : c.en)
  const groupLabel = (g: (typeof COUNTRY_GROUPS)[number]) =>
    isZh ? g.zh : g.en
  const [name, setName] = useState("")
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [fulfillmentSetId, setFulfillmentSetId] = useState("")
  const [search, setSearch] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const createZone = useCreateServiceZone(fulfillmentSetId)
  const updateZone = useUpdateServiceZone(
    editFulfillmentSetId || "",
    editZone?.id || ""
  )

  useEffect(() => {
    if (editZone) {
      setName(editZone.name)
      setSelectedCountries(editZone.geo_zones.map((g) => g.country_code))
      setFulfillmentSetId(editFulfillmentSetId || "")
    } else {
      setName("")
      setSelectedCountries([])
      setFulfillmentSetId(fulfillmentSets[0]?.id || "")
    }
    setSearch("")
    setExpandedGroups(new Set())
  }, [editZone, editFulfillmentSetId, open, fulfillmentSets])

  const toggleCountry = (code: string) => {
    setSelectedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupKey)) next.delete(groupKey)
      else next.add(groupKey)
      return next
    })
  }

  const toggleGroupAll = (countries: Country[]) => {
    const codes = countries.map((c) => c.code)
    const allSelected = codes.every((c) => selectedCountries.includes(c))
    if (allSelected) {
      setSelectedCountries((prev) => prev.filter((c) => !codes.includes(c)))
    } else {
      setSelectedCountries((prev) =>
        Array.from(new Set([...prev, ...codes]))
      )
    }
  }

  const searchLower = search.trim().toLowerCase()
  const filteredGroups = useMemo(() => {
    if (!searchLower) return COUNTRY_GROUPS
    return COUNTRY_GROUPS.map((g) => ({
      ...g,
      countries: g.countries.filter(
        (c) =>
          c.code.includes(searchLower) ||
          c.zh.includes(searchLower) ||
          c.en.toLowerCase().includes(searchLower)
      ),
    })).filter((g) => g.countries.length > 0)
  }, [searchLower])

  const handleSubmit = () => {
    if (!name.trim() || selectedCountries.length === 0) return
    const geo_zones = selectedCountries.map((c) => ({
      country_code: c,
      type: "country" as const,
    }))

    if (editZone) {
      updateZone.mutate(
        { name: name.trim(), geo_zones },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createZone.mutate(
        { name: name.trim(), geo_zones },
        { onSuccess: () => onOpenChange(false) }
      )
    }
  }

  const isPending = createZone.isPending || updateZone.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editZone ? t("zones.editZone") : t("zones.createZone")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {!editZone && (
            <div className="space-y-2">
              <Label>{t("zones.fulfillmentSet")}</Label>
              <Select
                value={fulfillmentSetId}
                onChange={(e) => setFulfillmentSetId(e.target.value)}
              >
                <option value="">{t("zones.selectFulfillmentSet")}</option>
                {fulfillmentSets.map((fs) => (
                  <option key={fs.id} value={fs.id}>
                    {fs.name} ({fs.type})
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("zones.form.name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("zones.form.namePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("zones.form.countries")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("zones.form.countriesHint")}
            </p>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("zones.form.searchPlaceholder")}
                className="pl-8"
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto border rounded-md">
              {filteredGroups.map((group) => {
                const isExpanded =
                  expandedGroups.has(group.key) || searchLower.length > 0
                const selectedInGroup = group.countries.filter((c) =>
                  selectedCountries.includes(c.code)
                ).length
                const totalInGroup = group.countries.length
                const allSelected =
                  totalInGroup > 0 && selectedInGroup === totalInGroup
                const someSelected =
                  selectedInGroup > 0 && selectedInGroup < totalInGroup

                return (
                  <div key={group.key} className="border-b last:border-b-0">
                    <div
                      className="flex items-center gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/50 cursor-pointer select-none"
                      onClick={() => toggleGroup(group.key)}
                    >
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected
                        }}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleGroupAll(group.countries)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded"
                      />
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      )}
                      <span className="text-sm font-medium flex-1">
                        {groupLabel(group)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("zones.form.selected", {
                          count: selectedInGroup,
                          total: totalInGroup,
                        })}
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 px-3 py-2">
                        {group.countries.map((c) => (
                          <label
                            key={c.code}
                            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent/50 rounded px-1 py-0.5"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCountries.includes(c.code)}
                              onChange={() => toggleCountry(c.code)}
                              className="rounded"
                            />
                            <span className="uppercase text-xs font-mono w-5">
                              {c.code}
                            </span>
                            <span className="text-muted-foreground text-xs truncate">
                              {countryLabel(c)}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {filteredGroups.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("zones.form.noResults")}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("zones.form.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !name.trim() ||
                selectedCountries.length === 0 ||
                (!editZone && !fulfillmentSetId) ||
                isPending
              }
            >
              {isPending
                ? editZone
                  ? t("zones.form.updating")
                  : t("zones.form.creating")
                : editZone
                  ? t("zones.form.update")
                  : t("zones.form.create")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
