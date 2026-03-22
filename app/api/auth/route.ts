import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  createSignedSessionToken,
  getClearedSessionCookieOptions,
  getSessionCookieOptions,
  getSessionFromCookieHeader,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session"
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/auth/phone"
import { verifyPassword } from "@/lib/auth/password"

const BLOCKED_LEGACY_ROLES = ["teacher", "deputy_teacher", "supervisor"]

function normalizeName(input: unknown) {
  return String(input || "")
    .trim()
    .replace(/\s+/g, " ")
}

function normalizePassword(input: unknown) {
  return String(input || "").trim()
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromCookieHeader(request.headers.get("cookie"))

  if (!session) {
    return NextResponse.json({ success: false, user: null }, { status: 200 })
  }

  const supabase = await createClient()

  if (session.role === "student") {
    const { data: student } = await supabase
      .from("students")
      .select("id, name, account_number, halaqah")
      .eq("account_number", Number(session.accountNumber))
      .maybeSingle()

    if (!student) {
      const response = NextResponse.json({ success: false, user: null }, { status: 200 })
      response.cookies.set(SESSION_COOKIE_NAME, "", getClearedSessionCookieOptions())
      return response
    }

    const refreshedStudentSession = {
      id: String(student.id),
      name: student.name || "",
      role: "student" as const,
      accountNumber: String(student.account_number),
      halaqah: student.halaqah || "",
    }

    const response = NextResponse.json({ success: true, user: refreshedStudentSession })

    if (
      session.id !== refreshedStudentSession.id ||
      session.name !== refreshedStudentSession.name ||
      session.accountNumber !== refreshedStudentSession.accountNumber ||
      (session.halaqah || "") !== refreshedStudentSession.halaqah
    ) {
      const { token, expiresAt } = await createSignedSessionToken(refreshedStudentSession)
      response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(expiresAt))
    }

    return response
  }

  const { data: user } = await supabase
    .from("users")
    .select("id, name, role, account_number, halaqah, email, phone_number")
    .eq("account_number", Number(session.accountNumber))
    .maybeSingle()

  if (!user || BLOCKED_LEGACY_ROLES.includes(user.role)) {
    const response = NextResponse.json({ success: false, user: null }, { status: 200 })
    response.cookies.set(SESSION_COOKIE_NAME, "", getClearedSessionCookieOptions())
    return response
  }

  const refreshedUserSession = {
    id: String(user.id),
    name: user.name || "",
    role: user.role,
    accountNumber: String(user.account_number),
    halaqah: user.halaqah || "",
    email: user.email || "",
    phoneNumber: user.phone_number || "",
  } as const

  const response = NextResponse.json({ success: true, user: refreshedUserSession })

  if (
    session.id !== refreshedUserSession.id ||
    session.name !== refreshedUserSession.name ||
    session.role !== refreshedUserSession.role ||
    session.accountNumber !== refreshedUserSession.accountNumber ||
    (session.halaqah || "") !== refreshedUserSession.halaqah ||
    (session.email || "") !== refreshedUserSession.email ||
    (session.phoneNumber || "") !== refreshedUserSession.phoneNumber
  ) {
    const { token, expiresAt } = await createSignedSessionToken(refreshedUserSession)
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(expiresAt))
  }

  return response
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const phoneNumber = normalizePhoneNumber(body?.phoneNumber ?? body?.phone_number)
    const password = normalizePassword(body?.password)
    const accountNumber = String(body?.account_number || "").trim()

    const supabase = await createClient()

    if (phoneNumber || password) {
      if (!phoneNumber || !password) {
        return NextResponse.json({ error: "أدخل رقم الجوال وكلمة المرور" }, { status: 400 })
      }

      if (!isValidPhoneNumber(phoneNumber)) {
        return NextResponse.json({ error: "أدخل رقم جوال صحيحًا" }, { status: 400 })
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, name, role, account_number, halaqah, email, phone_number, password_hash")
        .eq("phone_number", phoneNumber)
        .limit(1)
        .maybeSingle()

      if (userError) {
        return NextResponse.json({ error: "حدث خطأ أثناء التحقق من الحساب" }, { status: 500 })
      }

      if (!user || !verifyPassword(password, user.password_hash)) {
        return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 })
      }

      if (BLOCKED_LEGACY_ROLES.includes(user.role)) {
        return NextResponse.json({ error: "هذا النوع من الحسابات لم يعد مدعومًا" }, { status: 403 })
      }

      const sessionData = {
        id: String(user.id),
        name: user.name,
        role: user.role,
        accountNumber: String(user.account_number),
        halaqah: user.halaqah || "",
        email: user.email || "",
        phoneNumber: user.phone_number || "",
      } as const

      const { token, expiresAt } = await createSignedSessionToken(sessionData)
      const response = NextResponse.json({
        success: true,
        user: {
          id: sessionData.id,
          name: sessionData.name,
          role: sessionData.role,
          accountNumber: user.account_number,
          halaqah: user.halaqah,
          email: sessionData.email,
          phoneNumber: sessionData.phoneNumber,
        },
      })

      response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(expiresAt))
      return response
    }

    if (!accountNumber || !/^[0-9]+$/.test(accountNumber)) {
      return NextResponse.json({ error: "رقم الحساب يجب أن يكون أرقام فقط" }, { status: 400 })
    }

    const accountNum = Number.parseInt(accountNumber)
    if (isNaN(accountNum) || accountNum <= 0) {
      return NextResponse.json({ error: "رقم الحساب غير صحيح" }, { status: 400 })
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, role, account_number, halaqah, email, phone_number")
      .eq("account_number", accountNum)
      .maybeSingle()

    if (userError) {
      return NextResponse.json({ error: "حدث خطأ أثناء التحقق من الحساب" }, { status: 500 })
    }

    if (user) {
      if (BLOCKED_LEGACY_ROLES.includes(user.role)) {
        return NextResponse.json({ error: "هذا النوع من الحسابات لم يعد مدعومًا" }, { status: 403 })
      }

      const sessionData = {
        id: String(user.id),
        name: user.name,
        role: user.role,
        accountNumber: String(user.account_number),
        halaqah: user.halaqah || "",
        email: user.email || "",
        phoneNumber: user.phone_number || "",
      } as const

      const { token, expiresAt } = await createSignedSessionToken(sessionData)
      const response = NextResponse.json({
        success: true,
        user: {
          id: sessionData.id,
          name: user.name,
          role: user.role,
          accountNumber: user.account_number,
          halaqah: user.halaqah,
          email: sessionData.email,
          phoneNumber: sessionData.phoneNumber,
        },
      })

      response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(expiresAt))
      return response
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, name, account_number, halaqah")
      .eq("account_number", accountNum)
      .maybeSingle()

    if (studentError) {
      return NextResponse.json({ error: "حدث خطأ أثناء التحقق من الحساب" }, { status: 500 })
    }

    if (student) {
      const sessionData = {
        id: String(student.id),
        name: student.name,
        role: "student" as const,
        accountNumber: String(student.account_number),
        halaqah: student.halaqah || "",
      }

      const { token, expiresAt } = await createSignedSessionToken(sessionData)
      const response = NextResponse.json({
        success: true,
        user: {
          id: sessionData.id,
          name: student.name,
          role: "student",
          accountNumber: student.account_number,
          halaqah: student.halaqah,
        },
      })

      response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(expiresAt))
      return response
    }

    return NextResponse.json({ error: "رقم الحساب غير صحيح" }, { status: 401 })
  } catch (error) {
    console.error("[v0] Auth error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء تسجيل الدخول" }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE_NAME, "", getClearedSessionCookieOptions())
  return response
}
