"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { persistClientAuth } from "@/lib/auth/client"
import { normalizePhoneNumber } from "@/lib/auth/phone"

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phoneNumber, password, role: "registered" }),
      })

      const data = await response.json()

      if (!response.ok || !data?.user) {
        setError(data?.error || "تعذر إنشاء الحساب")
        setIsLoading(false)
        return
      }

      persistClientAuth({
        id: data.user.id,
        name: data.user.name,
        role: data.user.role,
        accountNumber: String(data.user.accountNumber),
        halaqah: data.user.halaqah || "",
        email: data.user.email || "",
        phoneNumber: data.user.phoneNumber || "",
      })
      setIsSuccess(true)

      setTimeout(() => {
        router.push("/competitions")
      }, 1800)
    } catch (submitError) {
      console.error("[register] error:", submitError)
      setError("حدث خطأ أثناء إنشاء الحساب")
      setIsLoading(false)
    }
  }

  return (
    <div className="relative rounded-[2rem] border border-[#7c3aed]/10 bg-white p-6 shadow-[0_24px_80px_rgba(124,58,237,0.08)] md:p-8">
      {isSuccess ? (
        <div className="space-y-5 text-center">
          <CheckCircle2 className="mx-auto h-20 w-20 text-[#7c3aed]" />
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#1f1147]">تم إنشاء الحساب</h2>
            <p className="text-[#5b5570]">تم إنشاء حسابك بنجاح.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-black text-[#1f1147]">إنشاء حساب</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-bold text-[#1f1147]">الاسم</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اكتب اسمك"
              className="h-14 rounded-2xl border border-[#d9d2f6] bg-[#fcfbff] px-4 text-right text-[#1f1147] placeholder:text-[#8a83a8] focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold text-[#1f1147]">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="h-14 rounded-2xl border border-[#d9d2f6] bg-[#fcfbff] px-4 text-left text-[#1f1147] placeholder:text-[#8a83a8] focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10"
              required
              dir="ltr"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-bold text-[#1f1147]">رقم الجوال</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(normalizePhoneNumber(e.target.value))}
              placeholder="+966500000000"
              className="h-14 rounded-2xl border border-[#d9d2f6] bg-[#fcfbff] px-4 text-left text-[#1f1147] placeholder:text-[#8a83a8] focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10"
              required
              dir="ltr"
              autoComplete="tel"
              inputMode="tel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-bold text-[#1f1147]">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="اكتب كلمة المرور"
              className="h-14 rounded-2xl border border-[#d9d2f6] bg-[#fcfbff] px-4 text-left text-[#1f1147] placeholder:text-[#8a83a8] focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10"
              required
              dir="ltr"
              autoComplete="new-password"
            />
          </div>

          {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">{error}</div> : null}

          <Button type="submit" disabled={isLoading} className="h-14 w-full rounded-2xl bg-[#7c3aed] text-base font-black text-white hover:bg-[#6d28d9]">
            {isLoading ? "جاري إنشاء الحساب..." : <span className="flex items-center justify-center gap-2"><UserPlus className="h-5 w-5" />إنشاء الحساب</span>}
          </Button>

          <div className="text-center text-sm text-[#5b5570]">
            لديك حساب بالفعل؟ <Link href="/login" className="font-bold text-[#7c3aed]">تسجيل الدخول</Link>
          </div>
        </form>
      )}
    </div>
  )
}