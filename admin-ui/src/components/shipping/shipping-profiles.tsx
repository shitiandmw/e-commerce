"use client"

import { useState } from "react"
import {
  useShippingProfiles,
  useCreateShippingProfile,
  useDeleteShippingProfile,
} from "@/hooks/use-shipping"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { Plus, Trash2, BoxIcon } from "lucide-react"

export function ShippingProfiles() {
  const { data, isLoading } = useShippingProfiles()
  const createProfile = useCreateShippingProfile()
  const deleteProfile = useDeleteShippingProfile()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState("default")

  const handleCreate = () => {
    if (!name.trim()) return
    createProfile.mutate(
      { name: name.trim(), type },
      {
        onSuccess: () => {
          setOpen(false)
          setName("")
          setType("default")
        },
      }
    )
  }

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this shipping profile?")) return
    deleteProfile.mutate(id)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const profiles = data?.shipping_profiles || []

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BoxIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Shipping Profiles</h2>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Profile
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Shipping Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Default Shipping"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-type">Type</Label>
              <Select
                id="profile-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="default">Default</option>
                <option value="gift_card">Gift Card</option>
                <option value="custom">Custom</option>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || createProfile.isPending}
              >
                {createProfile.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <p className="text-sm text-muted-foreground">
        Shipping profiles group products that share the same shipping requirements.
      </p>

      {profiles.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No shipping profiles configured.
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between rounded-md border p-4"
            >
              <div className="flex items-center gap-3">
                <BoxIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium text-sm">{profile.name}</span>
                  <Badge variant="outline" className="ml-2">
                    {profile.type}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(profile.id)}
                disabled={deleteProfile.isPending}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
