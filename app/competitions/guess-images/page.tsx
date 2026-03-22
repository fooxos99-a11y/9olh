"use client"


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { getGuessStages, getGuessImagesByStage } from "@/lib/guess-stages";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SiteLoader } from "@/components/ui/site-loader";
import { GameEntryPanel, GameEntryShell, GameField } from "@/components/games/game-entry-shell";
import { GameFinishOverlay } from "@/components/games/game-finish-overlay";

export default function GuessImagesGame() {
  const [step, setStep] = useState<'stage' | 'teams' | 'game'>("stage");
  const [stages, setStages] = useState<any[]>([]);
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [team1Name, setTeam1Name] = useState("");
  const [team2Name, setTeam2Name] = useState("");
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [answeredTeam, setAnsweredTeam] = useState<number | undefined>(undefined);
  const finalRankings = [{ name: team1Name, score: team1Score }, { name: team2Name, score: team2Score }].sort((a, b) => b.score - a.score);
  const isTie = team1Score === team2Score;
  const winnerName = team1Score > team2Score ? team1Name : team2Name;

  // عند فتح نافذة الإجابة، أعد تعيين answeredTeam
  const handleShowDialog = (open: boolean) => {
    setShowDialog(open);
    if (open) setAnsweredTeam(undefined);
  }

  // جلب المراحل عند أول تحميل
  useEffect(() => {
    if (step === "stage") {
      setLoading(true);
      getGuessStages().then(async (data) => {
        setStages(data);
        setLoading(false);
        // إذا كان هناك مرحلة واحدة فقط، انتقل تلقائياً
        if (data.length === 1) {
          setSelectedStage(data[0]);
          setLoading(true);
          const imgs = await getGuessImagesByStage(data[0].id);
          setImages(imgs);
          setLoading(false);
          setStep("teams");
        }
      });
    }
  }, [step]);

  // جلب الصور عند اختيار المرحلة
  const handleStageSelect = async (stage: any) => {
    setSelectedStage(stage);
    setLoading(true);
    const imgs = await getGuessImagesByStage(stage.id);
    setImages(imgs);
    setLoading(false);
    // إذا كان هناك فريقان محفوظان من قبل، انتقل مباشرة للعبة
    if (team1Name.trim() && team2Name.trim()) {
      setStep("game");
    } else {
      setStep("teams");
    }
  };

  const handleTeamsSubmit = () => {
    if (team1Name.trim() && team2Name.trim()) {
      setStep("game");
    }
  };

  // Game step UI
  const current = images[currentIndex];
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_48%,#ffffff_100%)] flex flex-col items-center justify-center p-0">
      <div className="w-full flex flex-col items-center justify-center px-0 py-8" style={{ minHeight: '70vh' }}>
        {/* اختيار المرحلة */}
        {step === 'stage' && (
          <GameEntryShell
            title="خمن الصورة"
            badge="اختر المرحلة"
            subtitle="اختر المرحلة!"
            containerClassName="max-w-5xl"
          >
            <GameEntryPanel className="space-y-6">
              {loading ? (
                <div className="py-10">
                  <SiteLoader size="lg" />
                </div>
              ) : (
                <div className="mx-auto grid w-full max-w-2xl gap-5">
                  {stages.map((stage) => (
                    <Button
                      key={stage.id}
                      className={`h-36 w-full rounded-[1.8rem] border border-[#7c3aed]/15 bg-[linear-gradient(135deg,#ffffff_0%,#f5f3ff_100%)] px-8 text-4xl font-black text-[#1f1147] shadow-[0_18px_45px_rgba(124,58,237,0.08)] transition hover:bg-[#f8f5ff] ${selectedStage?.id === stage.id ? 'ring-4 ring-[#7c3aed]/20' : ''}`}
                      onClick={() => handleStageSelect(stage)}
                    >
                      {stage.name}
                    </Button>
                  ))}
                </div>
              )}
            </GameEntryPanel>
          </GameEntryShell>
        )}

        {/* تسجيل الفرق */}
        {step === 'teams' && (
          <GameEntryShell
            title="خمن الصورة"
            badge="أسماء الفرق"
            subtitle="بعد اختيار المرحلة، جهّز الفريقين وابدأ الجولة بشكل مرتب ومتناسق مع باقي الألعاب."
            containerClassName="max-w-3xl"
          >
            <GameEntryPanel>
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleTeamsSubmit()
                }}
              >
                <GameField label="اسم الفريق الأول">
                  <Input
                    id="team1"
                    value={team1Name}
                    onChange={(e) => setTeam1Name(e.target.value)}
                    placeholder="اكتب اسم الفريق الأول"
                    className="h-14 rounded-2xl border border-[#d9d2f6] bg-[#fcfbff] px-4 text-right text-[#1f1147] placeholder:text-[#8a83a8] focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10"
                    required
                  />
                </GameField>
                <GameField label="اسم الفريق الثاني">
                  <Input
                    id="team2"
                    value={team2Name}
                    onChange={(e) => setTeam2Name(e.target.value)}
                    placeholder="اكتب اسم الفريق الثاني"
                    className="h-14 rounded-2xl border border-[#d9d2f6] bg-[#fcfbff] px-4 text-right text-[#1f1147] placeholder:text-[#8a83a8] focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10"
                    required
                  />
                </GameField>
                <Button
                  type="submit"
                  disabled={!team1Name.trim() || !team2Name.trim()}
                  className="h-14 w-full rounded-2xl bg-[#7c3aed] text-lg font-black text-white hover:bg-[#6d28d9]"
                >
                  ابدأ اللعبة
                  <ArrowLeft className="mr-2 inline h-5 w-5" />
                </Button>
              </form>
            </GameEntryPanel>
          </GameEntryShell>
        )}

        {/* السبورة واللعبة */}
        {step === 'game' && (
          <>
            <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="relative overflow-hidden rounded-[2.25rem] border border-[#7c3aed]/12 bg-white/80 p-4 shadow-[0_28px_90px_rgba(124,58,237,0.10)] backdrop-blur-sm sm:p-6">
                <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-[#ddd6fe]/55 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-44 w-44 rounded-full bg-[#c4b5fd]/35 blur-3xl" />

                <div className="relative mb-5 grid gap-4 md:grid-cols-2 lg:mb-6">
                  <div className="rounded-[1.6rem] border border-[#7c3aed]/15 bg-[linear-gradient(180deg,#ffffff_0%,#f8f5ff_100%)] p-3 shadow-[0_18px_40px_rgba(124,58,237,0.08)]">
                    <div className="flex items-center gap-3">
                      <div className="flex min-h-[88px] min-w-[190px] flex-1 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_100%)] px-5 py-3 text-center text-2xl font-black text-white">
                        {team2Name}
                      </div>
                      <div className="flex min-h-[88px] min-w-[160px] items-center justify-between rounded-[1.2rem] border border-[#d9d2f6] bg-white px-3 py-2 text-[#1f1147] shadow-sm">
                        <Button size="icon" variant="ghost" className="h-11 w-11 rounded-xl text-[#7c3aed] hover:bg-[#f5f3ff]" onClick={() => setTeam2Score(s => s + 1)} title="إضافة">
                          <span className="text-[1.7rem] leading-none">+</span>
                        </Button>
                        <span className="min-w-[48px] text-center text-3xl font-black">{team2Score}</span>
                        <Button size="icon" variant="ghost" className="h-11 w-11 rounded-xl text-[#7c3aed] hover:bg-[#f5f3ff] disabled:text-[#d3c9f5]" onClick={() => setTeam2Score(s => s - 1)} disabled={team2Score <= 0} title="إنقاص">
                          <span className="text-[1.7rem] leading-none">-</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] border border-[#7c3aed]/15 bg-[linear-gradient(180deg,#ffffff_0%,#f8f5ff_100%)] p-3 shadow-[0_18px_40px_rgba(124,58,237,0.08)]">
                    <div className="flex items-center gap-3">
                      <div className="flex min-h-[88px] min-w-[160px] items-center justify-between rounded-[1.2rem] border border-[#d9d2f6] bg-white px-3 py-2 text-[#1f1147] shadow-sm">
                        <Button size="icon" variant="ghost" className="h-11 w-11 rounded-xl text-[#7c3aed] hover:bg-[#f5f3ff]" onClick={() => setTeam1Score(s => s + 1)} title="إضافة">
                          <span className="text-[1.7rem] leading-none">+</span>
                        </Button>
                        <span className="min-w-[48px] text-center text-3xl font-black">{team1Score}</span>
                        <Button size="icon" variant="ghost" className="h-11 w-11 rounded-xl text-[#7c3aed] hover:bg-[#f5f3ff] disabled:text-[#d3c9f5]" onClick={() => setTeam1Score(s => s - 1)} disabled={team1Score <= 0} title="إنقاص">
                          <span className="text-[1.7rem] leading-none">-</span>
                        </Button>
                      </div>
                      <div className="flex min-h-[88px] min-w-[190px] flex-1 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_100%)] px-5 py-3 text-center text-2xl font-black text-white">
                        {team1Name}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[2rem] border border-[#7c3aed]/15 bg-[linear-gradient(180deg,#ffffff_0%,#f8f5ff_100%)] p-3 shadow-[inset_0_0_0_1px_rgba(124,58,237,0.04)] sm:p-4">
                  <div className="flex min-h-[440px] items-center justify-center rounded-[1.6rem] border border-dashed border-[#cdbef7] bg-[radial-gradient(circle_at_top,#faf7ff_0%,#f5f3ff_45%,#ffffff_100%)] p-4 shadow-[0_24px_60px_rgba(124,58,237,0.08)] sm:min-h-[560px]">
                    {current?.image_url ? (
                      <img src={current.image_url} alt="صورة التخمين" className="max-h-[540px] w-full rounded-[1.3rem] object-contain" style={{maxWidth: '100%'}} />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center text-[#6f6788]">
                        <div className="mb-3 rounded-full bg-[#f1ebff] px-4 py-2 text-sm font-black text-[#7c3aed]">خمن الصورة</div>
                        <p className="text-lg font-bold">لا توجد صورة متاحة في هذه الجولة</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative mt-5 flex justify-center sm:mt-6">
                  <Button
                    className="rounded-[1.4rem] bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_100%)] px-14 py-6 text-2xl font-black text-white shadow-[0_20px_45px_rgba(124,58,237,0.28)] hover:bg-[linear-gradient(135deg,#6d28d9_0%,#5b21b6_100%)]"
                    onClick={() => handleShowDialog(true)}
                  >
                    الإجابة
                  </Button>
                </div>

                <Dialog open={showDialog} onOpenChange={handleShowDialog}>
                  <DialogContent showCloseButton={false} className="max-w-xl rounded-[2rem] border border-[#d9d2f6] bg-[linear-gradient(180deg,#ffffff_0%,#fcfbff_100%)] p-0 shadow-[0_30px_80px_rgba(124,58,237,0.18)]" style={{ direction: 'rtl', textAlign: 'right' }}>
                    <div className="p-6 sm:p-8">
                    <DialogHeader>
                      <DialogTitle className="text-center text-3xl font-black text-[#1f1147]">الإجابة</DialogTitle>
                      <div className="mb-2 w-full text-center text-lg font-semibold text-[#5b5570]" style={{direction: 'rtl'}}>
                        اكتشف معنى الصورة قبل الفريق الآخر
                      </div>
                    </DialogHeader>
                    <div className="my-5 rounded-[1.5rem] bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_100%)] px-6 py-5 text-center text-2xl font-black text-white shadow-[0_18px_40px_rgba(124,58,237,0.24)]">{current?.answer}</div>
                    <div className="mt-2 flex flex-col gap-3">
                      <div className="text-center text-lg font-semibold text-[#1f1147]">من الفريق الذي أجاب؟</div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button onClick={() => {
                          setTeam1Score(s => s + 1);
                          setShowDialog(false);
                          setAnsweredTeam(undefined);
                          setTimeout(() => {
                            setCurrentIndex(i => i + 1);
                          }, 100);
                        }} className="rounded-[1.2rem] bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_100%)] px-8 py-3 text-lg font-bold text-white shadow-[0_16px_35px_rgba(124,58,237,0.20)]">{team1Name}</Button>
                        <Button onClick={() => {
                          setTeam2Score(s => s + 1);
                          setShowDialog(false);
                          setAnsweredTeam(undefined);
                          setTimeout(() => {
                            setCurrentIndex(i => i + 1);
                          }, 100);
                        }} className="rounded-[1.2rem] bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_100%)] px-8 py-3 text-lg font-bold text-white shadow-[0_16px_35px_rgba(124,58,237,0.20)]">{team2Name}</Button>
                        <Button onClick={() => {
                          setShowDialog(false);
                          setAnsweredTeam(undefined);
                          setTimeout(() => {
                            setCurrentIndex(i => i + 1);
                          }, 100);
                        }} className="rounded-[1.2rem] bg-[linear-gradient(135deg,#ef4444_0%,#dc2626_100%)] px-8 py-3 text-lg font-bold text-white shadow-[0_16px_35px_rgba(239,68,68,0.18)]">محد جاوب</Button>
                      </div>
                      {typeof answeredTeam !== 'undefined' && (
                        <div className="flex justify-center mt-4">
                          <Button onClick={() => {
                            setShowDialog(false);
                            setAnsweredTeam(undefined);
                            setTimeout(() => {
                              setCurrentIndex(i => i + 1);
                            }, 100);
                          }} className="rounded-[1.2rem] bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_100%)] px-8 py-3 text-xl font-bold text-white shadow-[0_16px_35px_rgba(124,58,237,0.20)]">التالي</Button>
                        </div>
                      )}
                    </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* نافذة الفوز - تصميم المزاد */}
            {currentIndex >= images.length && (
              <GameFinishOverlay
                title={isTie ? "تعادل بين الفريقين!" : `مبروك الفوز للفريق: ${winnerName}`}
                subtitle={`${(isTie ? team1Score : Math.max(team1Score, team2Score)).toLocaleString()} نقطة`}
                details={
                  <div className="mx-auto mt-4 w-full max-w-md space-y-4">
                    {finalRankings.map((team, idx) => (
                      <div key={`${team.name}-${idx}`} className="mb-2 flex items-center justify-between rounded-xl bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] p-4">
                        <span className="text-xl font-bold text-[#1a2332]">{idx + 1}. {team.name}</span>
                        <span className="text-2xl font-black text-[#7c3aed]">{team.score.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                }
                actions={[
                  {
                    label: "لعب مرة أخرى",
                    onClick: () => window.location.reload(),
                  },
                  {
                    label: "خروج",
                    onClick: () => {
                      window.location.href = "/";
                    },
                    tone: "danger",
                  },
                ]}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
