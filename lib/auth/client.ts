export type ClientAuthUser = {
  id: string
  name: string
  role: string
  accountNumber: string
  halaqah?: string
  email?: string
  phoneNumber?: string
}

let clientAuthCache: ClientAuthUser | null | undefined

function normalizeStoredValue(value: string | null) {
  return String(value || "").trim()
}

export function getClientAuthFromStorage(): ClientAuthUser | null {
  if (typeof window === "undefined") {
    return null
  }

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
  if (!isLoggedIn) {
    return null
  }

  const currentUserRaw = localStorage.getItem("currentUser")
  const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null

  const id = normalizeStoredValue(currentUser?.id || null)
  const name = normalizeStoredValue(localStorage.getItem("userName") || currentUser?.name || null)
  const role = normalizeStoredValue(localStorage.getItem("userRole") || currentUser?.role || null)
  const accountNumber = normalizeStoredValue(
    localStorage.getItem("accountNumber") || localStorage.getItem("account_number") || currentUser?.account_number || null,
  )

  if (!name || !role) {
    return null
  }

  return {
    id,
    name,
    role,
    accountNumber,
    halaqah: normalizeStoredValue(localStorage.getItem("userHalaqah") || currentUser?.halaqah || null),
    email: normalizeStoredValue(localStorage.getItem("userEmail") || currentUser?.email || null),
    phoneNumber: normalizeStoredValue(localStorage.getItem("userPhone") || currentUser?.phone_number || null),
  }
}

export function getCachedClientAuth(): ClientAuthUser | null {
  if (clientAuthCache !== undefined) {
    return clientAuthCache
  }

  clientAuthCache = getClientAuthFromStorage()
  return clientAuthCache
}

export function setCachedClientAuth(user: ClientAuthUser | null) {
  clientAuthCache = user
}

export function persistClientAuth(user: ClientAuthUser) {
  setCachedClientAuth(user)
  localStorage.setItem(
    "currentUser",
    JSON.stringify({
      id: user.id,
      name: user.name,
      role: user.role,
      account_number: Number(user.accountNumber),
      halaqah: user.halaqah || "",
      email: user.email || "",
      phone_number: user.phoneNumber || "",
    }),
  )
  localStorage.setItem("account_number", user.accountNumber)
  localStorage.setItem("accountNumber", user.accountNumber)
  localStorage.setItem("userRole", user.role)
  localStorage.setItem("userName", user.name)
  localStorage.setItem("studentName", user.name)
  localStorage.setItem("userHalaqah", user.halaqah || "")
  localStorage.setItem("userEmail", user.email || "")
  localStorage.setItem("userPhone", user.phoneNumber || "")
  localStorage.setItem("isLoggedIn", "true")

  if (user.role === "student") {
    localStorage.setItem("studentId", user.id)
  }
}

export function clearClientAuth() {
  setCachedClientAuth(null)
  localStorage.removeItem("isLoggedIn")
  localStorage.removeItem("userRole")
  localStorage.removeItem("account_number")
  localStorage.removeItem("accountNumber")
  localStorage.removeItem("userName")
  localStorage.removeItem("studentName")
  localStorage.removeItem("studentId")
  localStorage.removeItem("userHalaqah")
  localStorage.removeItem("userEmail")
  localStorage.removeItem("userPhone")
  localStorage.removeItem("currentUser")
}