import { NextResponse } from "next/server"
import { getSessionFromCookieHeader } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

const ADMIN_ROLES = new Set(["admin", "مدير", "سكرتير", "مشرف تعليمي", "مشرف تربوي", "مشرف برامج"])

export async function GET(request: Request) {
  const session = await getSessionFromCookieHeader(request.headers.get("cookie"))

  if (!session) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 })
  }

  if (!ADMIN_ROLES.has(session.role)) {
    return NextResponse.json({ error: "ليس لديك صلاحية الوصول" }, { status: 403 })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("users")
      .select("id, name, role, account_number, email, phone_number")
      .order("account_number", { ascending: true })

    if (error) {
      throw error
    }

    const users = (data || []).map((user) => ({
      id: String(user.id),
      name: user.name || "بدون اسم",
      role: user.role || "-",
      accountNumber: String(user.account_number || "-"),
      email: user.email || "-",
      phoneNumber: user.phone_number || "-",
    }))

    return NextResponse.json({
      stats: {
        totalUsers: users.length,
        usersWithEmail: users.filter((user) => user.email !== "-").length,
        usersWithPhone: users.filter((user) => user.phoneNumber !== "-").length,
      },
      users,
    })
  } catch (error) {
    console.error("[admin/statistics] Failed to load users:", error)
    return NextResponse.json({ error: "تعذر تحميل بيانات المستخدمين" }, { status: 500 })
  }
}