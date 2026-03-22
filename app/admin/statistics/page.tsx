"use client"

import { useEffect, useState } from "react"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { SiteLoader } from "@/components/ui/site-loader"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAdminAuth } from "@/hooks/use-admin-auth"

type StatisticsUser = {
  id: string
  name: string
  role: string
  accountNumber: string
  email: string
  phoneNumber: string
}

type StatisticsResponse = {
  stats: {
    totalUsers: number
    usersWithEmail: number
    usersWithPhone: number
  }
  users: StatisticsUser[]
}

const statCards: Array<{ key: keyof StatisticsResponse["stats"]; label: string }> = [
  { key: "totalUsers", label: "إجمالي المستخدمين" },
  { key: "usersWithEmail", label: "المستخدمون الذين لديهم إيميل" },
  { key: "usersWithPhone", label: "المستخدمون الذين لديهم رقم جوال" },
]

export default function AdminStatisticsPage() {
  const { isLoading: authLoading, isVerified } = useAdminAuth()
  const [data, setData] = useState<StatisticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isVerified) {
      return
    }

    let cancelled = false

    async function loadStatistics() {
      setIsLoading(true)
      setError("")

      try {
        const response = await fetch("/api/admin/statistics", { cache: "no-store" })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload?.error || "تعذر تحميل الإحصائيات")
        }

        if (!cancelled) {
          setData(payload)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الإحصائيات")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadStatistics()

    return () => {
      cancelled = true
    }
  }, [isVerified])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]" dir="rtl">
        <SiteLoader size="md" />
      </div>
    )
  }

  if (!isVerified) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_45%,#ffffff_100%)]" dir="rtl">
      <Header />
      <main className="flex-1 px-4 py-12 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex rounded-[1.5rem] border border-[#d9cdf8] bg-white px-8 py-4 text-xl font-black text-[#7c3aed] shadow-[0_18px_50px_rgba(124,58,237,0.12)]">
              إحصائيات المستخدمين
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-[#ece7fb] bg-white shadow-[0_24px_80px_rgba(124,58,237,0.08)]">
              <SiteLoader size="md" />
            </div>
          ) : error ? (
            <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-5 text-center text-sm font-bold text-red-700">
              {error}
            </div>
          ) : data ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {statCards.map((card) => (
                  <div
                    key={card.key}
                    className="rounded-[1.8rem] border border-[#e9e2fb] bg-white p-6 shadow-[0_24px_80px_rgba(124,58,237,0.08)]"
                  >
                    <div className="text-sm font-bold text-[#7c3aed]">{card.label}</div>
                    <div className="mt-4 text-4xl font-black text-[#1f1147]">{data.stats[card.key]}</div>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-[#e9e2fb] bg-white shadow-[0_24px_80px_rgba(124,58,237,0.08)]">
                <div className="border-b border-[#f0eafe] px-6 py-5">
                  <h2 className="text-2xl font-black text-[#1f1147]">قائمة المستخدمين</h2>
                  <p className="mt-2 text-sm text-[#5b5570]">عدد السجلات المعروضة: {data.users.length}</p>
                </div>

                <Table className="min-w-[840px] text-right">
                  <TableHeader>
                    <TableRow className="bg-[#faf7ff] hover:bg-[#faf7ff]">
                      <TableHead className="px-4 py-4 text-right font-black text-[#1f1147]">الاسم</TableHead>
                      <TableHead className="px-4 py-4 text-right font-black text-[#1f1147]">رقم الحساب</TableHead>
                      <TableHead className="px-4 py-4 text-right font-black text-[#1f1147]">الدور</TableHead>
                      <TableHead className="px-4 py-4 text-right font-black text-[#1f1147]">الإيميل</TableHead>
                      <TableHead className="px-4 py-4 text-right font-black text-[#1f1147]">رقم الجوال</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.map((user) => (
                      <TableRow key={user.id} className="border-[#f2ecff] hover:bg-[#fcfbff]">
                        <TableCell className="px-4 py-4 font-bold text-[#1f1147]">{user.name}</TableCell>
                        <TableCell className="px-4 py-4 text-[#5b5570]" dir="ltr">{user.accountNumber}</TableCell>
                        <TableCell className="px-4 py-4 text-[#5b5570]">{user.role}</TableCell>
                        <TableCell className="px-4 py-4 text-[#5b5570]" dir="ltr">{user.email}</TableCell>
                        <TableCell className="px-4 py-4 text-[#5b5570]" dir="ltr">{user.phoneNumber}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  )
}