import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-[#7c3aed]/10 bg-[linear-gradient(180deg,#faf7ff_0%,#f3ecff_100%)] text-[#1f1147]" dir="rtl">
      <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-3">
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-[#4c1d95]">صولة وجولة</h3>
          <p className="text-sm leading-7 text-[#5b5570]">
            منصة ألعاب عربية تنافسية تضم مجموعة من التحديات والمسابقات الممتعة بتجربة سريعة وواضحة تركّز على اللعب والحماس والتنوع.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-[#7c3aed]">روابط</h3>
          <div className="flex flex-col gap-2 text-sm text-[#4c1d95]">
            <Link href="/">الرئيسية</Link>
            <Link href="/competitions">الألعاب</Link>
            <Link href="/contact">تواصل معنا</Link>
            <Link href="/login">تسجيل الدخول</Link>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-[#7c3aed]">بيانات التواصل</h3>
          <div className="space-y-3 text-sm text-[#5b5570]">
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-[#7c3aed]" /><span>789 456 123+</span></div>
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-[#7c3aed]" /><span>info@example.com</span></div>
            <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-[#7c3aed]" /><span>السعودية، بريدة، الهلال</span></div>
          </div>
        </div>
      </div>
    </footer>
  )
}
