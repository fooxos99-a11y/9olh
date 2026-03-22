"use client"

import { useEffect, useState } from "react"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { SiteLoader } from "@/components/ui/site-loader"
import { Button } from "@/components/ui/button"

type ContactMessage = {
  id: string
  name: string
  subject: string
  message: string
  status: string
  created_at?: string
}

export default function AdminContactMessagesPage() {
  const { isLoading: authLoading, isVerified } = useAdminAuth()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)

  const loadMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/contact", { cache: "no-store" })
      const data = await response.json()
      if (response.ok) {
        setMessages(data.messages || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && isVerified) {
      void loadMessages()
    }
  }, [authLoading, isVerified])

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/contact", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    await loadMessages()
  }

  const deleteMessage = async (id: string) => {
    await fetch(`/api/contact?id=${id}`, { method: "DELETE" })
    await loadMessages()
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_50%,#ffffff_100%)]" dir="rtl">
        <SiteLoader size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_50%,#ffffff_100%)] px-4 py-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[2rem] border border-[#7c3aed]/10 bg-white p-6 shadow-[0_24px_80px_rgba(124,58,237,0.08)] md:p-8">
          <div className="text-sm font-bold text-[#7c3aed]">لوحة الإدارة</div>
          <h1 className="mt-2 text-3xl font-black text-[#1f1147] md:text-4xl">رسائل تواصل معنا</h1>
          <p className="mt-3 text-[#5b5570]">يمكنك قراءة الرسائل، تغيير حالتها، أو حذفها من هنا.</p>
        </div>

        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="rounded-[1.6rem] border border-[#7c3aed]/10 bg-white p-6 text-center text-[#5b5570] shadow-[0_18px_50px_rgba(124,58,237,0.06)]">
              لا توجد رسائل حاليًا.
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="rounded-[1.6rem] border border-[#7c3aed]/10 bg-white p-6 shadow-[0_18px_50px_rgba(124,58,237,0.06)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-black text-[#1f1147]">{message.name}</h2>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${message.status === "unread" ? "bg-[#f3e8ff] text-[#7c3aed]" : "bg-[#ecfdf5] text-[#047857]"}`}>
                        {message.status === "unread" ? "غير مقروءة" : "مقروءة"}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#7c3aed]">{message.subject}</div>
                    <p className="max-w-3xl leading-8 text-[#5b5570]">{message.message}</p>
                    <div className="text-xs text-[#8a83a8]">{message.created_at ? new Date(message.created_at).toLocaleString("ar-SA") : ""}</div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => updateStatus(message.id, message.status === "unread" ? "read" : "unread")}
                      variant="outline"
                      className="border-[#c4b5fd] text-[#6d28d9] hover:bg-[#f5f3ff]"
                    >
                      {message.status === "unread" ? "تعيين كمقروءة" : "إعادة كغير مقروءة"}
                    </Button>
                    <Button onClick={() => deleteMessage(message.id)} className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]">
                      حذف الرسالة
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}