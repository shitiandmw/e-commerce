"use client"

const TOKEN_KEY = "medusa_customer_token"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
  window.dispatchEvent(new Event("auth-change"))
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new Event("auth-change"))
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch("/api/auth?action=login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error("登录失败")
  const result = await res.json()
  const token = result.token || result
  if (typeof token !== "string") throw new Error("登录失败")
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
      throw new Error("该邮箱已被注册")
    }
    throw new Error("注册失败")
  }
  const result = await res.json()
  const token = result.token || result
  if (typeof token !== "string") throw new Error("注册失败")
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
  try {
    await fetch("/api/auth?action=reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email }),
    })
  } catch {
    // Don't leak whether user exists
  }
}

export async function getCustomer() {
  const token = getToken()
  if (!token) return null
  try {
    const res = await fetch("/api/auth?action=me", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) { removeToken(); return null }
    const data = await res.json()
    return data.customer
  } catch {
    removeToken()
    return null
  }
}
