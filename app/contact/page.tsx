"use client"

import type React from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useAlertDialog } from "@/hooks/use-confirm-dialog"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const showAlert = useAlertDialog()

  useEffect(() => {
    const userRole = localStorage.getItem("userRole")
    const userName = localStorage.getItem("userName")

    // Only set name if user is logged in (has a role)
    if (userRole && userName) {
      setFormData((prev) => ({ ...prev, name: userName }))
    }
  }, [])
  // </CHANGE>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        await showAlert("تم إرسال رسالتك بنجاح!", "نجاح")
        setFormData({ name: "", subject: "", message: "" })
      } else {
        await showAlert(data.error || "حدث خطأ أثناء إرسال الرسالة", "خطأ")
      }
    } catch (error) {
      console.error("[v0] Error submitting form:", error)
      await showAlert("حدث خطأ أثناء إرسال الرسالة", "خطأ")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_50%,#ffffff_100%)]" dir="rtl">
      <Header />
      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <section className="mx-auto max-w-2xl rounded-[2rem] border border-[#7c3aed]/10 bg-white p-6 shadow-[0_24px_80px_rgba(124,58,237,0.08)] md:p-8">
              <div className="mb-8 space-y-2 text-center">
                <h1 className="text-3xl font-black text-[#1f1147] md:text-5xl">تواصل معنا</h1>
                <p className="text-base leading-7 text-[#5b5570]">إذا عندك استفسار أو اقتراح، اكتب لنا مباشرة من النموذج.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-bold text-[#1f1147]">
                    الاسم <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="اكتب اسمك"
                    className="h-14 w-full rounded-2xl border border-[#d9d2f6] bg-[#fcfbff] px-4 text-[#1f1147] placeholder:text-[#8a83a8] outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="mb-2 block text-sm font-bold text-[#1f1147]">
                    موضوع الرسالة <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="h-14 w-full rounded-2xl border border-[#d9d2f6] bg-[#fcfbff] px-4 text-[#1f1147] outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10"
                  >
                    <option value="">اختر موضوع الرسالة</option>
                    <option value="inquiry">استفسار عام</option>
                    <option value="purchase">الشراء والتفعيل</option>
                    <option value="games">سؤال عن الألعاب</option>
                    <option value="suggestion">اقتراح أو تطوير</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="mb-2 block text-sm font-bold text-[#1f1147]">
                    الرسالة <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="اكتب رسالتك هنا بشكل واضح"
                    rows={6}
                    className="min-h-[180px] w-full rounded-[1.6rem] border border-[#d9d2f6] bg-[#fcfbff] px-4 py-4 text-[#1f1147] placeholder:text-[#8a83a8] outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-14 w-full rounded-2xl bg-[#7c3aed] text-base font-black text-white transition hover:bg-[#6d28d9] disabled:opacity-50"
                >
                  {isSubmitting ? "جاري الإرسال..." : "إرسال الرسالة"}
                </Button>
              </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
