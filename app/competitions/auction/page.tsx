"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SiteLoader } from "@/components/ui/site-loader"
import { Plus, Minus, HelpCircle, Trophy, RotateCcw } from "lucide-react"
import { GameEntryPanel, GameEntryShell, GameField } from "@/components/games/game-entry-shell"
import { GameFinishOverlay } from "@/components/games/game-finish-overlay"

const MIN_TEAMS = 2
const MAX_TEAMS = 10

type Team = {
  name: string
  score: number
}

type Question = {
  id: string
  category: {
    id: string
    name: string
  }
  question: string
  answer: string
}

export default function AuctionGame() {
  const [step, setStep] = useState<"setup" | "game" | "winner">("setup")
  const [teamNames, setTeamNames] = useState<string[]>(["", ""])
  const [teams, setTeams] = useState<Team[]>([])
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [usedCategoryIds, setUsedCategoryIds] = useState<string[]>([])
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showBiddingDialog, setShowBiddingDialog] = useState(false)
  const [bidAmount, setBidAmount] = useState(100)
  const [currentBidder, setCurrentBidder] = useState<number | null>(null)
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [timerActive, setTimerActive] = useState(false)

  const [cycleNotification, setCycleNotification] = useState(false)
  const [questionsExhausted, setQuestionsExhausted] = useState(false)
  const [resettingQuestions, setResettingQuestions] = useState(false)

  // تعديل النقاط يدويًا
  const [editingTeam, setEditingTeam] = useState<number | null>(null)
  const [editScore, setEditScore] = useState("")
  // منطق حفظ النقاط المعدلة يدويًا
  const handleSaveScore = () => {
    const newScore = parseInt(editScore) || 0
    if (editingTeam !== null && editingTeam >= 0 && editingTeam < teams.length) {
      const newTeams = [...teams]
      newTeams[editingTeam] = { ...newTeams[editingTeam], score: newScore }
      setTeams(newTeams)
    }
    setEditingTeam(null)
    setEditScore("")
  }

  const handleCancelEdit = () => {
    setEditingTeam(null)
    setEditScore("")
  }

  useEffect(() => {
    fetchQuestions()
    fetchUsedQuestions()
  }, [])

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false)
    }
  }, [timerActive, timeLeft])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/auction-questions")
      const data = await response.json()
      setAllQuestions(data)
    } catch (error) {
      console.error("Error fetching questions:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsedQuestions = async () => {
    try {
      const response = await fetch("/api/used-questions?gameType=auction")
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
        body: JSON.stringify({ gameType: "auction", questionId })
      })
    } catch (error) {
      console.error("Error marking question as used:", error)
    }
  }


  // تم تعطيل إعادة تعيين الأسئلة المستخدمة نهائيًا حتى لا تتكرر الأسئلة لنفس الحساب

  const handleTeamNameChange = (index: number, value: string) => {
    const newNames = [...teamNames]
    newNames[index] = value
    setTeamNames(newNames)
  }

  const addTeamField = () => {
    if (teamNames.length >= MAX_TEAMS) {
      return
    }

    setTeamNames((currentNames) => [...currentNames, ""])
  }

  const removeTeamField = (index: number) => {
    if (teamNames.length <= MIN_TEAMS) {
      return
    }

    setTeamNames((currentNames) => currentNames.filter((_, currentIndex) => currentIndex !== index))
  }

  const startGame = () => {
    const normalizedTeamNames = teamNames.map((name) => name.trim())

    if (normalizedTeamNames.every((name) => name)) {
      const initialTeams = normalizedTeamNames.map((name) => ({
        name,
        score: 1000
      }))
      setTeams(initialTeams)
      setUsedCategoryIds([])
      setStep("game")
    }
  }

  const commitQuestionSelection = async (question: Question, nextUsedCategoryIds: string[]) => {
    setCurrentQuestion(question)
    setUsedCategoryIds(nextUsedCategoryIds)
    setUsedQuestionIds((currentUsedIds) => (
      currentUsedIds.includes(question.id) ? currentUsedIds : [...currentUsedIds, question.id]
    ))
    await markQuestionAsUsed(question.id)
  }

  const getNextQuestionByCategoryCycle = (
    questions: Question[],
    consumedCategoryIds: string[],
    excludedCategoryIds: string[] = [],
  ) => {
    const eligibleQuestions = questions.filter((question) => !excludedCategoryIds.includes(question.category.id))

    if (eligibleQuestions.length === 0) {
      return { question: null, nextUsedCategoryIds: consumedCategoryIds }
    }

    const allAvailableCategoryIds = Array.from(
      new Map(questions.map((question) => [question.category.id, question.category.name])).entries(),
    )
      .sort((leftCategory, rightCategory) => leftCategory[1].localeCompare(rightCategory[1], "ar"))
      .map(([categoryId]) => categoryId)

    const eligibleCategoryIds = Array.from(
      new Map(eligibleQuestions.map((question) => [question.category.id, question.category.name])).entries(),
    )
      .sort((leftCategory, rightCategory) => leftCategory[1].localeCompare(rightCategory[1], "ar"))
      .map(([categoryId]) => categoryId)

    const normalizedConsumedCategoryIds = consumedCategoryIds.filter((categoryId) => allAvailableCategoryIds.includes(categoryId))
    const prioritizedCategoryIds = eligibleCategoryIds.filter((categoryId) => !normalizedConsumedCategoryIds.includes(categoryId))
    const shouldResetCycle = prioritizedCategoryIds.length === 0
    const nextCategoryId = (shouldResetCycle ? eligibleCategoryIds : prioritizedCategoryIds)[0]
    const categoryQuestions = eligibleQuestions.filter((question) => question.category.id === nextCategoryId)
    const randomQuestion = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)]

    return {
      question: randomQuestion,
      nextUsedCategoryIds: shouldResetCycle ? [nextCategoryId] : [...normalizedConsumedCategoryIds, nextCategoryId],
    }
  }

  const adjustScore = (teamIndex: number, amount: number) => {
    setTeams(teams.map((team, index) => {
      if (index === teamIndex) {
        const newScore = Math.max(0, team.score + amount)
        // التحقق من الفوز التلقائي
        if (newScore >= 10000) {
          setStep("winner")
          return { ...team, score: newScore }
        }
        return { ...team, score: newScore }
      }
      return team
    }))
  }

  const resetUsedQuestions = async () => {
    try {
      await fetch("/api/used-questions?gameType=auction", { method: "DELETE" })
      setUsedQuestionIds([])
    } catch (error) {
      console.error("Error resetting used questions:", error)
    }
  }

  const handleResetQuestions = async () => {
    setResettingQuestions(true)

    try {
      await resetUsedQuestions()
      await fetchUsedQuestions()
      setUsedCategoryIds([])
      setQuestionsExhausted(false)
      setCycleNotification(false)
    } finally {
      setResettingQuestions(false)
    }
  }

  const selectQuestion = async () => {
    const usedIds = Array.isArray(usedQuestionIds) ? usedQuestionIds : []
    const availableQuestions = allQuestions.filter(q => !usedIds.includes(q.id))

    if (availableQuestions.length === 0) {
      setQuestionsExhausted(true)
      setCycleNotification(true)
      setTimeout(() => setCycleNotification(false), 3000)
    }

    if (availableQuestions.length === 0) return

    setQuestionsExhausted(false)

    const { question: randomQuestion, nextUsedCategoryIds } = getNextQuestionByCategoryCycle(availableQuestions, usedCategoryIds)
    if (!randomQuestion) return

    await commitQuestionSelection(randomQuestion, nextUsedCategoryIds)
    setShowCategoryDialog(true)
  }

  const startBidding = (teamIndex: number) => {
    setCurrentBidder(teamIndex)
    setBidAmount(100)
    setShowCategoryDialog(false)
    setShowBiddingDialog(true)
  }

  const adjustBid = (amount: number) => {
    setBidAmount(prev => Math.max(100, prev + amount))
  }

  const confirmBid = () => {
    setShowAnswer(false)
    setShowBiddingDialog(false)
    setShowQuestionDialog(true)
    setTimeLeft(60)
    setTimerActive(true)
  }

  const handleCorrectAnswer = () => {
    if (currentBidder !== null) {
      setTeams(teams.map((team, index) => {
        if (index === currentBidder) {
          const newScore = team.score + bidAmount
          if (newScore >= 10000) {
            setStep("winner")
          }
          return { ...team, score: newScore }
        }
        return team
      }))
    }
    setShowQuestionDialog(false)
    setCurrentQuestion(null)
    setCurrentBidder(null)
    setTimerActive(false)
  }

  const handleWrongAnswer = () => {
    if (currentBidder !== null) {
      setTeams(teams.map((team, index) => {
        if (index === currentBidder) {
          return { ...team, score: Math.max(0, team.score - bidAmount) }
        }
        return team
      }))
    }
    setShowQuestionDialog(false)
    setCurrentQuestion(null)
    setCurrentBidder(null)
    setTimerActive(false)
  }

  const endGame = () => {
    setStep("winner")
  }

  const resetGame = () => {
    setStep("setup")
    setTeamNames(["", ""])
    setTeams([])
    setUsedCategoryIds([])
    setQuestionsExhausted(false)
    setCurrentQuestion(null)
    setShowAnswer(false)
  }

  const winnerTeam = teams.reduce((prev, current) => 
    (prev.score > current.score) ? prev : current
  , teams[0])
  const finalRankings = [...teams].sort((a, b) => b.score - a.score)

  // صفحة الإعداد
  if (step === "setup") {
    return (
      <GameEntryShell
        title="لعبة المزاد"
        badge="إعداد الجولة"
        containerClassName="max-w-3xl"
      >
        <GameEntryPanel>
          <div className="space-y-5">
            <div className="space-y-4">
              <div className="text-sm font-bold text-[#1f1147] md:text-base">أسماء الفرق</div>
              {teamNames.map((name, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder={`اكتب اسم الفريق ${index + 1}`}
                      value={name}
                      onChange={(e) => handleTeamNameChange(index, e.target.value)}
                      className="h-14 rounded-2xl border border-[#d9d2f6] bg-white px-4 text-right text-[#1f1147] placeholder:text-[#8a83a8] focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeTeamField(index)}
                      disabled={teamNames.length <= MIN_TEAMS}
                      className="h-14 min-w-14 rounded-2xl border-[#e7defc] bg-white px-4 text-[#7c3aed] hover:bg-[#f5f0ff] disabled:text-[#c5b4ef]"
                      title="حذف الفريق"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                  </div>

                  {index === teamNames.length - 1 ? (
                    <Button
                      type="button"
                      onClick={addTeamField}
                      disabled={teamNames.length >= MAX_TEAMS}
                      className="h-12 rounded-2xl bg-[#7c3aed] px-5 text-base font-black text-white hover:bg-[#6d28d9] disabled:bg-[#cdb8fb]"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      إضافة فريق
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>

            <Button
              onClick={startGame}
              disabled={!teamNames.every((name) => name.trim()) || loading}
              className="h-14 w-full rounded-2xl bg-[#7c3aed] text-lg font-black text-white hover:bg-[#6d28d9]"
            >
              {loading ? <SiteLoader size="sm" color="#ffffff" /> : "ابدأ اللعبة"}
            </Button>
          </div>
        </GameEntryPanel>
      </GameEntryShell>
    )
  }

  // صفحة الفائز
  if (step === "winner") {
    return (
      <GameFinishOverlay
        title={`مبروك الفوز للفريق: ${winnerTeam?.name ?? "-"}`}
        subtitle={`${winnerTeam?.score?.toLocaleString() ?? "0"} نقطة`}
        details={
          <div className="space-y-4 text-right">
            {finalRankings.map((team, index) => (
              <div key={`${team.name}-${index}`} className="flex items-center justify-between rounded-[1.35rem] border border-[#e9e2fb] bg-[#fcfbff] p-4">
                <span className="text-lg font-black text-[#1f1147]">{index + 1}. {team.name}</span>
                <span className="text-xl font-black text-[#7c3aed]">{team.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        }
        actions={[
          {
            label: "لعب مرة أخرى",
            onClick: resetGame,
            icon: <RotateCcw className="mr-2 h-5 w-5" />,
          },
        ]}
      />
    )
  }

  // صفحة اللعبة
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_45%,#ffffff_100%)] p-4 sm:p-8">

      {/* إشعار إعادة الأسئلة */}
      {cycleNotification && (
        <div className="fixed top-4 inset-x-0 mx-auto max-w-sm z-50 px-4">
          <div className="bg-[#1f1147] text-white text-sm font-semibold text-center rounded-xl px-5 py-3 shadow-xl">
            انتهت الأسئلة المتاحة لهذا المستخدم في لعبة المزاد.
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 rounded-[2rem] border border-[#d9d2f6] bg-white/75 px-6 py-6 text-center shadow-[0_20px_60px_rgba(124,58,237,0.08)] backdrop-blur-sm sm:mb-10 sm:px-8 sm:py-8">
          <h1 className="mb-3 pb-[0.18em] text-3xl font-black leading-[1.2] bg-gradient-to-r from-[#1f1147] to-[#7c3aed] bg-clip-text text-transparent sm:text-5xl">
            🏆 لعبة المزاد
          </h1>
          <p className="text-base font-bold leading-[1.7] text-[#4c4570] sm:text-lg">
            زايد على السؤال اللي واثق بإجابته واحسم الجولة لصالح فريقك.
          </p>
        </div>

        {/* عرض الفرق مع إمكانية تعديل النقاط */}
        <div className={`grid gap-4 sm:gap-6 mb-6 sm:mb-10 ${
          teams.length === 2 ? 'grid-cols-2' : 
          teams.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 
          'grid-cols-2 lg:grid-cols-4'
        }`}>
          {teams.map((team, index) => (
            <div
              key={index}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] rounded-2xl blur-sm group-hover:blur-md transition-all"></div>
              <div className="relative bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-[#7c3aed]/15 hover:border-[#7c3aed]/40 transition-all">
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-[#1a2332]">
                    {team.name}
                  </h3>
                  <div className="relative flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setEditingTeam(index)
                        setEditScore(team.score.toString())
                      }}
                      className="focus:outline-none"
                      title="تعديل النقاط"
                    >
                      <span className="text-4xl sm:text-6xl font-black bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] bg-clip-text text-transparent mb-1">
                        {team.score.toLocaleString()}
                      </span>
                    </button>
                    {/* كلمة نقطة أُزيلت بناءً على طلب المستخدم */}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {questionsExhausted ? (
          <div className="mb-6 rounded-2xl border border-[#7c3aed]/20 bg-white/85 px-5 py-4 text-center shadow-sm sm:mb-8">
            <div className="text-sm font-bold text-[#6d28d9] sm:text-base">
              انتهت الأسئلة المتاحة لهذا المستخدم في لعبة المزاد. يمكنك إعادة الأسئلة ثم متابعة اللعب.
            </div>
            <Button
              onClick={() => {
                void handleResetQuestions()
              }}
              className="mt-4 rounded-xl bg-[#7c3aed] px-6 py-2 text-sm font-black text-white hover:bg-[#6d28d9]"
            >
              {resettingQuestions ? "جارٍ إعادة الأسئلة..." : "إعادة الأسئلة"}
            </Button>
          </div>
        ) : null}
      {/* مودال تعديل النقاط */}
      <Dialog open={editingTeam !== null} onOpenChange={handleCancelEdit}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center text-[#1a2332]">
              تعديل نقاط {editingTeam !== null ? teams[editingTeam]?.name : ""}
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
                className="flex-1 text-lg py-6 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#6d28d9] hover:to-[#5b21b6] text-white shadow-lg"
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

        {/* أزرار التحكم */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-[#7c3aed]/15">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={selectQuestion}
              size="lg"
              disabled={loading || allQuestions.length === 0}
              className="flex-1 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#6d28d9] hover:to-[#5b21b6] text-white text-lg sm:text-xl px-8 py-6 sm:py-8 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <HelpCircle className="mr-2 w-6 h-6" />
              سؤال جديد
            </Button>
            <Button
              onClick={endGame}
              size="lg"
              className="flex-1 sm:flex-none bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-lg sm:text-xl px-8 py-6 sm:py-8 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Trophy className="mr-2 w-6 h-6" />
              إنهاء اللعبة
            </Button>
          </div>
        </div>
      </div>

      {/* مودال عرض الفئة واختيار الفريق مع زر إعادة */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-3xl text-center text-[#1a2332] mb-4 flex items-center justify-center gap-2">
              <span>الفئة</span>
              {/* زر تغيير الفئة */}
              {currentQuestion && (
                <Button
                  variant="ghost"
                  size="icon"
                  title="تغيير الفئة"
                  onClick={async () => {
                    const availableQuestions = allQuestions.filter(
                      (question) => !usedQuestionIds.includes(question.id),
                    )

                    if (availableQuestions.length === 0) {
                      alert("لا يوجد فئة أخرى بها أسئلة متاحة!");
                      return
                    }

                    const { question: randomQuestion, nextUsedCategoryIds } = getNextQuestionByCategoryCycle(
                      availableQuestions,
                      usedCategoryIds,
                      [currentQuestion.category.id],
                    )

                    if (!randomQuestion) {
                      alert("لا يوجد سؤال متاح في الفئة الجديدة!");
                      return
                    }

                    await commitQuestionSelection(randomQuestion, nextUsedCategoryIds)
                  }}
                  className="ml-2"
                >
                  <RotateCcw className="w-6 h-6 text-[#7c3aed]" />
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6 py-4 sm:py-6">
            <div className="bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] rounded-lg p-6 sm:p-12 mb-4 sm:mb-6">
              <p className="text-2xl sm:text-4xl text-center font-black text-white">
                {currentQuestion?.category.name}
              </p>
            </div>

            <p className="text-base sm:text-xl text-center text-[#1a2332] font-semibold mb-4 sm:mb-6">
              اختر الفريق الذي سيزايد:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {teams.map((team, index) => (
                <Button
                  key={index}
                  onClick={() => startBidding(index)}
                  className="bg-gradient-to-r from-[#fcfbff] to-[#f5f3ff] hover:from-[#7c3aed] hover:to-[#6d28d9] text-[#1a2332] hover:text-white border-2 border-[#cdb8fb] font-bold text-lg py-8"
                >
                  {team.name}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* مودال المزايدة */}
      <Dialog open={showBiddingDialog} onOpenChange={setShowBiddingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl text-center text-[#1a2332] mb-4">
              مبلغ المزاد
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {currentBidder !== null && (
              <div className="text-center mb-4">
                <p className="text-xl font-bold text-[#1a2332]">
                  الفريق: {teams[currentBidder]?.name}
                </p>
              </div>
            )}

            <div className="bg-gradient-to-r from-[#fcfbff] to-[#f5f3ff] rounded-lg p-6 sm:p-12 border-2 border-[#7c3aed]/20">
              <p className="text-3xl sm:text-6xl font-black text-center text-[#7c3aed]">
                {bidAmount.toLocaleString()}
              </p>
            </div>

            <div className="flex gap-3 sm:gap-4 justify-center items-center">
              <Button
                onClick={() => adjustBid(-100)}
                size="lg"
                className="bg-gradient-to-br from-[#6d28d9] to-[#5b21b6] hover:from-[#5b21b6] hover:to-[#4c1d95] text-white text-xl sm:text-2xl h-16 w-16 sm:h-20 sm:w-20 shadow-lg"
              >
                <Minus className="w-6 h-6 sm:w-8 sm:h-8" />
              </Button>
              <span className="text-lg sm:text-2xl font-bold text-[#1a2332]">100</span>
              <Button
                onClick={() => adjustBid(100)}
                size="lg"
                className="bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] hover:from-[#6d28d9] hover:to-[#5b21b6] text-white text-2xl h-20 w-20 shadow-lg"
              >
                <Plus className="w-8 h-8" />
              </Button>
            </div>

            <Button
              onClick={confirmBid}
              className="w-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#6d28d9] hover:to-[#5b21b6] text-white text-xl py-6"
            >
              تأكيد المزاد
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* مودال السؤال مع زر إعادة */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-3xl text-center text-[#1a2332] space-y-2 flex flex-col items-center">
              <div className="flex items-center justify-center gap-2">
                <span>السؤال - مبلغ المزاد: {bidAmount.toLocaleString()}</span>
                {/* زر إعادة السؤال فقط */}
                {currentQuestion && (
                  <Button
                    variant="ghost"
                    size="icon"
                    title="تغيير السؤال بنفس الفئة"
                    onClick={async () => {
                      if (!currentQuestion?.category?.id) return;
                      const available = allQuestions.filter(
                        q => q.category.id === currentQuestion.category.id && !usedQuestionIds.includes(q.id) && q.id !== currentQuestion.id
                      )
                      if (available.length === 0) {
                        alert("لا يوجد سؤال آخر متاح في هذه الفئة!")
                        return;
                      }
                      const random = available[Math.floor(Math.random() * available.length)]
                      await commitQuestionSelection(random, usedCategoryIds)
                    }}
                    className="ml-2"
                  >
                    <RotateCcw className="w-6 h-6 text-[#7c3aed]" />
                  </Button>
                )}
              </div>
              <div className="text-2xl font-bold text-[#7c3aed]">
                ⏱️ {timeLeft}s
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] rounded-lg p-4 mb-4">
              <p className="text-xl text-center font-bold text-white">
                {currentQuestion?.category.name}
              </p>
            </div>
            <div className="bg-gradient-to-r from-[#fcfbff] to-[#f5f3ff] rounded-lg p-8 border-2 border-[#7c3aed]/20">
              <p className="text-2xl text-center font-semibold text-[#1a2332]">
                {currentQuestion?.question}
              </p>
            </div>

            {showAnswer && (
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-8 border-2 border-green-500">
                <p className="text-2xl text-center font-bold text-green-900">
                  الإجابة: {currentQuestion?.answer}
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              {!showAnswer ? (
                <Button
                  onClick={() => setShowAnswer(true)}
                  size="lg"
                  className="bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#6d28d9] hover:to-[#5b21b6] text-white text-xl px-12 py-6"
                >
                  إظهار الإجابة
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleCorrectAnswer}
                    size="lg"
                    className="bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#6d28d9] hover:to-[#5b21b6] text-white text-xl px-12 py-6 shadow-lg"
                  >
                    <Plus className="mr-2" />
                    إجابة صحيحة (+{bidAmount.toLocaleString()})
                  </Button>
                  <Button
                    onClick={handleWrongAnswer}
                    size="lg"
                    className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white text-xl px-12 py-6 shadow-lg"
                  >
                    <Minus className="mr-2" />
                    إجابة خاطئة (-{bidAmount.toLocaleString()})
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
