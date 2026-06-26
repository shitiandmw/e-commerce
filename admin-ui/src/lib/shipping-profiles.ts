"use client"

import { adminFetch } from "./admin-api"

export type ShippingProfileRef = {
  id: string
  name?: string | null
  type?: string | null
}

type ShippingProfilesResponse = {
  shipping_profiles?: ShippingProfileRef[]
}

let defaultShippingProfilePromise: Promise<string | null> | null = null

export async function getDefaultShippingProfileId(): Promise<string | null> {
  if (!defaultShippingProfilePromise) {
    defaultShippingProfilePromise = adminFetch<ShippingProfilesResponse>(
      "/admin/shipping-profiles",
      {
        params: { limit: "50" },
      }
    )
      .then((data) => {
        const profiles = data.shipping_profiles ?? []
        return (
          profiles.find((profile) => profile.type === "default") ??
          (profiles.length === 1 ? profiles[0] : null) ??
          null
        )?.id ?? null
      })
      .catch((error) => {
        defaultShippingProfilePromise = null
        throw error
      })
  }

  return defaultShippingProfilePromise
}

export async function withDefaultShippingProfile<
  T extends Record<string, unknown>
>(payload: T): Promise<T> {
  const shippingProfileId = payload.shipping_profile_id

  if (
    typeof shippingProfileId === "string" &&
    shippingProfileId.trim().length > 0
  ) {
    return payload
  }

  const defaultShippingProfileId = await getDefaultShippingProfileId()
  if (!defaultShippingProfileId) {
    return payload
  }

  return {
    ...payload,
    shipping_profile_id: defaultShippingProfileId,
  }
}
