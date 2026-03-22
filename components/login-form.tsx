"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2 } from 'lucide-react'
import { persistClientAuth } from "@/lib/auth/client"
import { normalizePhoneNumber } from "@/lib/auth/phone"

export function LoginForm() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          password,
        }),
      })

      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json()
          setError(data.error || "رقم الحساب غير صحيح")
        } else {
          setError("حدث خطأ في الاتصال بالخادم")
        }
        setIsLoading(false)
        return
      }

      const data = await response.json()

      if (data.success && data.user) {
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
          router.push("/")
        }, 1500)
      } else {
        setError(data.error || "رقم الحساب غير صحيح")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("[v0] Login error:", error)
      setError("حدث خطأ أثناء تسجيل الدخول")
      setIsLoading(false)
    }
  }

  return (
    <div className="relative rounded-[2rem] border border-[#7c3aed]/10 bg-white p-6 shadow-[0_24px_80px_rgba(124,58,237,0.08)] md:p-8">
      {isSuccess && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[2rem] bg-white animate-in fade-in duration-300">
          <CheckCircle2 className="h-20 w-20 text-[#7c3aed] animate-in zoom-in duration-500 md:h-28 md:w-28" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-black text-[#1f1147]">تسجيل الدخول</h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className="text-sm font-bold text-[#1f1147]">
            رقم الجوال
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="+966500000000"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(normalizePhoneNumber(e.target.value))}
            className="h-14 rounded-2xl border border-[#d9d2f6] bg-[#fcfbff] px-4 text-left text-[#1f1147] placeholder:text-[#8a83a8] focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10"
            required
            dir="ltr"
            autoComplete="tel"
            inputMode="tel"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-bold text-[#1f1147]">
            كلمة المرور
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="اكتب كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 rounded-2xl border border-[#d9d2f6] bg-[#fcfbff] px-4 text-left text-[#1f1147] placeholder:text-[#8a83a8] focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10"
            required
            dir="ltr"
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">{error}</div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="h-14 w-full rounded-2xl bg-[#7c3aed] text-base font-black text-white hover:bg-[#6d28d9]"
        >
          {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
        </Button>
      </form>

      <div className="mt-5 text-center text-sm text-[#5b5570]">
        ليس لديك حساب؟ <Link href="/register" className="font-bold text-[#7c3aed]">إنشاء حساب جديد</Link>
      </div>
    </div>
  )
}
