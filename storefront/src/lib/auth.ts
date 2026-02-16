"use client"

import { sdk } from "./medusa"

const TOKEN_KEY = "medusa_customer_token"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

export async function register(data: {
  email: string
  password: string
  first_name: string
  last_name: string
}): Promise<string> {
  // Step 1: Register auth identity
  const token = await sdk.auth.register("customer", "emailpass", {
    email: data.email,
    password: data.password,
  })

  if (typeof token !== "string") {
    throw new Error("注册失败")
  }

  setToken(token)

  // Step 2: Create customer profile
  await sdk.store.customer.create(
    {
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
    },
    {},
    { Authorization: `Bearer ${token}` }
  )

  return token
}

export async function login(email: string, password: string): Promise<string> {
  const token = await sdk.auth.login("customer", "emailpass", {
    email,
    password,
  })

  if (typeof token !== "string") {
    throw new Error("登录失败")
  }

  setToken(token)
  return token
}

export async function logout() {
  removeToken()
}

export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await sdk.auth.resetPassword("customer", "emailpass", {
      identifier: email,
    })
  } catch {
    // Don't leak whether user exists - always succeed silently
  }
}

export async function getCustomer() {
  const token = getToken()
  if (!token) return null
  try {
    const { customer } = await sdk.store.customer.retrieve(
      {},
      { Authorization: `Bearer ${token}` }
    )
    return customer
  } catch {
    removeToken()
    return null
  }
}
