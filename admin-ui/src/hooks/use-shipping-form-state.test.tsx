import assert from "node:assert/strict"
import test from "node:test"
import React, { useCallback, useMemo, useState } from "react"
import { useForm } from "react-hook-form"

import {
  getPickupLocationUnavailabilityReason,
  toggleShippingOptionId,
} from "../lib/shipping-form-state"
import {
  usePickupLocationSelectionGuard,
  useProductShippingOptionsInitialization,
} from "./use-shipping-form-state"

const TestRenderer: any = require("react-test-renderer")
const { act } = TestRenderer

const hkLocation = {
  id: "ploc_hk",
  is_enabled: true,
  address: "1 Queen's Road",
  shipping_option_id: null as string | null,
}

function PickupSelectionHarness({
  zoneCountryCode,
  currentShippingOptionId,
  boundShippingOptionId,
}: {
  zoneCountryCode: string
  currentShippingOptionId?: string
  boundShippingOptionId?: string
}) {
  const [pickupLocationId, setPickupLocationId] = useState(hkLocation.id)
  const [warning, setWarning] = useState("")
  const options = useMemo(() => {
    const location = {
      ...hkLocation,
      shipping_option_id: boundShippingOptionId || null,
    }
    return [
      {
        location,
        reason: getPickupLocationUnavailabilityReason(
          location,
          currentShippingOptionId
        ),
      },
    ]
  }, [boundShippingOptionId, currentShippingOptionId])
  const invalidate = useCallback((reason: string) => {
    setPickupLocationId("")
    setWarning(reason)
  }, [])
  const reason = usePickupLocationSelectionGuard({
    pickupLocationId,
    options,
    validationReady: true,
    onInvalidate: invalidate,
  })

  return (
    <div data-zone-country-code={zoneCountryCode}>
      <output id="pickup-id">{pickupLocationId}</output>
      <output id="pickup-reason">{reason || warning}</output>
      <button
        id="select-location"
        disabled={Boolean(options[0].reason)}
        onClick={() => {
          setPickupLocationId(hkLocation.id)
          setWarning("")
        }}
      >
        Select
      </button>
    </div>
  )
}

type ProductAssociationHarnessProps = {
  associationIds?: string[]
  optionsReady: boolean
  loading: boolean
  error: boolean
  onRetry?: () => void
}

function ProductAssociationHarness({
  associationIds,
  optionsReady,
  loading,
  error,
  onRetry = () => undefined,
}: ProductAssociationHarnessProps) {
  const {
    watch,
    setValue,
    formState: { dirtyFields },
  } = useForm<{ shipping_option_ids: string[] }>({
    defaultValues: { shipping_option_ids: [] },
  })
  const value = watch("shipping_option_ids")
  const initialize = useCallback(
    (ids: string[]) => {
      setValue("shipping_option_ids", ids, {
        shouldDirty: false,
        shouldValidate: true,
      })
    },
    [setValue]
  )
  const initialized = useProductShippingOptionsInitialization({
    productId: "prod_test",
    associationIds,
    isFieldDirty: Boolean(dirtyFields.shipping_option_ids),
    onInitialize: initialize,
  })
  const blocked = !optionsReady || loading || error || !initialized

  return (
    <div>
      <output id="selected-options">{value.join(",")}</output>
      <output id="initialized">{String(initialized)}</output>
      <input
        id="option-existing"
        type="checkbox"
        disabled={blocked}
        checked={value.includes("so_existing")}
        onChange={(event) =>
          setValue(
            "shipping_option_ids",
            toggleShippingOptionId(
              value,
              "so_existing",
              event.target.checked
            ),
            { shouldDirty: true, shouldValidate: true }
          )
        }
      />
      <button
        id="make-dirty"
        onClick={() =>
          setValue("shipping_option_ids", ["so_user"], {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      >
        Dirty
      </button>
      {error && (
        <button id="retry" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}

function text(renderer: any, id: string) {
  return renderer.root.findByProps({ id }).children.join("")
}

test("pickup selection remains valid when the service zone changes", () => {
  let renderer: any
  act(() => {
    renderer = TestRenderer.create(
      <PickupSelectionHarness zoneCountryCode="hk" />
    )
  })
  assert.equal(text(renderer, "pickup-id"), hkLocation.id)
  assert.equal(text(renderer, "pickup-reason"), "")

  act(() => {
    renderer.update(<PickupSelectionHarness zoneCountryCode="mo" />)
  })
  assert.equal(text(renderer, "pickup-id"), hkLocation.id)
  assert.equal(text(renderer, "pickup-reason"), "")
  assert.equal(
    renderer.root.findByProps({ id: "select-location" }).props.disabled,
    false
  )

  act(() => {
    renderer.update(<PickupSelectionHarness zoneCountryCode="hk" />)
  })
  assert.equal(text(renderer, "pickup-id"), hkLocation.id)
  assert.equal(text(renderer, "pickup-reason"), "")
})

test("the current shipping option keeps its own pickup binding valid", () => {
  let renderer: any
  act(() => {
    renderer = TestRenderer.create(
      <PickupSelectionHarness
        zoneCountryCode="hk"
        currentShippingOptionId="so_current"
        boundShippingOptionId="so_current"
      />
    )
  })
  assert.equal(text(renderer, "pickup-id"), hkLocation.id)
  assert.equal(text(renderer, "pickup-reason"), "")
})

test("a selected pickup location is cleared if another option occupies it", () => {
  let renderer: any
  act(() => {
    renderer = TestRenderer.create(
      <PickupSelectionHarness zoneCountryCode="hk" />
    )
  })
  assert.equal(text(renderer, "pickup-id"), hkLocation.id)

  act(() => {
    renderer.update(
      <PickupSelectionHarness
        zoneCountryCode="hk"
        boundShippingOptionId="so_other"
      />
    )
  })
  assert.equal(text(renderer, "pickup-id"), "")
  assert.equal(text(renderer, "pickup-reason"), "already_assigned")
})

test("delayed associations disable interaction, initialize once, and survive later responses", () => {
  let renderer: any
  act(() => {
    renderer = TestRenderer.create(
      <ProductAssociationHarness
        optionsReady
        loading
        error={false}
      />
    )
  })
  assert.equal(
    renderer.root.findByProps({ id: "option-existing" }).props.disabled,
    true
  )

  act(() => {
    renderer.update(
      <ProductAssociationHarness
        associationIds={["so_existing"]}
        optionsReady
        loading={false}
        error={false}
      />
    )
  })
  assert.equal(text(renderer, "initialized"), "true")
  assert.equal(text(renderer, "selected-options"), "so_existing")
  assert.equal(
    renderer.root.findByProps({ id: "option-existing" }).props.disabled,
    false
  )

  act(() => {
    renderer.update(
      <ProductAssociationHarness
        associationIds={["so_late_refetch"]}
        optionsReady
        loading={false}
        error={false}
      />
    )
  })
  assert.equal(text(renderer, "selected-options"), "so_existing")
})

test("associations may arrive before the option list without losing the initial selection", () => {
  let renderer: any
  act(() => {
    renderer = TestRenderer.create(
      <ProductAssociationHarness
        associationIds={["so_existing"]}
        optionsReady={false}
        loading={false}
        error={false}
      />
    )
  })
  assert.equal(text(renderer, "selected-options"), "so_existing")
  assert.equal(
    renderer.root.findByProps({ id: "option-existing" }).props.disabled,
    true
  )

  act(() => {
    renderer.update(
      <ProductAssociationHarness
        associationIds={["so_existing"]}
        optionsReady
        loading={false}
        error={false}
      />
    )
  })
  assert.equal(text(renderer, "selected-options"), "so_existing")
  assert.equal(
    renderer.root.findByProps({ id: "option-existing" }).props.disabled,
    false
  )
})

test("a dirty shipping selection is never overwritten by the initial association response", () => {
  let renderer: any
  act(() => {
    renderer = TestRenderer.create(
      <ProductAssociationHarness
        optionsReady
        loading
        error={false}
      />
    )
  })
  act(() => renderer.root.findByProps({ id: "make-dirty" }).props.onClick())
  assert.equal(text(renderer, "selected-options"), "so_user")

  act(() => {
    renderer.update(
      <ProductAssociationHarness
        associationIds={["so_existing"]}
        optionsReady
        loading={false}
        error={false}
      />
    )
  })
  assert.equal(text(renderer, "initialized"), "true")
  assert.equal(text(renderer, "selected-options"), "so_user")
})

test("a failed association load remains blocked until retry succeeds", () => {
  let retryCount = 0
  let renderer: any
  act(() => {
    renderer = TestRenderer.create(
      <ProductAssociationHarness
        optionsReady
        loading={false}
        error
        onRetry={() => retryCount++}
      />
    )
  })
  assert.equal(
    renderer.root.findByProps({ id: "option-existing" }).props.disabled,
    true
  )
  act(() => renderer.root.findByProps({ id: "retry" }).props.onClick())
  assert.equal(retryCount, 1)

  act(() => {
    renderer.update(
      <ProductAssociationHarness
        optionsReady
        loading
        error={false}
        onRetry={() => retryCount++}
      />
    )
  })
  assert.equal(
    renderer.root.findByProps({ id: "option-existing" }).props.disabled,
    true
  )

  act(() => {
    renderer.update(
      <ProductAssociationHarness
        associationIds={["so_existing"]}
        optionsReady
        loading={false}
        error={false}
        onRetry={() => retryCount++}
      />
    )
  })
  assert.equal(text(renderer, "selected-options"), "so_existing")
  assert.equal(
    renderer.root.findByProps({ id: "option-existing" }).props.disabled,
    false
  )
})
