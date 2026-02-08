"use client"

import { sdk } from "./sdk"

const TOKEN_KEY = "medusa_admin_token"

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

export async function login(email: string, password: string): Promise<string> {
  const token = await sdk.auth.login("user", "emailpass", {
    email,
    password,
  })

  if (typeof token !== "string") {
    throw new Error("Authentication failed")
  }

  setToken(token)
  return token
}

export async function logout() {
  removeToken()
}
