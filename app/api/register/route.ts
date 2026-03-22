import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createSignedSessionToken, getSessionCookieOptions, SESSION_COOKIE_NAME, type AppRole } from "@/lib/auth/session"
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/auth/phone"
import { hashPassword } from "@/lib/auth/password"

type RegisterRole = "registered"

function normalizeName(input: unknown) {
  return String(input || "")
    .trim()
    .replace(/\s+/g, " ")
}

function normalizeEmail(input: unknown) {
  return String(input || "").trim().toLowerCase()
}

function normalizePassword(input: unknown) {
  return String(input || "").trim()
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function normalizeRole(input: unknown): RegisterRole | null {
  if (input === "registered" || input === undefined || input === null || input === "") {
    return "registered"
  }

  return null
}

async function getNextAccountNumber() {
  const supabase = await createClient()

  const [{ data: userRows }, { data: studentRows }] = await Promise.all([
    supabase.from("users").select("account_number").order("account_number", { ascending: false }).limit(1),
    supabase.from("students").select("account_number").order("account_number", { ascending: false }).limit(1),
  ])

  const userMax = Number(userRows?.[0]?.account_number || 0)
  const studentMax = Number(studentRows?.[0]?.account_number || 0)
  return Math.max(userMax, studentMax, 100000) + 1
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = normalizeName(body?.name)
    const email = normalizeEmail(body?.email)
    const phoneNumber = normalizePhoneNumber(body?.phoneNumber ?? body?.phone_number)
    const password = normalizePassword(body?.password)
    const role = normalizeRole(body?.role)

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "البريد الإلكتروني غير صحيح" }, { status: 400 })
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json({ error: "أدخل رقم جوال صحيحًا" }, { status: 400 })
    }

    if (password.length < 4) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تكون 4 أحرف أو أرقام على الأقل" }, { status: 400 })
    }

    if (!role) {
      return NextResponse.json({ error: "التسجيل العام ينشئ حسابًا عاديًا فقط" }, { status: 400 })
    }

    const supabase = await createClient()
    const [{ data: emailOwner, error: emailError }, { data: phoneOwner, error: phoneError }] = await Promise.all([
      supabase.from("users").select("id").eq("email", email).limit(1).maybeSingle(),
      supabase.from("users").select("id").eq("phone_number", phoneNumber).limit(1).maybeSingle(),
    ])

    if (emailError || phoneError) {
      console.error("[register] Error checking existing account:", emailError || phoneError)
      return NextResponse.json({ error: "تعذر التحقق من البيانات" }, { status: 500 })
    }

    if (emailOwner) {
      return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 409 })
    }

    if (phoneOwner) {
      return NextResponse.json({ error: "رقم الجوال مستخدم بالفعل" }, { status: 409 })
    }

    const accountNumber = await getNextAccountNumber()
    const passwordHash = hashPassword(password)

    const { data: createdUser, error } = await supabase
      .from("users")
      .insert({
        name,
        email,
        phone_number: phoneNumber,
        password_hash: passwordHash,
        role,
        account_number: accountNumber,
        halaqah: "",
      })
      .select("id, name, role, account_number, halaqah, email, phone_number")
      .single()

    if (error || !createdUser) {
      console.error("[register] Error creating account:", error)
      return NextResponse.json({ error: "تعذر إنشاء الحساب" }, { status: 500 })
    }

    const sessionData = {
      id: String(createdUser.id),
      name: createdUser.name,
      role: createdUser.role as AppRole,
      accountNumber: String(createdUser.account_number),
      halaqah: createdUser.halaqah || "",
      email: createdUser.email || "",
      phoneNumber: createdUser.phone_number || "",
    }

    const { token, expiresAt } = await createSignedSessionToken(sessionData)
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: sessionData.id,
          name: sessionData.name,
          role: sessionData.role,
          accountNumber: sessionData.accountNumber,
          halaqah: sessionData.halaqah,
          email: sessionData.email,
          phoneNumber: sessionData.phoneNumber,
        },
      },
      { status: 200 },
    )

    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(expiresAt))
    return response
  } catch (error) {
    console.error("[register] Unexpected error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء الحساب" }, { status: 500 })
  }
}