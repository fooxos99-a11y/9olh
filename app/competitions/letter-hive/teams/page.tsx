"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { GameEntryPanel, GameEntryShell, GameField } from "@/components/games/game-entry-shell"

export default function LetterHiveTeams() {
  const [teamNames, setTeamNames] = useState(["", ""])

  const handleChange = (index: number, value: string) => {
    const newNames = [...teamNames]
    newNames[index] = value
    setTeamNames(newNames)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    window.location.href = `/competitions/letter-hive/game?team1=${encodeURIComponent(teamNames[0])}&team2=${encodeURIComponent(teamNames[1])}`
  }

  return (
    <GameEntryShell
      title="خلية الحروف"
      containerClassName="max-w-3xl"
    >
      <GameEntryPanel className="md:p-10">
        <form onSubmit={handleSubmit} className="space-y-5">
          <GameField label="اسم الفريق الأول">
            <input
              type="text"
              value={teamNames[0]}
              onChange={(e) => handleChange(0, e.target.value)}
              required
              placeholder="اكتب اسم الفريق الأول"
              className="h-14 w-full rounded-2xl border border-[#d9d2f6] bg-[#fcfbff] px-4 text-right text-[#1f1147] placeholder:text-[#8a83a8] outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10"
            />
          </GameField>

          <GameField label="اسم الفريق الثاني">
            <input
              type="text"
              value={teamNames[1]}
              onChange={(e) => handleChange(1, e.target.value)}
              required
              placeholder="اكتب اسم الفريق الثاني"
              className="h-14 w-full rounded-2xl border border-[#d9d2f6] bg-[#fcfbff] px-4 text-right text-[#1f1147] placeholder:text-[#8a83a8] outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10"
            />
          </GameField>

          <button
            type="submit"
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#7c3aed] px-6 text-lg font-black text-white transition hover:bg-[#6d28d9]"
          >
            ابدأ الجولة
            <ArrowLeft className="h-5 w-5" />
          </button>
        </form>
      </GameEntryPanel>
    </GameEntryShell>
  )
}
