import crypto from "node:crypto"

const KEY_LENGTH = 64

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex")
  return `${salt}.${hash}`
}

export function verifyPassword(password: string, storedHash?: string | null) {
  if (!storedHash) {
    return false
  }

  const [salt, originalHash] = storedHash.split(".")
  if (!salt || !originalHash) {
    return false
  }

  const candidateHash = crypto.scryptSync(password, salt, KEY_LENGTH)
  const originalBuffer = Buffer.from(originalHash, "hex")

  if (originalBuffer.length !== candidateHash.length) {
    return false
  }

  return crypto.timingSafeEqual(originalBuffer, candidateHash)
}