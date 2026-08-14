import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore, initialUser } from "../stores/user/useUserStore";
import { userApi } from "../services/userApi";
import { useToast } from "../components/common/Toast";
import { LogoutModal } from "../components/common/LogoutModal";
import { AppLayout } from "../components/common/AppLayout";

// 6. Import từ lucide-react - TẤT CẢ trong 1 import
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


const Home = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false)

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
      if (!token) {
        navigate("/login")
        return
      }
      const data = await userApi.getUserProfile()
      if (data && data.username) {
        setUser(data)
      } else {
        localStorage.removeItem("token")
        setUser(initialUser)
        navigate("/login")
      }
    }
    fetchUserData()
  }, [navigate, setUser])

  const username = user?.username || "User"
  const streakDays = user?.stats?.current_streak_days ?? 0
  const proficiencyLevel = user?.proficiency_level || user?.stats?.general_english_level || "B1"

  // Generate 3 months of activity heatmap data for Recent Activity
  const currentDate = new Date()
  const todayDayNum = currentDate.getDate()

  const recentMonthsData = Array.from({ length: 3 }).map((_, i) => {
    // i = 0 -> current month, i = 1 -> next month, i = 2 -> 2 months later
    const monthOffset = i
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1)
    const monthNum = d.getMonth() + 1
    const daysCount = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()

    const days = Array.from({ length: daysCount }).map((_, dayIdx) => {
      const dayNum = dayIdx + 1
      const isCurrentMonth = monthOffset === 0
      const isPastOrToday = !isCurrentMonth || dayNum <= todayDayNum

      let intensity: 0 | 1 | 2 | 3 = 0
      if (isPastOrToday) {
        const seed = (d.getMonth() * 31 + dayNum * 7) % 10
        if (isCurrentMonth && dayNum > todayDayNum - streakDays && dayNum <= todayDayNum) {
          intensity = 3
        } else if (seed > 6) {
          intensity = 3
        } else if (seed > 3) {
          intensity = 2
        } else if (seed > 1) {
          intensity = 1
        } else {
          intensity = 0
        }
      }

      return { dayNum, intensity, dateStr: `Ngày ${dayNum}/${monthNum}` }
    })

    return {
      label: `Tháng ${monthNum}`,
      days
    }
  })

  const rawReading = user?.stats?.avg_reading_score ?? 0
  const rawListening = user?.stats?.avg_listening_score ?? 0
  const rawSpeaking = user?.stats?.avg_speaking_score ?? 0
  const rawWriting = user?.stats?.avg_writing_score ?? 0

  const readingScore = rawReading.toFixed(1)
  const listeningScore = rawListening.toFixed(1)
  const speakingScore = rawSpeaking.toFixed(1)
  const writingScore = rawWriting.toFixed(1)

  const readingProgressPercent = rawReading > 0 ? Math.min(100, Math.round((rawReading / 9.0) * 100)) : 0
  const speakingProgressPercent = rawSpeaking > 0 ? Math.min(100, Math.round((rawSpeaking / 9.0) * 100)) : 0
  const listeningProgressPercent = rawListening > 0 ? Math.min(100, Math.round((rawListening / 9.0) * 100)) : 0
  const writingProgressPercent = rawWriting > 0 ? Math.min(100, Math.round((rawWriting / 9.0) * 100)) : 0

  const avgBandScoreNum = (rawReading + rawListening + rawSpeaking + rawWriting) / 4
  const avgBandScore = avgBandScoreNum.toFixed(1)
  const mockTestsTaken = user?.stats?.total_words_learned ? Math.round(user.stats.total_words_learned / 10) : 0
  const avgImprovement = avgBandScoreNum > 0 ? "+0.4" : "0.0"

  return (
    <AppLayout breadcrumbs={[{ label: 'HOME' }]}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-7 max-w-7xl mx-auto overflow-x-hidden">
          {/* Header Row: Welcome + Gamification Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Welcome back, {username}!</span>
                <span className="text-xl">👋</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Theo dõi tiến độ học tập và rèn luyện kỹ năng mỗi ngày.</p>
            </div>

            {/* Streak & Rank Badges */}
            <div className="flex items-center gap-3">
              {/* Streak Badge */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 px-4 shadow-xs flex items-center gap-3 hover:border-amber-300 hover:shadow-md transition-all duration-300 group cursor-default">
                <div className="w-10 h-10 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Flame className="w-5 h-5 fill-amber-500 text-amber-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                    STREAK
                  </span>
                  <span className="text-base font-extrabold text-slate-800 leading-tight">
                    {streakDays} Days
                  </span>
                </div>
              </div>

              {/* Rank Badge */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 px-4 shadow-xs flex items-center gap-3 hover:border-emerald-300 hover:shadow-md transition-all duration-300 group cursor-default">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/80 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                    RANK
                  </span>
                  <span className="text-base font-extrabold text-slate-800 leading-tight">
                    Level {proficiencyLevel}
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
                  Continue Practice
                </h2>
                <Link
                  to="/practice-modules"
                  className="text-xs font-bold text-[#1e50e6] hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* 2x2 Grid */}
              <div className="grid grid-cols-2 gap-3.5 flex-1">
                {/* Reading Test Card */}
                <div
                  onClick={() => navigate('/practice-modules/reading')}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-lg hover:border-amber-300/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform duration-300">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all duration-300" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-amber-700 transition-colors">
                      Reading Test
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Complex academic texts
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
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-lg hover:border-indigo-300/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100/80 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                        <Mic className="w-4 h-4" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all duration-300" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      Speaking Test
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Pronunciation Drill #01
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
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-lg hover:border-blue-300/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100/80 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
                        <Headphones className="w-4 h-4" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all duration-300" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      Listening Test
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Academic Lecture #04
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
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-lg hover:border-emerald-300/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100/80 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                        <Edit3 className="w-4 h-4" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all duration-300" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                      Writing Test
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Opinion-based essay tasks
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
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex-1 flex flex-col justify-between hover:shadow-md transition-shadow duration-300">

              {/* Heatmap Container - 3 rows grid flowing horizontally across months */}
              <div className="my-auto py-2">
                <div className="flex items-start gap-6 sm:gap-8 overflow-x-auto pb-2 scrollbar-none">
                  {recentMonthsData.map((m, mIdx) => (
                    <div key={mIdx} className="flex flex-col gap-3 shrink-0">
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
                      <span className="text-xs font-semibold text-slate-500 pl-0.5">
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Metrics Bar */}
              <div className="flex items-center gap-12 pt-4 border-t border-slate-100 mt-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    AVG. BAND SCORE
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-slate-900">
                      {avgBandScore}
                    </span>
                    <span className={`text-xs font-extrabold ${avgBandScoreNum > 0 ? "text-emerald-500" : "text-slate-400"}`}>
                      {avgImprovement}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    MOCK TESTS TAKEN
                  </span>
                  <span className="text-2xl font-extrabold text-slate-900">
                    {mockTestsTaken}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Section: 4 Skills Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* READING */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-lg hover:border-amber-300/60 hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
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
                  {rawReading > 0 ? "High Accuracy in True/False" : "Chưa làm bài kiểm tra"}
                </span>
              </div>
            </div>

            {/* LISTENING */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-lg hover:border-blue-300/60 hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
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
                  {rawListening > 0 ? "Peak performance reached" : "Chưa làm bài kiểm tra"}
                </span>
              </div>
            </div>

            {/* SPEAKING */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-lg hover:border-indigo-300/60 hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
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
                  {rawSpeaking > 0 ? "Fluency progressing" : "Chưa làm bài kiểm tra"}
                </span>
              </div>
            </div>

            {/* WRITING */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-lg hover:border-emerald-300/60 hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
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
                  {rawWriting > 0 ? "Grammatical range focus" : "Chưa làm bài kiểm tra"}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Suggestions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Suggestions
              </h2>
              <a
                href="#"
                className="text-xs font-bold text-[#1e50e6] hover:underline flex items-center gap-1"
              >
                <span>View Learning Path</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>

            {/* Suggestion Cards List */}
            <div className="space-y-3">
              {/* Card 1 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-300 flex items-center justify-between gap-4 group cursor-pointer">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Thumbnail Image */}
                  <div className="relative overflow-hidden rounded-xl shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=200"
                      alt="Writing Task 2"
                      className="w-20 h-16 object-cover border border-slate-100 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mb-1">
                      WRITING TASK 2
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                      Complex Sentence Structures & Cohesion
                    </h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      Your recent essays show a lack of variety in conjunctions. This lesson targets...
                    </p>
                  </div>
                </div>

                <button className="w-10 h-10 rounded-full bg-blue-50 group-hover:bg-[#1e50e6] text-blue-600 group-hover:text-white flex items-center justify-center shadow-xs shrink-0 transition-colors duration-200 active:scale-95 cursor-pointer">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-300 flex items-center justify-between gap-4 group cursor-pointer">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Thumbnail Image */}
                  <div className="relative overflow-hidden rounded-xl shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=200"
                      alt="Speaking Part 2"
                      className="w-20 h-16 object-cover border border-slate-100 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mb-1">
                      SPEAKING PART 2
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                      Mastering the 2-Minute Long Turn
                    </h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      Practice topic expansion and structural cues to avoid early silence in part 2.
                    </p>
                  </div>
                </div>

                <button className="w-10 h-10 rounded-full bg-blue-50 group-hover:bg-[#1e50e6] text-blue-600 group-hover:text-white flex items-center justify-center shadow-xs shrink-0 transition-colors duration-200 active:scale-95 cursor-pointer">
                  <Mic className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        aria-label="Add New Task"
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
    </AppLayout>
  )
}

export default Home
