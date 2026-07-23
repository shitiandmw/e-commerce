"use client"

const TOKEN_KEY = "medusa_customer_token"
const AUTH_FAILURE_STATUSES = new Set([401])

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
  window.dispatchEvent(new Event("auth-change"))
  // Sync with chat widget
  ;(window as any).TimeCigarChat?.setCustomerToken(token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new Event("auth-change"))
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

export function isAuthFailureStatus(status: number): boolean {
  return AUTH_FAILURE_STATUSES.has(status)
}

export function syncAuthFromResponse(res: Response): boolean {
  if (isAuthFailureStatus(res.status)) {
    removeToken()
    return true
  }

  return false
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getToken()
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const res = await fetch(input, {
    ...init,
    headers,
  })
  syncAuthFromResponse(res)
  return res
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch("/api/auth?action=login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error("LOGIN_FAILED")
  const result = await res.json()
  const token = result.token || result
  if (typeof token !== "string") throw new Error("LOGIN_FAILED")
  setToken(token)
  return token
}

export async function register(data: {
  email: string
  password: string
  first_name: string
  last_name: string
}): Promise<string> {
  // Step 1: Register auth identity
  const res = await fetch("/api/auth?action=register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: data.email, password: data.password }),
  })
  if (!res.ok) {
    const err = await res.text()
    if (err.includes("exists") || err.includes("already")) {
      throw new Error("EMAIL_EXISTS")
    }
    throw new Error("REGISTER_FAILED")
  }
  const result = await res.json()
  const token = result.token || result
  if (typeof token !== "string") throw new Error("REGISTER_FAILED")
  setToken(token)

  // Step 2: Create customer profile
  await fetch("/api/auth?action=create-customer", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email: data.email, first_name: data.first_name, last_name: data.last_name }),
  })

  // Step 3: Re-login to get token with actor_id
  const freshToken = await login(data.email, data.password)
  return freshToken
}

export async function logout() {
  removeToken()
}

export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch("/api/auth?action=reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: email.trim().toLowerCase() }),
  })
  if (!res.ok) throw new Error("RESET_REQUEST_FAILED")
}

export async function resetPassword(
  email: string,
  password: string,
  token: string
): Promise<void> {
  const res = await fetch("/api/auth?action=update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  })
  if (!res.ok) throw new Error("PASSWORD_RESET_FAILED")
}

export async function getCustomer() {
  const token = getToken()
  if (!token) return null
  try {
    const res = await authFetch("/api/auth?action=me")
    if (!res.ok) return null
    const data = await res.json()
    return data.customer
  } catch {
    return null
  }
}
