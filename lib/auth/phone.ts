export function normalizePhoneNumber(input: unknown) {
  const rawValue = String(input || "").trim()

  if (!rawValue) {
    return ""
  }

  const compactValue = rawValue.replace(/[\s()-]/g, "")
  const normalizedValue = compactValue.startsWith("00") ? `+${compactValue.slice(2)}` : compactValue
  const hasCountryPrefix = normalizedValue.startsWith("+")
  const digits = normalizedValue.replace(/\D/g, "")

  if (!digits) {
    return ""
  }

  return hasCountryPrefix ? `+${digits}` : digits
}

export function isValidPhoneNumber(phoneNumber: string) {
  const digits = normalizePhoneNumber(phoneNumber).replace(/\D/g, "")
  return digits.length >= 8 && digits.length <= 15
}

export const normalizeSaudiPhoneNumber = normalizePhoneNumber
export const isValidSaudiPhoneNumber = isValidPhoneNumber