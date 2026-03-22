"use client"

import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SiteLoader } from "@/components/ui/site-loader"
import { ArrowRight, Check } from "lucide-react"
import { GameFinishOverlay } from "@/components/games/game-finish-overlay"
import { GameEntryPanel, GameEntryShell, GameField } from "@/components/games/game-entry-shell"

type DBQuestion = {
  id: string
  category_id: string
  question: string
  answer: string
  points: number
  answered?: boolean
  answeredBy?: string | null
}

type DBCategory = {
  id: string
  name: string
  questions: DBQuestion[]
}

type GameQuestion = {
  id: string
  points: number
  question: string
  answer: string
  answered: boolean
  answeredBy: string | null
}

type GameCategory = {
  id: string
  name: string
  questions: GameQuestion[]
}

type Step = "teams" | "categories" | "game"

type LifelineButtonProps = {
  icon: ReactNode
  tooltip: string
  ariaLabel: string
  disabled?: boolean
  active?: boolean
  used?: boolean
  tooltipAlign?: "center" | "left" | "right"
  tooltipWidthClass?: string
  onClick?: () => void
}

const MAX_SELECTED_CATEGORIES = 6

function LifelineButton({ icon, tooltip, ariaLabel, disabled = false, active = false, used = false, tooltipAlign = "center", tooltipWidthClass = "w-[220px] sm:w-[260px]", onClick }: LifelineButtonProps) {
  const tooltipPositionClass =
    tooltipAlign === "left"
      ? "left-0 translate-x-0 text-right"
      : tooltipAlign === "right"
        ? "right-0 translate-x-0 text-right"
        : "left-1/2 -translate-x-1/2 text-center"

  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={onClick}
        className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-[#6d28d9] shadow-sm transition ${
          active
            ? "border-[#7c3aed]/45 bg-[#f5f3ff] ring-2 ring-[#7c3aed]/15"
            : "border-[#d9d2f6] bg-white/90 hover:border-[#b8a4f4] hover:bg-[#faf7ff]"
        } ${disabled ? "cursor-not-allowed border-[#e4dcfa] bg-white text-[#b8a7eb] opacity-40 hover:border-[#e4dcfa] hover:bg-white" : ""} ${used ? "opacity-45" : ""}`}
      >
        {icon}
      </button>
      {tooltip ? (
        <div className={`pointer-events-none absolute top-full z-20 mt-2 max-w-[calc(100vw-2rem)] rounded-xl bg-[#7c3aed] px-3 py-2 text-xs font-bold leading-6 whitespace-normal break-words text-white opacity-0 shadow-lg transition group-hover:opacity-100 ${tooltipWidthClass} ${tooltipPositionClass}`}>
          {tooltip}
        </div>
      ) : null}
    </div>
  )
}

export default function CategoriesPage() {
  const [step, setStep] = useState<Step>("teams")
  const [allCategories, setAllCategories] = useState<DBCategory[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [gameCategories, setGameCategories] = useState<GameCategory[]>([])
  const [teamNames, setTeamNames] = useState(["", ""])
  const [teamScores, setTeamScores] = useState([0, 0])
  const [selectedQuestion, setSelectedQuestion] = useState<GameQuestion | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [editingTeam, setEditingTeam] = useState<number | null>(null)
  const [editScore, setEditScore] = useState("")
  const [currentTurn, setCurrentTurn] = useState(0)
  const [loading, setLoading] = useState(true)
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(60)
  const [timerActive, setTimerActive] = useState(false)
  const [doublePointsUsed, setDoublePointsUsed] = useState([false, false])
  const [questionBlockUsed, setQuestionBlockUsed] = useState([false, false])
  const [questionStealUsed, setQuestionStealUsed] = useState([false, false])
  const [questionSwapUsed, setQuestionSwapUsed] = useState([false, false])
  const [pendingDoubleTeam, setPendingDoubleTeam] = useState<number | null>(null)
  const [activeDoubleTeam, setActiveDoubleTeam] = useState<number | null>(null)
  const [questionOwnerTeam, setQuestionOwnerTeam] = useState<number | null>(null)
  const [questionBlocked, setQuestionBlocked] = useState(false)
  const [hasQuestionTransferred, setHasQuestionTransferred] = useState(false)
  const [stolenByTeam, setStolenByTeam] = useState<number | null>(null)
  const [questionsResetNeeded, setQuestionsResetNeeded] = useState(false)
  const [resettingQuestions, setResettingQuestions] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchUsedQuestions()
  }, [])

  useEffect(() => {
    if (!timerActive) {
      return
    }

    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }

    if (!selectedQuestion || showAnswer) {
      setTimerActive(false)
      return
    }
  }, [hasQuestionTransferred, questionBlocked, selectedQuestion, showAnswer, teamNames.length, timeLeft, timerActive])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      const data = await response.json()
      setAllCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching categories:", error)
      setAllCategories([])
    } finally {
      setLoading(false)
    }
  }

  const fetchUsedQuestions = async () => {
    try {
      const response = await fetch("/api/used-questions?gameType=categories")
      if (!response.ok) {
        setUsedQuestionIds([])
        return
      }
      const data = await response.json()
      setUsedQuestionIds(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching used questions:", error)
      setUsedQuestionIds([])
    }
  }

  const markQuestionAsUsed = async (questionId: string) => {
    try {
      await fetch("/api/used-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType: "categories", questionId })
      })
    } catch (error) {
      console.error("Error marking question as used:", error)
    }
  }

  const registerQuestionAsUsed = (questionId: string) => {
    setUsedQuestionIds((prev) => {
      if (prev.includes(questionId)) {
        return prev
      }

      return [...prev, questionId]
    })

    void markQuestionAsUsed(questionId)
  }


  // إعادة تعيين الأسئلة المستخدمة عند بدء لعبة جديدة أو الخروج
  const resetUsedQuestions = async () => {
    try {
      await fetch("/api/used-questions?gameType=categories", {
        method: "DELETE"
      });
      setUsedQuestionIds([]);
    } catch (error) {
      console.error("Error resetting used questions:", error);
    }
  }

  const handleTeamsSubmit = () => {
    const validNames = teamNames.slice(0, 2).map((name) => name.trim())
    if (validNames.every(Boolean)) {
      setTeamNames(validNames)
      setTeamScores([0, 0])
      setDoublePointsUsed([false, false])
      setQuestionBlockUsed([false, false])
      setQuestionStealUsed([false, false])
      setQuestionSwapUsed([false, false])
      setPendingDoubleTeam(null)
      setActiveDoubleTeam(null)
      setQuestionOwnerTeam(null)
      setQuestionBlocked(false)
      setHasQuestionTransferred(false)
      setStolenByTeam(null)
      setStep("categories")
    }
  }

  const toggleCategorySelection = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== categoryId))
    } else if (selectedCategoryIds.length < MAX_SELECTED_CATEGORIES) {
      setSelectedCategoryIds([...selectedCategoryIds, categoryId])
    }
  }

  const startGame = () => {
    const usedIds = Array.isArray(usedQuestionIds) ? usedQuestionIds : []
    let needsReset = false
    // دالة خلط مصفوفة
    function shuffle(arr: any[]) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    const selected = allCategories
      .filter(cat => selectedCategoryIds.includes(cat.id))
      .map(cat => {
        const availableQuestions = cat.questions.filter(q => !usedIds.includes(q.id))
        // تصنيف الأسئلة حسب النقاط
        const q200 = shuffle(availableQuestions.filter(q => q.points === 200))
        const q400 = shuffle(availableQuestions.filter(q => q.points === 400))
        const q600 = shuffle(availableQuestions.filter(q => q.points === 600))

        if (q200.length < 2 || q400.length < 2 || q600.length < 1) {
          needsReset = true
        }

        // اختيار اثنين 200، اثنين 400، واحد 600 بشكل عشوائي
        const selectedQuestions = [
          ...(q200.slice(0, 2)),
          ...(q400.slice(0, 2)),
          ...(q600.slice(0, 1))
        ].map(q => ({
          ...q,
          answered: false,
          answeredBy: null
        }))
        return {
          id: cat.id,
          name: cat.name,
          questions: selectedQuestions
        }
      })

    if (needsReset) {
      setQuestionsResetNeeded(true)
      return
    }

    setQuestionsResetNeeded(false)
    
    setGameCategories(selected)
    setStep("game")
  }

  const handleResetQuestions = async () => {
    setResettingQuestions(true)

    try {
      await resetUsedQuestions()
      await fetchUsedQuestions()
      setQuestionsResetNeeded(false)
    } finally {
      setResettingQuestions(false)
    }
  }

  const clearCurrentQuestionState = () => {
    setSelectedQuestion(null)
    setSelectedCategoryId(null)
    setShowAnswer(false)
    setTimerActive(false)
    setTimeLeft(60)
    setQuestionOwnerTeam(null)
    setActiveDoubleTeam(null)
    setQuestionBlocked(false)
    setHasQuestionTransferred(false)
    setStolenByTeam(null)
  }

  const handleEndGame = () => {
    clearCurrentQuestionState()
    setGameCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        questions: cat.questions.map((q) => ({ ...q, answered: true })),
      })),
    )
  }

  const handleActivateDoublePoints = () => {
    if (selectedQuestion !== null || pendingDoubleTeam !== null || doublePointsUsed[currentTurn]) {
      return
    }

    setPendingDoubleTeam(currentTurn)
    setDoublePointsUsed((prev) => prev.map((used, idx) => (idx === currentTurn ? true : used)))
  }

  const handleActivateQuestionBlock = () => {
    if (
      selectedQuestion === null ||
      showAnswer ||
      !timerActive ||
      questionOwnerTeam !== currentTurn ||
      hasQuestionTransferred ||
      questionBlocked ||
      questionBlockUsed[currentTurn]
    ) {
      return
    }

    setQuestionBlocked(true)
    setQuestionBlockUsed((prev) => prev.map((used, idx) => (idx === currentTurn ? true : used)))
  }

  const handleActivateQuestionSteal = (teamIdx: number) => {
    if (
      selectedQuestion === null ||
      showAnswer ||
      !timerActive ||
      teamIdx === currentTurn ||
      questionStealUsed[teamIdx] ||
      stolenByTeam !== null
    ) {
      return
    }

    setQuestionStealUsed((prev) => prev.map((used, idx) => (idx === teamIdx ? true : used)))
    setCurrentTurn(teamIdx)
    setQuestionOwnerTeam(teamIdx)
    setStolenByTeam(teamIdx)
    setQuestionBlocked(false)
    setHasQuestionTransferred(false)
  }

  const handleActivateQuestionSwap = () => {
    if (
      !selectedCategoryId ||
      !selectedQuestion ||
      showAnswer ||
      !timerActive ||
      questionSwapUsed[currentTurn]
    ) {
      return
    }

    const currentCategory = gameCategories.find((category) => category.id === selectedCategoryId)
    if (!currentCategory) {
      return
    }

    const alternatives = currentCategory.questions.filter(
      (question) => question.points === selectedQuestion.points && !question.answered && question.id !== selectedQuestion.id,
    )

    if (alternatives.length === 0) {
      return
    }

    const randomIdx = Math.floor(Math.random() * alternatives.length)
    registerQuestionAsUsed(alternatives[randomIdx].id)
    setQuestionSwapUsed((prev) => prev.map((used, idx) => (idx === currentTurn ? true : used)))
    setSelectedQuestion(alternatives[randomIdx])
    setShowAnswer(false)
    setTimeLeft(hasQuestionTransferred ? 20 : 60)
    setTimerActive(true)
  }

  const handleQuestionClick = (categoryId: string, question: GameQuestion) => {
    if (!question.answered) {
      const ownerTeam = currentTurn
      registerQuestionAsUsed(question.id)
      setSelectedCategoryId(categoryId)
      setSelectedQuestion(question)
      setShowAnswer(false)
      setTimeLeft(60)
      setTimerActive(true)
      setQuestionOwnerTeam(ownerTeam)
      setQuestionBlocked(false)
      setHasQuestionTransferred(false)

      if (pendingDoubleTeam === ownerTeam) {
        setActiveDoubleTeam(ownerTeam)
        setPendingDoubleTeam(null)
      } else {
        setActiveDoubleTeam(null)
      }
    }
  }

  const handleCorrectAnswer = (team: number | "none") => {
    if (selectedQuestion && selectedCategoryId !== null) {
      if (team !== "none") {
        const newScores = [...teamScores]
        const pointsToAdd = activeDoubleTeam === questionOwnerTeam && team === questionOwnerTeam
          ? selectedQuestion.points * 2
          : selectedQuestion.points
        newScores[team] += pointsToAdd
        setTeamScores(newScores)
      }
      setGameCategories(prev =>
        prev.map(cat =>
          cat.id === selectedCategoryId
            ? {
                ...cat,
                questions: cat.questions.map(q =>
                  q.id === selectedQuestion.id
                    ? {
                        ...q,
                        answered: true,
                        answeredBy:
                          team !== "none"
                            ? teamNames[team]
                            : "لا أحد",
                      }
                    : q
                ),
              }
            : cat
        )
      )
      // توزيع الدور بالتسلسل بين الفرق
      if (stolenByTeam !== null) {
        setCurrentTurn(stolenByTeam)
      } else {
        setCurrentTurn((prev) => (prev + 1) % teamNames.length)
      }
      clearCurrentQuestionState()
    }
  }

  const handleEditScore = (teamIdx: number) => {
    setEditingTeam(teamIdx)
    setEditScore(teamScores[teamIdx]?.toString() || "0")
  }

  const handleSaveScore = () => {
    const newScore = parseInt(editScore) || 0
    if (editingTeam !== null && editingTeam >= 0 && editingTeam < teamScores.length) {
      const newScores = [...teamScores]
      newScores[editingTeam] = newScore
      setTeamScores(newScores)
    }
    setEditingTeam(null)
    setEditScore("")
  }

  const handleCancelEdit = () => {
    setEditingTeam(null)
    setEditScore("")
  }

  const canUseDoublePoints = (teamIdx: number) => selectedQuestion === null && pendingDoubleTeam === null && !doublePointsUsed[teamIdx] && currentTurn === teamIdx
  const canUseQuestionBlock = (teamIdx: number) =>
    selectedQuestion !== null &&
    !showAnswer &&
    timerActive &&
    questionOwnerTeam === teamIdx &&
    currentTurn === teamIdx &&
    !hasQuestionTransferred &&
    !questionBlocked &&
    !questionBlockUsed[teamIdx]
  const canUseQuestionSteal = (teamIdx: number) =>
    selectedQuestion !== null &&
    !showAnswer &&
    timerActive &&
    stolenByTeam === null &&
    teamIdx !== currentTurn &&
    !questionStealUsed[teamIdx]
  const canUseQuestionSwap = (teamIdx: number) =>
    selectedQuestion !== null &&
    !showAnswer &&
    timerActive &&
    currentTurn === teamIdx &&
    !questionSwapUsed[teamIdx]
  const isSixCategoryBoard = gameCategories.length >= 6
  const isQuestionOpen = selectedQuestion !== null
  const finalRankings = [...teamNames.map((name, idx) => ({ name, score: teamScores[idx] }))].sort((a, b) => b.score - a.score)
  const renderTeamCard = (teamIdx: number) => (
    <button
      key={`team-card-${teamIdx}`}
      type="button"
      onClick={() => setEditingTeam(teamIdx)}
      className={`min-w-[96px] rounded-[1.35rem] border px-3 py-2 text-center shadow-sm transition ${
        currentTurn === teamIdx
          ? "border-[#7c3aed]/45 bg-[#f5f3ff] ring-2 ring-[#7c3aed]/15"
          : "border-[#d9d2f6] bg-white/90"
      }`}
    >
      <div className="truncate text-xs font-black text-[#6d28d9] md:text-sm">{teamNames[teamIdx]}</div>
      <div className="mt-1 text-2xl font-black leading-none text-[#7c3aed] md:text-[1.9rem]">{teamScores[teamIdx]}</div>
    </button>
  )

  const renderEndGameButton = () => (
    <LifelineButton
      icon={<img src="/انهاء.svg" alt="" className="h-8 w-8 object-contain" aria-hidden="true" />}
      tooltip="إنهاء اللعبة"
      ariaLabel="إنهاء اللعبة"
      tooltipWidthClass="w-[120px]"
      onClick={handleEndGame}
    />
  )

  const renderTeamLifelines = (teamIdx: number) => {
    const tooltipAlign = teamIdx === 0 ? "right" : "left"

    return (
    <div className="flex flex-wrap justify-center gap-2">
      <LifelineButton
        icon={
          <img src="/حرامي.svg" alt="" className="h-8 w-8 object-contain" aria-hidden="true" />
        }
        tooltip="بمجرد أن يطرح السؤال يحق للفريق الخصم أن يعلن رغبته في سرقة السؤال والإجابة عليه"
        ariaLabel={`سرقة السؤال لصالح ${teamNames[teamIdx]}`}
        active={stolenByTeam === teamIdx}
        used={questionStealUsed[teamIdx]}
        tooltipAlign={tooltipAlign}
        disabled={!canUseQuestionSteal(teamIdx) && stolenByTeam !== teamIdx}
        onClick={canUseQuestionSteal(teamIdx) ? () => handleActivateQuestionSteal(teamIdx) : undefined}
      />
      <LifelineButton
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-8 w-8">
            <circle cx="12" cy="12" r="8" />
            <path d="M7 7l10 10" strokeLinecap="round" />
          </svg>
        }
        tooltip="هذه الوسيلة يستخدمها الفريق صاحب السؤال لمنع الفريق الآخر من الإجابة عليه، وعند استخدامها لا يسمح للفريق الخصم بتقديم أي إجابة على هذا السؤال."
        ariaLabel={`حجب السؤال لصالح ${teamNames[teamIdx]}`}
        active={questionBlocked && questionOwnerTeam === teamIdx}
        used={questionBlockUsed[teamIdx]}
        tooltipAlign={tooltipAlign}
        disabled={!canUseQuestionBlock(teamIdx) && !(questionBlocked && questionOwnerTeam === teamIdx)}
        onClick={canUseQuestionBlock(teamIdx) ? () => {
          if (currentTurn === teamIdx) {
            handleActivateQuestionBlock()
          }
        } : undefined}
      />
      <LifelineButton
        icon={
          <img src="/اعادة.svg" alt="" className="h-8 w-8 object-contain" aria-hidden="true" />
        }
        tooltip="تغيير السؤال"
        ariaLabel={`تغيير السؤال لصالح ${teamNames[teamIdx]}`}
        active={false}
        used={questionSwapUsed[teamIdx]}
        tooltipAlign={tooltipAlign}
        tooltipWidthClass="w-[120px]"
        disabled={!canUseQuestionSwap(teamIdx)}
        onClick={canUseQuestionSwap(teamIdx) ? () => {
          if (currentTurn === teamIdx) {
            handleActivateQuestionSwap()
          }
        } : undefined}
      />
      <LifelineButton
        icon={<span className="text-[1.3rem] font-black leading-none">x2</span>}
        tooltip="إذا كانت الإجابة صحيحة يحصل الفريق على ضعف النقاط الخاصة بالسؤال بشرط أن تستعمل قبل الإجابة على السؤال."
        ariaLabel={`مضاعفة النقاط لصالح ${teamNames[teamIdx]}`}
        active={pendingDoubleTeam === teamIdx}
        used={doublePointsUsed[teamIdx]}
        tooltipAlign={tooltipAlign}
        disabled={!canUseDoublePoints(teamIdx) && pendingDoubleTeam !== teamIdx}
        onClick={canUseDoublePoints(teamIdx) ? () => {
          if (currentTurn === teamIdx) {
            handleActivateDoublePoints()
          }
        } : undefined}
      />
    </div>
    )
  }

  // صفحة إدخال أسماء الفرق
  if (step === "teams") {
    return (
      <GameEntryShell
        title="لعبة الفئات"
        badge="إعداد الفرق"
        containerClassName="max-w-3xl"
      >
        <GameEntryPanel>
          <div className="space-y-5">
            {teamNames.map((teamName, idx) => (
              <GameField
                key={idx}
                label={
                  <span>{`اسم الفريق ${idx + 1}`}</span>
                }
              >
                <Input
                  id={`team${idx + 1}`}
                  value={teamName || ""}
                  onChange={(e) => {
                    const newNames = [...teamNames]
                    newNames[idx] = e.target.value
                    setTeamNames(newNames)
                  }}
                  placeholder={`اكتب اسم الفريق ${idx + 1}`}
                  className="h-14 rounded-2xl border border-[#d9d2f6] bg-[#fcfbff] px-4 text-right text-[#1f1147] placeholder:text-[#8a83a8] focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10"
                />
              </GameField>
            ))}

            <Button
              onClick={handleTeamsSubmit}
              className="h-14 w-full rounded-2xl bg-[#7c3aed] text-lg font-black text-white hover:bg-[#6d28d9]"
            >
              التالي
              <ArrowRight className="mr-2 h-5 w-5" />
            </Button>
          </div>
        </GameEntryPanel>
      </GameEntryShell>
    )
  }

  // صفحة اختيار الفئات
  if (step === "categories") {
    return (
      <GameEntryShell
        title={`اختر ${MAX_SELECTED_CATEGORIES} فئات`}
        badge="مرحلة الاختيار"
        subtitle={`تم اختيار ${selectedCategoryIds.length} من ${MAX_SELECTED_CATEGORIES} فئات. ثم ابدأ الجولة.`}
        containerClassName="max-w-5xl"
      >
        <GameEntryPanel>
          {loading ? (
            <div className="py-12 text-center">
              <SiteLoader />
            </div>
          ) : (
            <>
              {questionsResetNeeded ? (
                <div className="mb-6 rounded-[1.5rem] border border-[#7c3aed]/15 bg-[#fcfbff] px-5 py-4 text-right shadow-sm">
                  <div className="text-sm font-bold leading-7 text-[#5b21b6] md:text-base">
                    لم تعد الأسئلة الجديدة كافية لبناء لوحة كاملة في الفئات المختارة لهذا المستخدم. أعد الأسئلة ثم ابدأ الجولة من جديد.
                  </div>
                  <Button
                    onClick={() => {
                      void handleResetQuestions()
                    }}
                    className="mt-4 h-12 rounded-2xl bg-[#7c3aed] px-6 text-sm font-black text-white hover:bg-[#6d28d9]"
                  >
                    {resettingQuestions ? "جارٍ إعادة الأسئلة..." : "إعادة الأسئلة"}
                  </Button>
                </div>
              ) : null}

              <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
                {allCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => toggleCategorySelection(category.id)}
                    disabled={!selectedCategoryIds.includes(category.id) && selectedCategoryIds.length >= MAX_SELECTED_CATEGORIES}
                    className={`relative rounded-[1.5rem] border p-5 text-right transition-all ${
                      selectedCategoryIds.includes(category.id)
                        ? "border-[#7c3aed]/30 bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_100%)] text-white shadow-[0_20px_50px_rgba(124,58,237,0.18)]"
                        : "border-[#e9e2fb] bg-[#fcfbff] text-[#1f1147] hover:border-[#c4b5fd]"
                    } ${!selectedCategoryIds.includes(category.id) && selectedCategoryIds.length >= MAX_SELECTED_CATEGORIES ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                  >
                    <h3 className="text-lg font-black">{category.name}</h3>
                    <p className={`mt-2 text-sm ${selectedCategoryIds.includes(category.id) ? "text-white/80" : "text-[#6f6788]"}`}>
                      {category.questions?.length || 0} أسئلة
                    </p>
                    {selectedCategoryIds.includes(category.id) ? (
                      <div className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#6d28d9]">
                        <Check className="h-4 w-4" />
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setStep("teams")}
                  variant="outline"
                  className="h-14 flex-1 rounded-2xl border-[#c4b5fd] text-base font-black text-[#6d28d9] hover:bg-[#f5f3ff]"
                >
                  رجوع
                </Button>
                <Button
                  onClick={startGame}
                  disabled={selectedCategoryIds.length !== MAX_SELECTED_CATEGORIES}
                  className="h-14 flex-1 rounded-2xl bg-[#7c3aed] text-base font-black text-white hover:bg-[#6d28d9]"
                >
                  ابدأ اللعبة
                  <ArrowRight className="mr-2 h-5 w-5" />
                </Button>
              </div>
            </>
          )}
        </GameEntryPanel>
      </GameEntryShell>
    )
  }

  // صفحة اللعبة
  return (
      <div className="relative min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_45%,#ffffff_100%)] px-2 py-4 sm:px-3 lg:px-4">
        <div className="mx-auto max-w-[1880px]">
        {/* شريط الدور والفرق */}
        <div className={`relative z-[60] mb-3 text-[#1f1147] sm:mb-4 ${
          isQuestionOpen
            ? "rounded-none border-transparent bg-transparent p-0 shadow-none backdrop-blur-0"
            : "rounded-[1.75rem] border-2 border-[#cdb8fb] bg-white/20 p-3 shadow-[0_24px_80px_rgba(124,58,237,0.08)] backdrop-blur-2xl sm:p-4"
        }`}>
          <div className="flex flex-col gap-3 xl:relative xl:min-h-[92px] xl:justify-center">
            <div className="flex justify-center transition xl:absolute xl:right-0 xl:top-1/2 xl:-translate-y-1/2">
              {renderTeamLifelines(0)}
            </div>

            <div className="flex justify-center transition xl:absolute xl:left-0 xl:top-1/2 xl:-translate-y-1/2">
              {renderTeamLifelines(1)}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 xl:px-[240px]">
              {renderTeamCard(0)}
              <div className="flex items-center justify-center gap-3 xl:min-w-[180px]">
                <div className="relative inline-flex items-center py-1 text-xl font-black tracking-[-0.04em] text-transparent md:text-2xl">
                  <span className="bg-gradient-to-l from-[#7c3aed] via-[#4c1d95] to-[#1f1147] bg-clip-text">صولة وجولة</span>
                  <span className="pointer-events-none absolute -bottom-1 right-0 h-[3px] w-10 rounded-full bg-gradient-to-l from-[#c4b5fd] to-[#7c3aed] md:w-12" />
                </div>
                {renderEndGameButton()}
              </div>
              {renderTeamCard(1)}
            </div>
          </div>
        </div>

        {/* لوحة الفئات */}
        <div className={`transition ${isQuestionOpen ? "pointer-events-none opacity-35 blur-[4px]" : ""}`}>
          <div className={isSixCategoryBoard ? "grid grid-cols-6 gap-2 sm:gap-3" : "grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-4"}>
          {gameCategories.map((category) => (
            <div key={category.id} className="flex flex-col">
              {/* عنوان الفئة */}
              <div className={`rounded-t-lg bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_100%)] text-center font-bold text-white shadow-md ${isSixCategoryBoard ? "p-3 text-sm lg:text-base" : "p-2 sm:p-3 text-sm sm:text-base"}`}>
                {category.name}
              </div>

              {/* الأسئلة */}
              <div className={`flex flex-col ${isSixCategoryBoard ? "gap-1.5" : "gap-1 sm:gap-2"}`}>
                {category.questions.map((question) => (
                  <button
                    key={question.id}
                    onClick={() => handleQuestionClick(category.id, question)}
                    disabled={question.answered}
                    className={`${isSixCategoryBoard ? "min-h-[84px] px-3 py-4 text-lg" : "p-2 sm:p-4 text-base sm:text-xl"} rounded-lg font-bold transition-all ${
                      question.answered
                        ? "bg-white/50 text-gray-300 cursor-not-allowed border-2 border-gray-200"
                        : "bg-white text-[#1f1147] hover:bg-[#faf7ff] cursor-pointer shadow-md hover:shadow-lg border-2 border-[#e9e2fb] hover:border-[#7c3aed]/35"
                    }`}
                  >
                    {question.answered ? "✓" : question.points}
                  </button>
                ))}
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* نافذة السؤال */}
      {selectedQuestion !== null ? (
        <>
          <div className="pointer-events-none fixed inset-0 z-40 bg-black/20" />
          <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pb-6 pt-40 sm:pt-44">
            <div className="w-full max-w-2xl rounded-2xl border border-[#7c3aed]/15 bg-white p-5 shadow-[0_24px_80px_rgba(31,17,71,0.18)] sm:p-6">
              <div className="space-y-2 text-center text-[#1a2332]">
                <div className="text-xl sm:text-3xl font-semibold">السؤال الحالي</div>
                <div className="text-lg sm:text-2xl text-[#7c3aed]">{selectedQuestion?.points} نقطة</div>
                <div className="text-2xl font-bold text-[#7c3aed]">
                  ⏱️ {timeLeft}s
                </div>
                {hasQuestionTransferred ? <div className="text-sm font-bold text-red-600">انتقل السؤال إلى الفريق التالي</div> : null}
              </div>

              <div className="space-y-4 py-3 sm:space-y-5 sm:py-4">
                <div className="rounded-lg border-2 border-[#7c3aed]/15 bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] p-4 sm:p-5">
                  <p className="text-center text-lg font-semibold text-[#1a2332] sm:text-2xl">
                    {selectedQuestion?.question}
                  </p>
                </div>

                {showAnswer ? (
                  <div className="rounded-lg border-2 border-[#7c3aed]/25 bg-[linear-gradient(180deg,#f8f5ff_0%,#ffffff_100%)] p-4 sm:p-5">
                    <p className="text-center text-base font-bold text-[#1a2332] sm:text-xl">
                      الإجابة: {selectedQuestion?.answer}
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3">
                  {!showAnswer ? (
                    <Button
                      onClick={() => setShowAnswer(true)}
                      className="w-full bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_100%)] py-6 text-xl text-white shadow-lg hover:bg-[linear-gradient(135deg,#6d28d9_0%,#5b21b6_100%)]"
                    >
                      إظهار الإجابة
                    </Button>
                  ) : (
                    <div className={`grid grid-cols-${teamNames.length + 1} gap-3`}>
                      {teamNames.map((name, idx) => (
                        <Button
                          key={idx}
                          onClick={() => handleCorrectAnswer(idx)}
                          className="bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_100%)] py-6 text-lg text-white shadow-lg hover:bg-[linear-gradient(135deg,#6d28d9_0%,#5b21b6_100%)]"
                        >
                          {name}
                        </Button>
                      ))}
                      <Button
                        onClick={() => handleCorrectAnswer("none")}
                        variant="outline"
                        className="border-2 border-gray-400 py-6 text-lg text-gray-600 hover:bg-gray-100"
                      >
                        محد جاوب
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* نافذة النتائج النهائية */}
      {gameCategories.length > 0 && gameCategories.every(cat => cat.questions.every(q => q.answered)) && (
        <GameFinishOverlay
          title={`مبروك الفوز للفريق: ${finalRankings[0]?.name || "-"}`}
          details={
            <div className="mx-auto mt-4 w-full max-w-md space-y-4">
              {finalRankings.map((team, idx) => (
                <div key={team.name} className="mb-2 flex items-center justify-between rounded-xl bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] p-4">
                  <span className="text-xl font-bold text-[#1a2332]">{idx + 1}. {team.name}</span>
                  <span className="text-2xl font-black text-[#7c3aed]">{team.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          }
          actions={[
            {
              label: "لعب مرة أخرى",
              onClick: () => {
                void (async () => {
                  await resetUsedQuestions()
                  await fetchUsedQuestions()
                  window.location.reload()
                })()
              },
            },
            {
              label: "خروج",
              onClick: () => {
                void (async () => {
                  await resetUsedQuestions()
                  await fetchUsedQuestions()
                  window.location.href = "/"
                })()
              },
              tone: "danger",
            },
          ]}
        />
      )}
      {/* مودال تعديل النقاط */}
      <Dialog open={editingTeam !== null} onOpenChange={handleCancelEdit}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center text-[#1a2332]">
              تعديل نقاط {editingTeam !== null ? teamNames[editingTeam] : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="editScore" className="text-lg font-semibold text-[#1a2332]">
                النقاط الجديدة
              </Label>
              <div className="flex items-center gap-8 mt-2 justify-center">
                <Button
                  type="button"
                  onClick={() => setEditScore((prev) => (parseInt(prev || "0") - 100).toString())}
                  className="text-4xl px-8 py-4 bg-transparent text-red-700 hover:bg-red-100 border-none shadow-none"
                  disabled={parseInt(editScore || "0") <= 0}
                >
                  -
                </Button>
                <span className="text-3xl font-bold w-16 text-center select-none">
                  {editScore}
                </span>
                <Button
                  type="button"
                  onClick={() => setEditScore((prev) => (parseInt(prev || "0") + 100).toString())}
                  className="text-4xl px-8 py-4 bg-transparent text-green-700 hover:bg-green-100 border-none shadow-none"
                >
                  +
                </Button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleSaveScore}
                className="flex-1 text-lg py-6 bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_100%)] text-white shadow-lg hover:bg-[linear-gradient(135deg,#6d28d9_0%,#5b21b6_100%)]"
              >
                حفظ
              </Button>
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                className="flex-1 text-lg py-6 border-2 border-gray-300 hover:bg-gray-100"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}