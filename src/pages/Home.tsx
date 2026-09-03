import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore, initialUser } from "../stores/user/useUserStore";
import { userApi } from "../services/userApi";
import { getPassages } from "../services/readingApi";
import { getListeningPassages } from "../services/listeningApi";
import { writingApi } from "../services/writingApi";
import { speakingApi } from "../services/speakingApi";
import { getOfficialCollections } from "../services/vocabularyApi";
import { useToast } from "../components/common/Toast";
import { LogoutModal } from "../components/common/LogoutModal";
import { AppLayout } from "../components/common/AppLayout";

// Import lucide-react icons
import {
  BookOpen,
  Flame,
  Award,
  Mic,
  Headphones,
  Edit3,
  FileText,
  Play,
  Plus,
  ArrowRight
} from "lucide-react";

export interface SuggestionCardItem {
  id: string
  title: string
  description: string
  tag: string
  tagColorClass: string
  badgeBgClass: string
  imageUrl: string
  targetUrl: string
  iconType: "read" | "listen" | "speak" | "write" | "vocab"
}

const Home = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestionCardItem[]>([])

  const { user, setUser } = useUserStore()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const handleLogout = () => {
    localStorage.removeItem("token")
    setUser(initialUser)
    showToast("Đã đăng xuất tài khoản!", "info")
    navigate("/login")
  }

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token")
      if (!token && !user?.token && !user?.username) {
        navigate("/login")
        return
      }
      try {
        const data = await userApi.getUserProfile()
        if (data && data.username) {
          setUser(data)
        }
      } catch (err) {
        console.warn("Could not fetch user profile:", err)
      }
    }
    fetchUserData()
  }, [navigate, setUser, user?.token, user?.username])

  // Fetch 10 latest & most popular practice items across modules for Suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const [readRes, listenRes, speakRes, writeRes, vocabRes] = await Promise.allSettled([
          getPassages({ page: 1, limit: 3 }),
          getListeningPassages({ page: 1, limit: 3 }),
          speakingApi.getTopics(1, 3),
          writingApi.getPrompts(),
          getOfficialCollections(),
        ])

        const fetched: SuggestionCardItem[] = []

        if (readRes.status === "fulfilled" && readRes.value?.items?.length) {
          readRes.value.items.forEach((p) => {
            fetched.push({
              id: `r-${p.id}`,
              title: p.title,
              description: `${p.topic || "Đọc hiểu hàn lâm"} • ${p.total_questions || 13} câu hỏi • ${p.time_limit_minutes || 20} phút`,
              tag: "BÀI ĐỌC READING",
              tagColorClass: "text-amber-700",
              badgeBgClass: "bg-amber-50",
              imageUrl: p.image_url || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=300",
              targetUrl: `/reading/practice?id=${p.id}`,
              iconType: "read"
            })
          })
        }

        if (listenRes.status === "fulfilled" && listenRes.value?.items?.length) {
          listenRes.value.items.forEach((p) => {
            fetched.push({
              id: `l-${p.id}`,
              title: p.title,
              description: `${p.unit_code || "LISTENING"} • ${p.total_questions || 10} câu hỏi • ${p.time_limit_minutes || 15} phút`,
              tag: "BÀI NGHE LISTENING",
              tagColorClass: "text-blue-700",
              badgeBgClass: "bg-blue-50",
              imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300",
              targetUrl: `/listening/practice?id=${p.id}`,
              iconType: "listen"
            })
          })
        }

        if (speakRes.status === "fulfilled" && speakRes.value?.length) {
          speakRes.value.forEach((t) => {
            fetched.push({
              id: `s-${t.id}`,
              title: t.title || "Chủ đề luyện nói Speaking",
              description: `Part 1, 2 & 3 • ${t.prompt_count || 3} câu hỏi gợi ý`,
              tag: "CHỦ ĐỀ SPEAKING",
              tagColorClass: "text-indigo-700",
              badgeBgClass: "bg-indigo-50",
              imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=300",
              targetUrl: `/speaking/practice/topic/${t.id}`,
              iconType: "speak"
            })
          })
        }

        if (writeRes.status === "fulfilled" && writeRes.value?.length) {
          writeRes.value.slice(0, 3).forEach((w) => {
            fetched.push({
              id: `w-${w.id}`,
              title: w.title,
              description: `${w.task_description || "Đề bài luyện viết Essay"} • Mục tiêu ${w.word_count_target || 250}+ từ`,
              tag: w.task_type === "WITH_GRAPH" ? "WRITING TASK 1" : "WRITING TASK 2",
              tagColorClass: "text-emerald-700",
              badgeBgClass: "bg-emerald-50",
              imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=300",
              targetUrl: `/writing/editor/${w.id}`,
              iconType: "write"
            })
          })
        }

        if (vocabRes.status === "fulfilled" && vocabRes.value?.length) {
          vocabRes.value.slice(0, 3).forEach((v) => {
            fetched.push({
              id: `v-${v.id}`,
              title: v.title,
              description: `${v.description || "Bộ từ vựng chủ đề"} • ${v.total_words || (v as any).word_count || (v.words_list?.length ?? 0)} từ`,
              tag: "TỪ VỰNG",
              tagColorClass: "text-purple-700",
              badgeBgClass: "bg-purple-50",
              imageUrl: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=300",
              targetUrl: `/vocabulary/${v.id}`,
              iconType: "vocab"
            })
          })
        }

        if (fetched.length > 0) {
          const uniqueMap = new Map<string, SuggestionCardItem>()
          fetched.forEach((item) => {
            if (!uniqueMap.has(item.title)) {
              uniqueMap.set(item.title, item)
            }
          })
          const final10 = Array.from(uniqueMap.values()).slice(0, 10)
          setSuggestions(final10)
        }
      } catch (err) {
        console.warn("Error loading dynamic suggestions:", err)
      }
    }

    fetchSuggestions()
  }, [])

  const [activityLogs, setActivityLogs] = useState<Record<string, number>>({})

  useEffect(() => {
    const loadLogs = async () => {
      const logs = await userApi.getActivityLogs()
      const map: Record<string, number> = {}
      logs.forEach((item) => {
        map[item.date_str] = item.activities_count || 1
      })
      setActivityLogs(map)
    }
    loadLogs()
  }, [])

  const rawReading = user?.stats?.avg_reading_score ?? 0
  const rawListening = user?.stats?.avg_listening_score ?? 0
  const rawSpeaking = user?.stats?.avg_speaking_score ?? 0
  const rawWriting = user?.stats?.avg_writing_score ?? 0

  const username = user?.username || ""
  const streakDays = user?.stats?.current_streak_days ?? (user as any)?.streak_days ?? (user as any)?.current_streak ?? 0
  const rawLevel = user?.proficiency_level || user?.stats?.general_english_level || ""
  const proficiencyLevel = rawLevel ? rawLevel : ((user as any)?.target_band_score ? `Band ${(user as any).target_band_score}` : "A1")

  // Generate 2 months of activity heatmap data for Recent Activity (Last month & Current month)
  const currentDate = new Date()
  const todayDayNum = currentDate.getDate()
  const todayUtcStr = currentDate.toISOString().slice(0, 10)

  const recentMonthsData = Array.from({ length: 2 }).map((_, i) => {
    // i=0: last month (monthOffset = -1), i=1: current month (monthOffset = 0)
    const monthOffset = i - 1
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1)
    const monthNum = d.getMonth() + 1
    const yearNum = d.getFullYear()
    const daysCount = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()

    const days = Array.from({ length: daysCount }).map((_, dayIdx) => {
      const dayNum = dayIdx + 1
      const isCurrentMonth = monthOffset === 0
      const fullDateStr = `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`

      let intensity: number = 0
      const activityCount = activityLogs[fullDateStr]

      if (activityCount) {
        intensity = activityCount >= 3 ? 3 : activityCount >= 2 ? 2 : 1
      } else if (fullDateStr === todayUtcStr) {
        intensity = 3
      } else if (isCurrentMonth && streakDays > 0 && dayNum > todayDayNum - streakDays && dayNum <= todayDayNum) {
        const depth = todayDayNum - dayNum
        intensity = depth === 0 ? 3 : depth < 3 ? 2 : 1
      }

      return { dayNum, intensity, dateStr: `Ngày ${dayNum}/${monthNum}` }
    })

    return {
      label: `Tháng ${monthNum}`,
      days
    }
  })

  const readingScore = rawReading > 0 ? rawReading.toFixed(1) : "0.0"
  const listeningScore = rawListening > 0 ? rawListening.toFixed(1) : "0.0"
  const speakingScore = rawSpeaking > 0 ? rawSpeaking.toFixed(1) : "0.0"
  const writingScore = rawWriting > 0 ? rawWriting.toFixed(1) : "0.0"

  const readingProgressPercent = user?.stats?.reading_progress_pct ? Math.round(user.stats.reading_progress_pct) : 0
  const speakingProgressPercent = user?.stats?.speaking_progress_pct ? Math.round(user.stats.speaking_progress_pct) : 0
  const listeningProgressPercent = user?.stats?.listening_progress_pct ? Math.round(user.stats.listening_progress_pct) : 0
  const writingProgressPercent = user?.stats?.writing_progress_pct ? Math.round(user.stats.writing_progress_pct) : 0

  const scoresList = [rawReading, rawListening, rawSpeaking, rawWriting].filter(s => s > 0)
  const avgBandScoreNum = (user?.stats?.overall_score && user.stats.overall_score > 0)
    ? user.stats.overall_score
    : (scoresList.length > 0 ? scoresList.reduce((a, b) => a + b, 0) / scoresList.length : 0)
  const avgBandScore = avgBandScoreNum.toFixed(1)
  const avgImprovement = avgBandScoreNum > 0 ? `+${(avgBandScoreNum * 0.1).toFixed(1)}` : "0.0"

  const totalWords = user?.stats?.total_words_learned ?? 0
  const overallPracticePct = Math.round((readingProgressPercent + speakingProgressPercent + listeningProgressPercent + writingProgressPercent) / 4)

  return (
    <AppLayout breadcrumbs={[{ label: 'Trang chủ', href: '/' }]}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-7 max-w-7xl mx-auto overflow-x-hidden">
        {/* Header Row: Welcome + Gamification Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Chào mừng trở lại, {username}!</span>
              <span className="text-xl">👋</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Theo dõi tiến độ học tập và rèn luyện kỹ năng mỗi ngày.</p>
          </div>

          {/* Streak & Rank Badges */}
          <div className="flex items-center gap-3.5 flex-wrap sm:flex-nowrap">
            {/* Streak Badge */}
            <div
              onClick={() => navigate('/profile')}
              className="bg-white border border-slate-300/90 rounded-2xl p-3.5 px-5 min-w-[150px] shadow-glow-4side hover:shadow-glow-4side-lg hover:border-amber-400 transition-all duration-300 flex items-center gap-3.5 group cursor-pointer"
              title="Nhấp để xem chi tiết trong Trang cá nhân"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-100/80 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Flame className="w-5.5 h-5.5 fill-amber-500 text-amber-600" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                  CHUỖI NGÀY HỌC
                </span>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                  {streakDays} Ngày
                </span>
              </div>
            </div>

            {/* Rank Badge */}
            <div
              onClick={() => navigate('/profile')}
              className="bg-white border border-slate-300/90 rounded-2xl p-3.5 px-5 min-w-[160px] shadow-glow-4side hover:shadow-glow-4side-lg hover:border-emerald-400 transition-all duration-300 flex items-center gap-3.5 group cursor-pointer"
              title="Nhấp để xem chi tiết trong Trang cá nhân"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-100/80 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Award className="w-5.5 h-5.5 text-emerald-600" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                  TRÌNH ĐỘ CEFR
                </span>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                  Cấp độ {proficiencyLevel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Continue Practice & Performance Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Continue Practice (col-span-6) */}
          <div className="lg:col-span-6 flex flex-col space-y-3">
            <div className="flex items-center justify-between h-7">
              <h2 className="text-base font-bold text-slate-900">
                Tiếp tục luyện tập
              </h2>
              <Link
                to="/practice-modules"
                className="text-xs font-bold text-[#1e50e6] hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3.5 flex-1">
              {/* Reading Test Card */}
              <div
                onClick={() => navigate('/practice-modules/reading')}
                className="bg-white border border-slate-300/90 rounded-2xl p-4 shadow-glow-4side hover:shadow-glow-4side-lg hover:border-amber-400 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform duration-300">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all duration-300" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-amber-700 transition-colors">
                    Luyện đọc (Reading)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Bài đọc hàn lâm chuyên sâu
                  </p>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1.5">
                    <div
                      className="bg-amber-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${readingProgressPercent}%` }}
                    />
                  </div>
                  <div className="text-right text-[11px] font-extrabold text-slate-800">
                    {readingProgressPercent}%
                  </div>
                </div>
              </div>

              {/* Speaking Test Card */}
              <div
                onClick={() => navigate('/practice-modules/speaking')}
                className="bg-white border border-slate-300/90 rounded-2xl p-4 shadow-glow-4side hover:shadow-glow-4side-lg hover:border-indigo-400 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100/80 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                      <Mic className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all duration-300" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    Luyện nói (Speaking)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Phát âm & Shadowing
                  </p>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1.5">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${speakingProgressPercent}%` }}
                    />
                  </div>
                  <div className="text-right text-[11px] font-extrabold text-slate-800">
                    {speakingProgressPercent}%
                  </div>
                </div>
              </div>

              {/* Listening Test Card */}
              <div
                onClick={() => navigate('/practice-modules/listening')}
                className="bg-white border border-slate-300/90 rounded-2xl p-4 shadow-glow-4side hover:shadow-glow-4side-lg hover:border-blue-400 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100/80 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all duration-300" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    Luyện nghe (Listening)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Bài nghe & Dictation
                  </p>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1.5">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${listeningProgressPercent}%` }}
                    />
                  </div>
                  <div className="text-right text-[11px] font-extrabold text-slate-800">
                    {listeningProgressPercent}%
                  </div>
                </div>
              </div>

              {/* Writing Test Card */}
              <div
                onClick={() => navigate('/practice-modules/writing')}
                className="bg-white border border-slate-300/90 rounded-2xl p-4 shadow-glow-4side hover:shadow-glow-4side-lg hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100/80 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all duration-300" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                    Luyện viết (Writing)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Luyện viết bài Essay & Task 1
                  </p>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1.5">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${writingProgressPercent}%` }}
                    />
                  </div>
                  <div className="text-right text-[11px] font-extrabold text-slate-800">
                    {writingProgressPercent}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Recent Activity Heatmap (col-span-6) */}
          <div className="lg:col-span-6 flex flex-col space-y-3">
            <div className="flex items-center justify-between h-7">
              <h2 className="text-base font-bold text-slate-900">
                Hoạt động gần đây
              </h2>
            </div>

            {/* Card Container aligned to match left grid height */}
            <div className="bg-white border border-slate-300/90 rounded-2xl p-5 shadow-glow-4side hover:shadow-glow-4side-lg transition-shadow duration-300 flex-1 flex flex-col justify-between">
              {/* Card Sub-Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Tần Suất Rèn Luyện</span>
              </div>

              {/* Heatmap Container - 2 months (Last month & Current month) side-by-side */}
              <div className="my-auto py-2">
                <div className="flex items-start justify-around gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none">
                  {recentMonthsData.map((m, mIdx) => (
                    <div key={mIdx} className="flex flex-col gap-2.5 shrink-0">
                      {/* 3 rows grid flowing horizontally into columns */}
                      <div className="grid grid-rows-3 grid-flow-col gap-1.5 sm:gap-2">
                        {m.days.map((day) => {
                          let colorClass = "bg-slate-100 border border-slate-200/40"
                          if (day.intensity === 1) colorClass = "bg-blue-200 border border-blue-300/40"
                          if (day.intensity === 2) colorClass = "bg-blue-400 border border-blue-500/40"
                          if (day.intensity === 3) colorClass = "bg-[#1e50e6] border border-blue-700/40"

                          return (
                            <div
                              key={day.dayNum}
                              title={day.dateStr}
                              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] transition-all hover:scale-125 cursor-pointer ${colorClass}`}
                            />
                          )
                        })}
                      </div>

                      {/* Month Label below month grid */}
                      <span className="text-xs font-bold text-slate-700 pl-0.5">
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Heatmap Legend */}
                <div className="flex items-center justify-end gap-1.5 text-[10px] font-semibold text-slate-400 mt-2">
                  <span>Ít</span>
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-100 border border-slate-200/40" />
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-blue-200 border border-blue-300/40" />
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-blue-400 border border-blue-500/40" />
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1e50e6] border border-blue-700/40" />
                  <span>Nhiều</span>
                </div>
              </div>

              {/* Bottom Metrics Bar: 3 Columns */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 mt-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    BAND TRUNG BÌNH
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl sm:text-2xl font-black text-slate-900">
                      {avgBandScore}
                    </span>
                    <span className={`text-[10px] font-extrabold ${avgBandScoreNum > 0 ? "text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded" : "text-slate-400"}`}>
                      {avgImprovement}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    HOÀN THÀNH KHO BÀI
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl sm:text-2xl font-black text-slate-900">
                      {overallPracticePct}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      tiến độ
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    TỪ VỰNG TÍCH LŨY
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl sm:text-2xl font-black text-slate-900">
                      {totalWords.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      từ thuộc
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: 4 Skills Overview Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Tổng quan điểm kỹ năng (Band Scores)</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* READING */}
            <div
              onClick={() => navigate('/practice-modules/reading')}
              className="bg-white border border-slate-300/90 rounded-2xl p-4 shadow-glow-4side hover:shadow-glow-4side-lg hover:border-amber-400 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
              title="Nhấp để đến module Reading"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${rawReading > 0 ? "text-emerald-600 bg-emerald-50" : "text-slate-400 bg-slate-100"}`}>
                  {rawReading > 0 ? "+0.2" : "0.0"}
                </span>
              </div>
              <div className="mt-3">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                  READING
                </span>
                <span className="text-2xl font-extrabold text-slate-900 block my-0.5 group-hover:text-amber-700 transition-colors">
                  {readingScore}
                </span>
                <span className="text-[11px] font-medium text-slate-400 block">
                  {rawReading > 0 ? "Đã hoàn thành các bài luyện" : "Chưa làm bài kiểm tra"}
                </span>
              </div>
            </div>

            {/* LISTENING */}
            <div
              onClick={() => navigate('/practice-modules/listening')}
              className="bg-white border border-slate-300/90 rounded-2xl p-4 shadow-glow-4side hover:shadow-glow-4side-lg hover:border-blue-400 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
              title="Nhấp để đến module Listening"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-blue-100/80 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
                  <Headphones className="w-4.5 h-4.5" />
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${rawListening > 0 ? "text-emerald-600 bg-emerald-50" : "text-slate-400 bg-slate-100"}`}>
                  {rawListening > 0 ? "+0.5" : "0.0"}
                </span>
              </div>
              <div className="mt-3">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                  LISTENING
                </span>
                <span className="text-2xl font-extrabold text-slate-900 block my-0.5 group-hover:text-blue-600 transition-colors">
                  {listeningScore}
                </span>
                <span className="text-[11px] font-medium text-slate-400 block">
                  {rawListening > 0 ? "Đã hoàn thành các bài luyện" : "Chưa làm bài kiểm tra"}
                </span>
              </div>
            </div>

            {/* SPEAKING */}
            <div
              onClick={() => navigate('/practice-modules/speaking')}
              className="bg-white border border-slate-300/90 rounded-2xl p-4 shadow-glow-4side hover:shadow-glow-4side-lg hover:border-indigo-400 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
              title="Nhấp để đến module Speaking"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-indigo-100/80 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                  <Mic className="w-4.5 h-4.5" />
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${rawSpeaking > 0 ? "text-emerald-600 bg-emerald-50" : "text-slate-400 bg-slate-100"}`}>
                  {rawSpeaking > 0 ? "+0.1" : "0.0"}
                </span>
              </div>
              <div className="mt-3">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                  SPEAKING
                </span>
                <span className="text-2xl font-extrabold text-slate-900 block my-0.5 group-hover:text-indigo-600 transition-colors">
                  {speakingScore}
                </span>
                <span className="text-[11px] font-medium text-slate-400 block">
                  {rawSpeaking > 0 ? "Đang tiến bộ phản xạ & phát âm" : "Chưa làm bài kiểm tra"}
                </span>
              </div>
            </div>

            {/* WRITING */}
            <div
              onClick={() => navigate('/practice-modules/writing')}
              className="bg-white border border-slate-300/90 rounded-2xl p-4 shadow-glow-4side hover:shadow-glow-4side-lg hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
              title="Nhấp để đến module Writing"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-emerald-100/80 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${rawWriting > 0 ? "text-emerald-600 bg-emerald-50" : "text-slate-400 bg-slate-100"}`}>
                  {rawWriting > 0 ? "+0.1" : "0.0"}
                </span>
              </div>
              <div className="mt-3">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                  WRITING
                </span>
                <span className="text-2xl font-extrabold text-slate-900 block my-0.5 group-hover:text-emerald-600 transition-colors">
                  {writingScore}
                </span>
                <span className="text-[11px] font-medium text-slate-400 block">
                  {rawWriting > 0 ? "Cần tập trung từ vựng & ngữ pháp" : "Chưa làm bài kiểm tra"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Suggestions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Gợi ý học tập hôm nay (10 bài mới & nổi bật)</span>
            </h2>
            <Link
              to="/practice-modules"
              className="text-xs font-bold text-[#1e50e6] hover:underline flex items-center gap-1"
            >
              <span>Xem lộ trình học</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Suggestion Cards List - 10 Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {suggestions.map((item) => {
              const renderIcon = () => {
                switch (item.iconType) {
                  case "read": return <BookOpen className="w-4 h-4 text-amber-600" />
                  case "listen": return <Headphones className="w-4 h-4 text-blue-600" />
                  case "speak": return <Mic className="w-4 h-4 text-indigo-600" />
                  case "write": return <FileText className="w-4 h-4 text-emerald-600" />
                  case "vocab": return <BookOpen className="w-4 h-4 text-purple-600" />
                  default: return <Play className="w-4 h-4 text-blue-600 ml-0.5" />
                }
              }

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(item.targetUrl)}
                  className="bg-white border border-slate-300/90 rounded-2xl p-4 shadow-glow-4side hover:shadow-glow-4side-lg hover:border-blue-400 transition-all duration-300 flex items-center justify-between gap-4 group cursor-pointer"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Thumbnail Image */}
                    <div className="relative overflow-hidden rounded-xl shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-20 h-16 object-cover border border-slate-100 group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${item.tagColorClass} ${item.badgeBgClass} px-2 py-0.5 rounded-md inline-block`}>
                        {item.tag}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400 truncate leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(item.targetUrl)
                    }}
                    className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-[#1e50e6] group-hover:text-white flex items-center justify-center shadow-2xs shrink-0 transition-colors duration-200 active:scale-95 cursor-pointer"
                  >
                    {renderIcon()}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Floating Action Button (FAB) */}
        <button
          onClick={() => navigate('/practice-modules')}
          aria-label="Add New Task"
          title="Đến trang kho bài tập"
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#1e50e6] hover:bg-blue-700 text-white flex items-center justify-center shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Logout Confirmation Modal */}
        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
        />
      </div>
    </AppLayout>
  )
}

export default Home
