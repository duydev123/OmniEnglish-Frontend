import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useUserStore, initialUser } from "../stores/user/useUserStore"
import { userApi } from "../services/userApi"
import { useToast } from "../components/common/Toast"
import { LogoutModal } from "../components/common/LogoutModal"
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
  ChevronRight,
  Flame,
  Zap,
  Volume2,
  Camera,
  Target,
  Lock,
  Globe,
  Leaf,
  Sliders,
  LogOut
} from "lucide-react"

const ProfilePage = () => {
  const [basicOpen, setBasicOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [weekendMastery, setWeekendMastery] = useState(true)
  const [selectedGoal, setSelectedGoal] = useState<"fluency" | "steady">("fluency")
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const { user, setUser } = useUserStore()
  const navigate = useNavigate()
  const { showToast } = useToast()

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }
      const data = await userApi.getUserProfile()
      if (data) {
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
  const email = user?.email || ""
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1e50e6&color=fff&size=128`
  const avatarUrl = user?.avatar || user?.avarta || defaultAvatar
  const streakDays = user?.stats?.current_streak_days ?? 0
  const totalWords = user?.stats?.total_words_learned ?? 0
  const speakingHours = user?.stats?.total_speaking_hours ?? 0
  const dailyWordTarget = user?.settings?.daily_word_target ?? 30
  const baseLanguage = user?.settings?.base_language || "Vietnamese (Tiếng Việt)"

  const weeklyXp = user?.stats?.weekly_xp ?? 0
  const weeklyGoalTarget = dailyWordTarget * 15
  const weeklyXpPercent = Math.min(100, Math.round((weeklyXp / weeklyGoalTarget) * 100))
  const proficiencyLevel = user?.proficiency_level || user?.stats?.general_english_level || "B1"

  const vocabProgressPercent = totalWords > 0 ? Math.min(100, Math.max(5, Math.round((totalWords / 2000) * 100))) : 0
  const speakingProgressPercent = speakingHours > 0 ? Math.min(100, Math.max(5, Math.round((speakingHours / 100) * 100))) : 0

  const rawReading = user?.stats?.avg_reading_score ?? 0
  const rawListening = user?.stats?.avg_listening_score ?? 0
  const rawSpeaking = user?.stats?.avg_speaking_score ?? 0
  const rawWriting = user?.stats?.avg_writing_score ?? 0
  const avgBandScoreNum = (rawReading + rawListening + rawSpeaking + rawWriting) / 4
  const generalEnglishPercent = avgBandScoreNum > 0
    ? Math.min(100, Math.round((avgBandScoreNum / 9.0) * 100))
    : 0

  const cefrLevels = ["A1", "A2", "B1", "B2", "C1", "C2"]

  const handleLogout = () => {
    localStorage.removeItem("token")
    setUser(initialUser)
    showToast("Đã đăng xuất tài khoản!", "info")
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-[#f8fafd] flex flex-col text-slate-800 font-sans antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100/80 h-16 px-4 lg:px-8 flex items-center justify-between shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 select-none cursor-pointer">
            <span className="text-2xl font-extrabold tracking-tight">
              <span className="text-[#1e50e6]">omni</span>
              <span className="text-slate-900">English</span>
            </span>
          </Link>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
          </button>
          
          {/* User Profile Avatar */}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-800 block leading-tight group-hover:text-blue-600 transition-colors">
                {username}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block leading-tight max-w-[140px] truncate">
                {email}
              </span>
            </div>
            <div className="relative">
              <img
                src={avatarUrl}
                alt={`${username} Avatar`}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20 group-hover:ring-blue-600 transition duration-200"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>
          </div>
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
          className={`fixed lg:sticky top-16 z-30 h-[calc(100vh-4rem)] w-64 bg-[#f8fafd] border-r border-slate-200/60 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
            mobileSidebarOpen ? "translate-x-0 bg-white" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Navigation Links */}
          <nav className="space-y-1.5 overflow-y-auto">
            {/* Home */}
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 text-sm font-medium rounded-xl transition"
            >
              <HomeIcon className="w-4 h-4 text-slate-500" />
              <span>Home</span>
            </Link>

            {/* Basic Accordion */}
            <div>
              <button
                onClick={() => setBasicOpen(!basicOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 text-sm font-medium rounded-xl transition cursor-pointer"
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
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
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

            {/* Profile (Active) */}
            <Link
              to="/profile"
              className="flex items-center gap-3 px-4 py-3 bg-[#1e50e6] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </Link>
          </nav>

          {/* Bottom Card: Weekly Goal */}
          <div className="bg-gradient-to-br from-[#eaf1ff] to-[#dbe7ff] border border-blue-200/60 rounded-2xl p-4 mt-auto shadow-xs">
            <span className="text-[11px] font-bold text-blue-900/80 tracking-wide block mb-1 uppercase">
              Weekly Goal
            </span>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xl font-black text-slate-900">{weeklyXpPercent}%</span>
              <span className="text-xs font-bold text-slate-600">{weeklyXp}/{weeklyGoalTarget} XP</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-blue-200/80 rounded-full h-2 overflow-hidden mb-3">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${weeklyXpPercent}%` }}
              />
            </div>

            <button className="w-full bg-[#1e50e6] hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition active:scale-98 cursor-pointer">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Upgrade</span>
            </button>
          </div>
        </aside>

        {/* Main Profile Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-7 max-w-7xl mx-auto overflow-x-hidden flex flex-col justify-between">
          <div className="space-y-7">
            {/* Header Title & Description */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                My Profile
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1.5 leading-relaxed font-normal">
                Quản lý thông tin cá nhân, theo dõi lộ trình học tiếng Anh và thiết lập mục tiêu cá nhân hóa.
              </p>
            </div>

            {/* Top Grid: User Info Card (Left) + Stats & Proficiency (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Profile Card (4 cols) */}
              <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col items-center text-center hover:shadow-md transition-all duration-300">
                {/* Avatar with Camera Overlay */}
                <div className="relative mb-3 group">
                  <img
                    src={avatarUrl}
                    alt={`${username} Avatar`}
                    className="w-24 h-24 rounded-2xl object-cover ring-4 ring-slate-100 shadow-md group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    aria-label="Upload Photo"
                    className="absolute -bottom-1 -right-1 bg-[#1e50e6] hover:bg-blue-700 text-white p-2 rounded-xl border-2 border-white shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h2 className="text-lg font-extrabold text-slate-900">
                  {username}
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-1 max-w-[220px] leading-snug truncate">
                  {email}
                </p>

                <div className="w-full border-t border-slate-100 my-5" />

                {/* Member Since & Streak Row */}
                <div className="w-full grid grid-cols-2 text-left">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      MEMBER SINCE
                    </span>
                    <span className="text-sm font-extrabold text-slate-800">
                      August 2024
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      DAILY STREAK
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-extrabold text-slate-800">
                        {streakDays} Days
                      </span>
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (8 cols): Stats Cards + CEFR Level */}
              <div className="lg:col-span-8 space-y-6">
                {/* 2 Stat Cards Side by Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* English Vocabulary */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-blue-300/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${totalWords > 0 ? "text-emerald-600 bg-emerald-50" : "text-slate-400 bg-slate-100"}`}>
                        {totalWords > 0 ? "+12% this week" : "0%"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        ENGLISH VOCABULARY
                      </span>
                      <div className="flex items-baseline gap-1.5 mb-3">
                        <span className="text-2xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {totalWords.toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          words
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#1e50e6] h-full rounded-full transition-all duration-500"
                          style={{ width: `${vocabProgressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Speaking Practice */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-emerald-300/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Volume2 className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${speakingHours > 0 ? "text-emerald-600 bg-emerald-50" : "text-slate-400 bg-slate-100"}`}>
                        {speakingHours > 0 ? "+4h today" : "0h"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        SPEAKING PRACTICE
                      </span>
                      <div className="flex items-baseline gap-1.5 mb-3">
                        <span className="text-2xl font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
                          {speakingHours}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          hours
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${speakingProgressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* English Proficiency Level Box */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">
                      English Proficiency Level
                    </h3>

                    {/* CEFR Level Badges (All 6 Levels: A1 to C2) */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {cefrLevels.map((lvl) => {
                        const isActive = proficiencyLevel.toUpperCase() === lvl
                        return (
                          <span
                            key={lvl}
                            className={`w-7 h-7 rounded-full text-xs flex items-center justify-center transition-all duration-200 ${
                              isActive
                                ? "bg-[#1e50e6] text-white font-black shadow-md ring-2 ring-blue-400/50 scale-105"
                                : "bg-slate-100 text-slate-400 font-semibold hover:bg-slate-200"
                            }`}
                          >
                            {lvl}
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* General English (CEFR) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800">
                          General English (CEFR)
                        </span>
                        <span className="text-xs font-extrabold text-blue-600">
                          Level {proficiencyLevel} • {generalEnglishPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-[#1e50e6] h-full rounded-full transition-all duration-500 shadow-xs"
                          style={{ width: `${generalEnglishPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Business English */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800">
                          Business English
                        </span>
                        <span className="text-xs font-extrabold text-emerald-600">
                          Progress • {user?.stats?.business_english_progress ?? 0}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${user?.stats?.business_english_progress ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row Grid: Learning Goals (Left) + Account Settings (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Learning Goals (6 cols) */}
              <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6 hover:shadow-md transition-all duration-300">
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center">
                      <Target className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Learning Goals
                    </h3>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      DAILY WORD TARGET
                    </span>
                    <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      {dailyWordTarget} words/day
                    </span>
                  </div>

                  {/* Goal Cards Options */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* Option 1: Fluency Push */}
                    <div
                      onClick={() => setSelectedGoal("fluency")}
                      className={`rounded-2xl p-4 border-2 transition-all duration-200 cursor-pointer flex flex-col items-center text-center ${
                        selectedGoal === "fluency"
                          ? "border-[#1e50e6] bg-blue-50/40 shadow-xs scale-[1.02]"
                          : "border-slate-200/70 bg-white hover:border-slate-300"
                      }`}
                    >
                      <Zap className={`w-5 h-5 mb-2 ${selectedGoal === "fluency" ? "text-blue-600 fill-current" : "text-slate-400"}`} />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                        Fluency Push
                      </h4>
                      <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                        45 mins/day
                      </span>
                    </div>

                    {/* Option 2: Steady Growth */}
                    <div
                      onClick={() => setSelectedGoal("steady")}
                      className={`rounded-2xl p-4 border-2 transition-all duration-200 cursor-pointer flex flex-col items-center text-center ${
                        selectedGoal === "steady"
                          ? "border-[#1e50e6] bg-blue-50/40 shadow-xs scale-[1.02]"
                          : "border-slate-200/70 bg-white hover:border-slate-300"
                      }`}
                    >
                      <Leaf className={`w-5 h-5 mb-2 ${selectedGoal === "steady" ? "text-blue-600 fill-current" : "text-slate-400"}`} />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                        Steady Growth
                      </h4>
                      <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                        15 mins/day
                      </span>
                    </div>
                  </div>

                  {/* Weekend Mastery Toggle */}
                  <div className="pt-4 border-t border-slate-100 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                        Weekend Mastery
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-sm">
                        Hệ thống sẽ ưu tiên các cấu trúc ngữ pháp nâng cao vào các ngày cuối tuần.
                      </p>
                    </div>

                    {/* Switch */}
                    <button
                      onClick={() => setWeekendMastery(!weekendMastery)}
                      className={`w-12 h-6 rounded-full transition-colors p-1 relative shrink-0 cursor-pointer ${
                        weekendMastery ? "bg-[#1e50e6]" : "bg-slate-200"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                          weekendMastery ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Settings (6 cols) */}
              <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6 hover:shadow-md transition-all duration-300">
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Account Settings
                    </h3>
                  </div>

                  {/* Settings Items List */}
                  <div className="space-y-2 mb-6">
                    {/* Item 1: Change Password */}
                    <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-xl transition cursor-pointer border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                            Change Password
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Quản lý mật khẩu truy cập
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>

                    {/* Item 2: Notifications */}
                    <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-xl transition cursor-pointer border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                            Notifications
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Email & Push notifications bật
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>

                    {/* Item 3: Base Language */}
                    <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-xl transition cursor-pointer border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                            Base Language
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Hiện tại: {baseLanguage}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    <button className="w-full bg-[#1e50e6] hover:bg-blue-700 text-white font-bold text-sm py-3.5 px-4 rounded-xl shadow-md shadow-blue-500/20 transition active:scale-98 cursor-pointer">
                      Save All Changes
                    </button>

                    <button
                      onClick={() => setShowLogoutModal(true)}
                      className="w-full text-rose-600 hover:text-rose-700 font-bold text-xs sm:text-sm py-2 text-center transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="pt-12 pb-4 border-t border-slate-200/60 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              © 2024 omniEnglish Language Systems. All rights reserved.
            </div>

            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-slate-600 transition">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-slate-600 transition">
                Terms of Service
              </a>
              <a href="#" className="hover:text-slate-600 transition">
                Support
              </a>
            </div>
          </footer>
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </div>
  )
}

export default ProfilePage
