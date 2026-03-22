"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, CreditCard, Sparkles } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function Home() {
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)

  return (
    <div className="min-h-screen overflow-x-hidden bg-white" dir="rtl">
      <Header />
      <main>
        <section className="relative min-h-screen overflow-hidden bg-white text-[#1f1147]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.12),_transparent_24%)]" />
          <div className="absolute right-[-8rem] top-20 h-72 w-72 rounded-full bg-[#a78bfa]/30 blur-3xl" />
          <div className="absolute left-[-6rem] top-1/3 h-80 w-80 rounded-full bg-[#ddd6fe]/70 blur-3xl" />
          <div className="absolute bottom-[-5rem] right-1/4 h-64 w-64 rounded-full bg-[#7c3aed]/12 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c4b5fd]/50 to-transparent" />
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(124,58,237,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.05)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className="container relative mx-auto min-h-screen px-4">
            <div className="flex min-h-[calc(100vh-88px)] items-start justify-center pt-24 pb-16 md:pt-28 lg:pt-32">
              <div className="w-full max-w-5xl space-y-10 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#7c3aed]/20 bg-[#f3e8ff] px-5 py-2.5 text-base font-semibold text-[#6d28d9]">
                  <Sparkles className="h-5 w-5" />
                    جمعنالك كل الألعاب في مكان واحد
                </div>
                <div className="space-y-5">
                  <h1 className="text-5xl font-black leading-[1.1] md:text-7xl">
                    صولة وجولة
                    <span className="mt-2 block text-[#7c3aed]">كل ألعابك في مكان واحد!</span>
                  </h1>
                </div>
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                  <Button size="lg" className="h-14 px-8 text-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9]" onClick={() => setPurchaseDialogOpen(true)}>
                      اشترك الآن
                      <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg border-[#7c3aed]/20 bg-white text-[#6d28d9] hover:bg-[#f5f3ff] hover:text-[#5b21b6]">
                    <Link href="/competitions">استعرض الألعاب</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#faf7ff] py-20">
          <div className="absolute left-[-7rem] top-10 h-56 w-56 rounded-full bg-white/70 blur-3xl" />
          <div className="absolute right-10 bottom-0 h-52 w-52 rounded-full bg-[#c4b5fd]/30 blur-3xl" />
          <div className="container mx-auto px-4">
            <div className="mb-12 max-w-2xl space-y-3">
              <div className="text-sm font-bold tracking-wide text-[#7c3aed]">لماذا صولة وجولة؟</div>
              <h2 className="text-3xl font-black text-[#1f1147] md:text-4xl">كل ألعابك في مكان واحد وبسعر واحد!</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-[1.75rem] border border-[#7c3aed]/10 bg-white p-6">
                <h3 className="mb-3 text-xl font-black text-[#111827]">ادفع مرة واحدة</h3>
                <p className="leading-8 text-[#6b7280]">دفعة واحدة فقط وتفتح لك جميع الألعاب في المنصة بدون دفع متكرر لكل لعبة.</p>
              </div>
              <div className="rounded-[1.75rem] border border-[#7c3aed]/10 bg-white p-6">
                <h3 className="mb-3 text-xl font-black text-[#111827]">آلاف الأسئلة في كل المجالات</h3>
                <p className="leading-8 text-[#6b7280]">محتوى كبير ومتنوع يغطي مجالات كثيرة، بحيث تقدر تلعب وتتحدى في كل مرة بأسئلة مختلفة.</p>
              </div>
              <div className="rounded-[1.75rem] border border-[#7c3aed]/10 bg-white p-6">
                <h3 className="mb-3 text-xl font-black text-[#111827]">كل شيء واضح وبسيط</h3>
                <p className="leading-8 text-[#6b7280]">بدون لف ودوران، تدخل تلقى ألعابك قدامك وتبدأ اللعب بسرعة وبشكل مرتب.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent className="max-w-md rounded-[1.75rem] border-[#7c3aed]/10 bg-white p-0 overflow-hidden" dir="rtl">
          <div className="bg-[linear-gradient(135deg,#7c3aed,#5b21b6)] px-6 py-6 text-white">
            <div className="mb-4 inline-flex rounded-2xl bg-white/10 p-3">
              <CreditCard className="h-5 w-5" />
            </div>
            <DialogHeader className="text-right">
              <DialogTitle className="text-2xl font-black text-white">الاشتراك في صولة وجولة</DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-7 text-white/80">
                الاشتراك يفعّل لك كامل المكتبة ويفتح لك جميع الألعاب. نربط هنا لاحقًا بوابة التفعيل الرسمية.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-6 py-6">
            <div className="rounded-2xl bg-[#faf7ff] p-4 text-sm leading-7 text-[#5b5570]">
              نعمل على ربط هذه النافذة مباشرة ببوابة التفعيل الكاملة قريبًا.
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="flex-1 bg-[#7c3aed] text-white hover:bg-[#6d28d9]">
                <Link href="/register" onClick={() => setPurchaseDialogOpen(false)}>
                  أنشئ حسابك
                </Link>
              </Button>
              <Button variant="outline" className="flex-1 border-[#7c3aed]/20 text-[#6d28d9] hover:bg-[#f5f3ff]" onClick={() => setPurchaseDialogOpen(false)}>
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
