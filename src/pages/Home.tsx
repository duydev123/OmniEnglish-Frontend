import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useUserStore } from "../stores/user/useUserStore"
import { userApi } from "../services/userApi"
import {
  Menu,
  Bell,
  Home as HomeIcon,
  BookOpen,
  GraduationCap,
  Monitor,
  User,
  ChevronDown,
  ChevronUp,
  Flame,
  Award,
  Mic,
  Headphones,
  Edit3,
  FileText,
  Play,
  Plus,
  Zap,
  CheckCircle2,
  Sparkles
} from "lucide-react"

const Home = () => {
  const [basicOpen, setBasicOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [timeRange, setTimeRange] = useState("Last 30 Days")

  const { user, setUser } = useUserStore()

  useEffect(() => {
    const fetchUserData = async () => {
      const data = await userApi.getUserProfile()
      setUser(data)
    }
    fetchUserData()
  }, [setUser])

  const username = user?.username || "Alex"
  const avatarUrl = user?.avatar || user?.avarta || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120"
  const streakDays = user?.stats?.current_streak_days ?? 15
  const weeklyXp = user?.stats?.weekly_xp ?? 420
  const weeklyGoalTarget = 500
  const weeklyXpPercent = Math.min(100, Math.round((weeklyXp / weeklyGoalTarget) * 100))

  const readingScore = user?.stats?.avg_reading_score ? user.stats.avg_reading_score.toFixed(1) : "7.0"
  const listeningScore = user?.stats?.avg_listening_score ? user.stats.avg_listening_score.toFixed(1) : "7.5"
  const speakingScore = user?.stats?.avg_speaking_score ? user.stats.avg_speaking_score.toFixed(1) : "6.5"
  const writingScore = user?.stats?.avg_writing_score ? user.stats.avg_writing_score.toFixed(1) : "6.0"

  const avgBandScore = user?.stats
    ? ((user.stats.avg_reading_score + user.stats.avg_listening_score + user.stats.avg_speaking_score + user.stats.avg_writing_score) / 4 || 6.8).toFixed(1)
    : "6.8"

  return (
    <div className="min-h-screen bg-[#f8fafd] flex flex-col text-slate-800 font-sans antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 h-16 px-4 lg:px-8 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-2xl font-extrabold tracking-tight">
              <span className="text-[#1e50e6]">omni</span>
              <span className="text-slate-900">English</span>
            </span>
          </Link>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* User Profile Avatar */}
          <Link to="/profile" className="flex items-center gap-3 cursor-pointer">
            <img
              src={avatarUrl}
              alt={`${username} Avatar`}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20"
            />
          </Link>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Mobile Backdrop */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 lg:hidden"
          />
        )}

        {/* Left Sidebar */}
        <aside
          className={`fixed lg:sticky top-16 z-30 h-[calc(100vh-4rem)] w-64 bg-[#f8fafd] border-r border-slate-200/60 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out ${mobileSidebarOpen ? "translate-x-0 bg-white" : "-translate-x-full lg:translate-x-0"
            }`}
        >
          {/* Navigation Links */}
          <nav className="space-y-1.5 overflow-y-auto">
            {/* Home */}
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 bg-[#1e50e6] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition"
            >
              <HomeIcon className="w-4 h-4" />
              <span>Home</span>
            </Link>

            {/* Basic Accordion */}
            <div>
              <button
                onClick={() => setBasicOpen(!basicOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 text-sm font-medium rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  <span>Basic</span>
                </div>
                {basicOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {basicOpen && (
                <div className="ml-7 pl-3 border-l-2 border-slate-200 mt-1 space-y-1">
                  <Link
                    to="/vocabulary"
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 text-xs font-semibold rounded-lg transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Vocabulary</span>
                  </Link>
                  <a
                    href="#"
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 text-xs font-semibold rounded-lg transition"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>Grammar</span>
                  </a>
                </div>
              )}
            </div>

            {/* Practice Module */}
            <Link
              to="/practice-modules"
              className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 text-sm font-medium rounded-xl transition"
            >
              <GraduationCap className="w-4 h-4 text-slate-500" />
              <span>Practice Module</span>
            </Link>

            {/* Computer-based Tests */}
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 text-sm font-medium rounded-xl transition"
            >
              <Monitor className="w-4 h-4 text-slate-500" />
              <span>Computer-based Tests</span>
            </a>

            {/* Profile */}
            <Link
              to="/profile"
              className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 text-sm font-medium rounded-xl transition"
            >
              <User className="w-4 h-4 text-slate-500" />
              <span>Profile</span>
            </Link>
          </nav>

          {/* Bottom Card: Weekly Goal */}
          <div className="bg-[#eaf1ff] border border-blue-100 rounded-2xl p-4 mt-auto">
            <span className="text-[11px] font-bold text-blue-900/70 tracking-wide block mb-1">
              Weekly Goal
            </span>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xl font-extrabold text-slate-900">{weeklyXpPercent}%</span>
              <span className="text-xs font-medium text-slate-500">{weeklyXp}/{weeklyGoalTarget} XP</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-blue-200/60 rounded-full h-2 overflow-hidden mb-3">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${weeklyXpPercent}%` }}
              />
            </div>

            <button className="w-full bg-[#1e50e6] hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition active:scale-98 cursor-pointer">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Upgrade</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-7 max-w-7xl mx-auto overflow-x-hidden">
          {/* Header Row: Welcome + Gamification Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {username}!
            </h1>

            {/* Streak & Rank Badges */}
            <div className="flex items-center gap-3">
              {/* Streak Badge */}
              <div className="bg-white border border-slate-200/70 rounded-2xl p-2.5 px-4 shadow-2xs flex items-center gap-3 hover:border-slate-300 transition">
                <div className="w-10 h-10 rounded-xl bg-amber-100/70 flex items-center justify-center text-amber-600 shrink-0">
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
              <div className="bg-white border border-slate-200/70 rounded-2xl p-2.5 px-4 shadow-2xs flex items-center gap-3 hover:border-slate-300 transition">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/70 flex items-center justify-center text-emerald-600 shrink-0">
                  <Award className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                    RANK
                  </span>
                  <span className="text-base font-extrabold text-slate-800 leading-tight">
                    #4 Gold
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Continue Practice & Performance Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Continue Practice (col-span-5) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">
                  Continue Practice
                </h2>
                <Link
                  to="/practice-modules"
                  className="text-xs font-bold text-[#1e50e6] hover:underline"
                >
                  View All
                </Link>
              </div>

              {/* 2x2 Grid */}
              <div className="grid grid-cols-2 gap-3.5 flex-1">
                {/* Reading Test Card */}
                <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-amber-100/70 flex items-center justify-center text-amber-700 mb-3">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                      Reading Test
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Complex academic texts
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-1.5">
                      <div
                        className="bg-amber-800 h-full rounded-full"
                        style={{ width: "30%" }}
                      />
                    </div>
                    <div className="text-right text-[11px] font-extrabold text-slate-800">
                      30%
                    </div>
                  </div>
                </div>

                {/* Speaking Test Card */}
                <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-indigo-100/70 flex items-center justify-center text-indigo-600 mb-3">
                      <Mic className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                      Speaking Test
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Pronunciation Drill #01
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-1.5">
                      <div
                        className="bg-indigo-300 h-full rounded-full"
                        style={{ width: "0%" }}
                      />
                    </div>
                    <div className="text-right text-[11px] font-extrabold text-slate-800">
                      0%
                    </div>
                  </div>
                </div>

                {/* Listening Test Card */}
                <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-blue-100/70 flex items-center justify-center text-blue-600 mb-3">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                      Listening Test
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Academic Lecture #04
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-1.5">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: "65%" }}
                      />
                    </div>
                    <div className="text-right text-[11px] font-extrabold text-slate-800">
                      65%
                    </div>
                  </div>
                </div>

                {/* Writing Test Card */}
                <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-100/70 flex items-center justify-center text-emerald-600 mb-3">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                      Writing Test
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Opinion-based essay tasks
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-1.5">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: "12%" }}
                      />
                    </div>
                    <div className="text-right text-[11px] font-extrabold text-slate-800">
                      12%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Performance Trends Chart (col-span-7) */}
            <div className="lg:col-span-7 bg-white border border-slate-200/70 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Performance Trends
                </h2>

                <div className="relative">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg px-3 py-1.5 pr-7 cursor-pointer hover:bg-slate-100 focus:outline-none"
                  >
                    <option>Last 30 Days</option>
                    <option>Last 7 Days</option>
                    <option>Last 3 Months</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Chart SVG */}
              <div className="relative h-44 w-full my-2">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 500 160"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1e50e6" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#1e50e6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="140" x2="500" y2="140" stroke="#e2e8f0" strokeWidth="1" />

                  {/* Area fill */}
                  <path
                    d="M 10 90 C 80 70, 150 20, 200 15 L 485 105 L 485 140 L 10 140 Z"
                    fill="url(#chartGrad)"
                  />

                  {/* Smooth curve line */}
                  <path
                    d="M 10 90 Q 75 75, 140 30 T 200 15"
                    fill="none"
                    stroke="#1e50e6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* End active dot */}
                  <circle cx="485" cy="105" r="4.5" fill="#1e50e6" />
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2 px-1">
                  <span>OCT 01</span>
                  <span>OCT 10</span>
                  <span>OCT 20</span>
                  <span>TODAY</span>
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
                    <span className="text-xs font-extrabold text-emerald-500">
                      +0.4
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    MOCK TESTS TAKEN
                  </span>
                  <span className="text-2xl font-extrabold text-slate-900">
                    14
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: 4 Skills Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* READING */}
            <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-2xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  +0.2
                </span>
              </div>
              <div className="mt-3">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                  READING
                </span>
                <span className="text-2xl font-extrabold text-slate-900 block my-0.5">
                  {readingScore}
                </span>
                <span className="text-[11px] font-medium text-slate-400 block">
                  High Accuracy in True/False
                </span>
              </div>
            </div>

            {/* LISTENING */}
            <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-2xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <Headphones className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  +0.5
                </span>
              </div>
              <div className="mt-3">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                  LISTENING
                </span>
                <span className="text-2xl font-extrabold text-slate-900 block my-0.5">
                  {listeningScore}
                </span>
                <span className="text-[11px] font-medium text-slate-400 block">
                  Peak performance reached
                </span>
              </div>
            </div>

            {/* SPEAKING */}
            <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-2xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <Mic className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">
                  -0.1
                </span>
              </div>
              <div className="mt-3">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                  SPEAKING
                </span>
                <span className="text-2xl font-extrabold text-slate-900 block my-0.5">
                  {speakingScore}
                </span>
                <span className="text-[11px] font-medium text-slate-400 block">
                  Fluency needs focus
                </span>
              </div>
            </div>

            {/* WRITING */}
            <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-2xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  0.0
                </span>
              </div>
              <div className="mt-3">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                  WRITING
                </span>
                <span className="text-2xl font-extrabold text-slate-900 block my-0.5">
                  {writingScore}
                </span>
                <span className="text-[11px] font-medium text-slate-400 block">
                  Grammatical range focus
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
                className="text-xs font-bold text-[#1e50e6] hover:underline"
              >
                View Learning Path
              </a>
            </div>

            {/* Suggestion Cards List */}
            <div className="space-y-3">
              {/* Card 1 */}
              <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-2xs hover:shadow-md transition flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Thumbnail Image */}
                  <img
                    src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=200"
                    alt="Writing Task 2"
                    className="w-20 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      WRITING TASK 2
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      Complex Sentence Structures & Cohesion
                    </h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      Your recent essays show a lack of variety in conjunctions. This lesson targets...
                    </p>
                  </div>
                </div>

                <button className="w-10 h-10 rounded-full bg-[#1e50e6] hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 transition active:scale-95 cursor-pointer">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-2xs hover:shadow-md transition flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Thumbnail Image */}
                  <img
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=200"
                    alt="Speaking Part 2"
                    className="w-20 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      SPEAKING PART 2
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      Mastering the 2-Minute Long Turn
                    </h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      Practice topic expansion and structural cues to avoid early silence in part 2.
                    </p>
                  </div>
                </div>

                <button className="w-10 h-10 rounded-full bg-[#1e50e6] hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 transition active:scale-95 cursor-pointer">
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        aria-label="Add New Task"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#1e50e6] hover:bg-blue-700 text-white flex items-center justify-center shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  )
}

export default Home
