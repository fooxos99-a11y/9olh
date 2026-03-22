import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { RegisterForm } from "@/components/register-form"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_45%,#ffffff_100%)]" dir="rtl">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-xl">
          <RegisterForm />
        </div>
      </main>

      <Footer />
    </div>
  )
}