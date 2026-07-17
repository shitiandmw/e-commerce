"use client"

import { useEffect, useState } from "react"
import {
  getSelectedPickupLocationReason,
  type PickupLocationOptionState,
  type PickupLocationUnavailabilityReason,
} from "../lib/shipping-form-state"

export function usePickupLocationSelectionGuard({
  pickupLocationId,
  options,
  validationReady,
  onInvalidate,
}: {
  pickupLocationId: string
  options: PickupLocationOptionState[]
  validationReady: boolean
  onInvalidate: (reason: PickupLocationUnavailabilityReason) => void
}) {
  const reason = getSelectedPickupLocationReason(
    pickupLocationId,
    options,
    validationReady
  )

  useEffect(() => {
    if (!pickupLocationId || !reason) return
    onInvalidate(reason)
  }, [onInvalidate, pickupLocationId, reason])

  return reason
}

export function useProductShippingOptionsInitialization({
  productId,
  associationIds,
  isFieldDirty,
  onInitialize,
}: {
  productId?: string
  associationIds?: string[]
  isFieldDirty: boolean
  onInitialize: (ids: string[]) => void
}) {
  const [initializedProductId, setInitializedProductId] = useState<
    string | null
  >(null)
  const isInitialized = !productId || initializedProductId === productId

  useEffect(() => {
    if (!productId || isInitialized || associationIds === undefined) return

    if (!isFieldDirty) {
      onInitialize(associationIds)
    }
    setInitializedProductId(productId)
  }, [
    associationIds,
    isFieldDirty,
    isInitialized,
    onInitialize,
    productId,
  ])

  return isInitialized
}
