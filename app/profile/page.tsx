"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SiteLoader } from "@/components/ui/site-loader"
import { Button } from "@/components/ui/button"
import { clearClientAuth } from "@/lib/auth/client"

type ProfileUser = {
  id: string
  name: string
  role: string
  accountNumber: string
  halaqah?: string
  email?: string
  phoneNumber?: string
}

const ADMIN_ROLES = ["admin", "مدير", "سكرتير", "مشرف تعليمي", "مشرف تربوي", "مشرف برامج"]

function getAccountLabel(role: string, isAdmin: boolean) {
  if (isAdmin) {
    return "أدمن"
  }

  if (role === "registered") {
    return "حساب مسجل"
  }

  return "مشترك"
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<ProfileUser | null>(null)
  const [loading, setLoading] = useState(true)
  const isAdmin = user ? ADMIN_ROLES.includes(user.role) : false

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      try {
        const response = await fetch("/api/auth", { cache: "no-store" })
        const data = await response.json()
        if (!response.ok || !data?.user) {
          router.replace("/login")
          return
        }

        if (!cancelled) {
          setUser({
            id: data.user.id,
            name: data.user.name,
            role: data.user.role,
            accountNumber: String(data.user.accountNumber),
            halaqah: data.user.halaqah || "",
            email: data.user.email || "",
            phoneNumber: data.user.phoneNumber || "",
          })
        }
      } catch {
        router.replace("/login")
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadUser()
    return () => {
      cancelled = true
    }
  }, [router])

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" })
    clearClientAuth()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_45%,#ffffff_100%)]" dir="rtl">
      <Header />
      <main className="flex-1 px-4 py-12 md:py-20">
        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center"><SiteLoader size="lg" /></div>
        ) : user ? (
          <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#7c3aed]/10 bg-white p-6 shadow-[0_24px_80px_rgba(124,58,237,0.08)] md:p-8">
            <div className="mb-8 space-y-2 text-center">
              <div className="text-sm font-bold text-[#7c3aed]">الملف الشخصي</div>
              <h1 className="text-3xl font-black text-[#1f1147] md:text-4xl">{user.name}</h1>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.4rem] border border-[#e9e2fb] bg-[#fcfbff] p-5">
                <div className="text-sm font-bold text-[#7c3aed]">نوع الحساب</div>
                <div className="mt-2 text-lg font-black text-[#1f1147]">{getAccountLabel(user.role, isAdmin)}</div>
              </div>
              <div className="rounded-[1.4rem] border border-[#e9e2fb] bg-[#fcfbff] p-5">
                <div className="text-sm font-bold text-[#7c3aed]">البريد الإلكتروني</div>
                <div className="mt-2 text-lg font-black text-[#1f1147]" dir="ltr">{user.email || "-"}</div>
              </div>
              <div className="rounded-[1.4rem] border border-[#e9e2fb] bg-[#fcfbff] p-5">
                <div className="text-sm font-bold text-[#7c3aed]">رقم الجوال</div>
                <div className="mt-2 text-lg font-black text-[#1f1147]" dir="ltr">{user.phoneNumber || "-"}</div>
              </div>
              <div className="rounded-[1.4rem] border border-[#e9e2fb] bg-[#fcfbff] p-5">
                <div className="text-sm font-bold text-[#7c3aed]">رقم الحساب</div>
                <div className="mt-2 text-lg font-black tracking-[0.1em] text-[#1f1147]" dir="ltr">{user.accountNumber}</div>
              </div>
            </div>

            <Button onClick={handleLogout} className="mt-8 h-14 w-full rounded-2xl bg-[#7c3aed] text-white hover:bg-[#6d28d9]">
              تسجيل الخروج
            </Button>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}