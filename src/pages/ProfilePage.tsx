import React, { useState } from "react"
import { Link } from "react-router-dom"
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
  Sliders
} from "lucide-react"

const ProfilePage = () => {
  const [basicOpen, setBasicOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [weekendMastery, setWeekendMastery] = useState(true)
  const [selectedGoal, setSelectedGoal] = useState<"fluency" | "steady">("fluency")

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
          <Link to="/" className="flex items-center gap-2 select-none">
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
          <div className="flex items-center gap-3 cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120"
              alt="Alex Avatar"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20"
            />
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
          <div className="bg-[#eaf1ff] border border-blue-100 rounded-2xl p-4 mt-auto">
            <span className="text-[11px] font-bold text-blue-900/70 tracking-wide block mb-1">
              Weekly Goal
            </span>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xl font-extrabold text-slate-900">85%</span>
              <span className="text-xs font-medium text-slate-500">420/500 XP</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-blue-200/60 rounded-full h-2 overflow-hidden mb-3">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: "85%" }}
              />
            </div>

            <button className="w-full bg-[#1e50e6] hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition active:scale-98 cursor-pointer">
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
                Manage your account, track your English mastery progress, and refine your learning goals for optimal results.
              </p>
            </div>

            {/* Top Grid: User Info Card (Left) + Stats & Proficiency (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Profile Card (4 cols) */}
              <div className="lg:col-span-4 bg-white border border-slate-200/70 rounded-2xl p-6 shadow-2xs flex flex-col items-center text-center">
                {/* Avatar with Camera Overlay */}
                <div className="relative mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=240"
                    alt="Alex Thorne"
                    className="w-24 h-24 rounded-2xl object-cover ring-4 ring-slate-100"
                  />
                  <button
                    aria-label="Upload Photo"
                    className="absolute -bottom-1 -right-1 bg-[#1e50e6] hover:bg-blue-700 text-white p-1.5 rounded-xl border-2 border-white shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h2 className="text-lg font-extrabold text-slate-900">
                  Alex Thorne
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-1 max-w-[200px] leading-snug">
                  Focus: Business English & Academic Writing
                </p>

                <div className="w-full border-t border-slate-100 my-5" />

                {/* Member Since & Streak Row */}
                <div className="w-full grid grid-cols-2 text-left">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      MEMBER SINCE
                    </span>
                    <span className="text-sm font-extrabold text-slate-800">
                      Oct 2023
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      DAILY STREAK
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-extrabold text-slate-800">
                        42 Days
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
                  <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        +12% this week
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        ENGLISH VOCABULARY
                      </span>
                      <div className="flex items-baseline gap-1.5 mb-3">
                        <span className="text-2xl font-extrabold text-slate-900">
                          4,821
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          words
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#1e50e6] h-full rounded-full"
                          style={{ width: "65%" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Speaking Practice */}
                  <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center">
                        <Volume2 className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        +4h today
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        SPEAKING PRACTICE
                      </span>
                      <div className="flex items-baseline gap-1.5 mb-3">
                        <span className="text-2xl font-extrabold text-slate-900">
                          156.5
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          hours
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: "50%" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* English Proficiency Level Box */}
                <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">
                      English Proficiency Level
                    </h3>

                    {/* CEFR Level Badges */}
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-[10px] flex items-center justify-center">
                        B2
                      </span>
                      <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-extrabold text-[10px] flex items-center justify-center">
                        C1
                      </span>
                      <span className="w-6 h-6 rounded-full bg-amber-800 text-white font-extrabold text-[10px] flex items-center justify-center">
                        C2
                      </span>
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
                          Advanced • C1
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-[#1e50e6] h-full rounded-full"
                          style={{ width: "85%" }}
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
                          Proficient • 68%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: "68%" }}
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
              <div className="lg:col-span-6 bg-white border border-slate-200/70 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center">
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
                    <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      30 words
                    </span>
                  </div>

                  {/* Goal Cards Options */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* Option 1: Fluency Push */}
                    <div
                      onClick={() => setSelectedGoal("fluency")}
                      className={`rounded-2xl p-4 border-2 transition cursor-pointer flex flex-col items-center text-center ${
                        selectedGoal === "fluency"
                          ? "border-[#1e50e6] bg-blue-50/40 shadow-xs"
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
                      className={`rounded-2xl p-4 border-2 transition cursor-pointer flex flex-col items-center text-center ${
                        selectedGoal === "steady"
                          ? "border-[#1e50e6] bg-blue-50/40 shadow-xs"
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
                        System will prioritize complex grammar structures and advanced syntax during weekends.
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
              <div className="lg:col-span-6 bg-white border border-slate-200/70 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center">
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
                            Last changed 3 months ago
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
                            Email and Push enabled
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
                            Current: Spanish (Español)
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    <button className="w-full bg-[#1e50e6] hover:bg-blue-700 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-md shadow-blue-500/20 transition active:scale-98 cursor-pointer">
                      Save All Changes
                    </button>

                    <button className="w-full text-rose-600 hover:text-rose-700 font-bold text-xs sm:text-sm py-2 text-center transition cursor-pointer">
                      Sign Out
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
    </div>
  )
}

export default ProfilePage
