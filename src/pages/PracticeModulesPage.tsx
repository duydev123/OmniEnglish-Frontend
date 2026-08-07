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
  ChevronLeft,
  ChevronRight,
  Headphones,
  Mic,
  FileText,
  RotateCcw,
  ArrowRight,
  CheckCircle,
  Filter,
  SlidersHorizontal,
  Zap
} from "lucide-react"

interface PracticeItem {
  id: number
  skill: "listening" | "reading" | "speaking" | "writing"
  title: string
  questionType: string
  progress: number
  status: "in-progress" | "completed"
  score?: string
  time?: string
}

const mockPracticeItems: PracticeItem[] = [
  {
    id: 1,
    skill: "listening",
    title: "Listening Authentic Test Practice 1",
    questionType: "Table Completion",
    progress: 0,
    status: "in-progress"
  },
  {
    id: 2,
    skill: "listening",
    title: "Listening Authentic Test Practice 2",
    questionType: "Multiple Choice, Multiple Question",
    progress: 20,
    status: "in-progress"
  },
  {
    id: 3,
    skill: "listening",
    title: "Listening Authentic Test Practice 3",
    questionType: "Matching Information",
    progress: 100,
    status: "completed",
    score: "9/10",
    time: "04:25"
  },
  {
    id: 4,
    skill: "listening",
    title: "Listening Authentic Test Practice 4",
    questionType: "Form Completion",
    progress: 100,
    status: "completed",
    score: "3/10",
    time: "13:55"
  },
  {
    id: 5,
    skill: "listening",
    title: "Listening Authentic Test Practice 5",
    questionType: "Short Answer Questions",
    progress: 100,
    status: "completed",
    score: "6/10",
    time: "08:25"
  },
  {
    id: 6,
    skill: "listening",
    title: "Listening Authentic Test Practice 6",
    questionType: "Sentence Completion",
    progress: 100,
    status: "completed",
    score: "8/10",
    time: "22:45"
  }
]

const PracticeModulesPage = () => {
  const [basicOpen, setBasicOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"listening" | "reading" | "speaking" | "writing">("listening")
  const [questionTypeFilter, setQuestionTypeFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)

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
          <Link to="/profile" className="flex items-center gap-3 cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120"
              alt="Alex Avatar"
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

            {/* Practice Module (Active) */}
            <Link
              to="/practice-modules"
              className="flex items-center gap-3 px-4 py-3 bg-[#1e50e6] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition"
            >
              <GraduationCap className="w-4 h-4" />
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

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-7 max-w-7xl mx-auto overflow-x-hidden flex flex-col justify-between">
          <div className="space-y-6">
            {/* Top Header: Title & Recent Practice Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Practice Modules
              </h1>

              <button className="self-start sm:self-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 px-4 rounded-full flex items-center gap-2 transition shadow-2xs cursor-pointer">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Recent Practice</span>
              </button>
            </div>

            {/* Filter Bar: Skill Tabs (Left) + Question Type Dropdown (Right) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Skill Tabs */}
              <div className="bg-slate-200/50 p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto">
                {/* Listening */}
                <button
                  onClick={() => setActiveTab("listening")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition whitespace-nowrap cursor-pointer ${activeTab === "listening"
                      ? "bg-[#1e50e6] text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                    }`}
                >
                  <Headphones className="w-4 h-4" />
                  <span>Listening</span>
                </button>

                {/* Reading */}
                <button
                  onClick={() => setActiveTab("reading")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition whitespace-nowrap cursor-pointer ${activeTab === "reading"
                      ? "bg-[#1e50e6] text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                    }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Reading</span>
                </button>

                {/* Speaking */}
                <button
                  onClick={() => setActiveTab("speaking")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition whitespace-nowrap cursor-pointer ${activeTab === "speaking"
                      ? "bg-[#1e50e6] text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                    }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>Speaking</span>
                </button>

                {/* Writing */}
                <button
                  onClick={() => setActiveTab("writing")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition whitespace-nowrap cursor-pointer ${activeTab === "writing"
                      ? "bg-[#1e50e6] text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                    }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Writing</span>
                </button>
              </div>

              {/* Question Type Filter Dropdown */}
              <div className="relative min-w-[240px]">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 px-4 shadow-2xs flex items-center justify-between cursor-pointer hover:border-slate-300 transition">
                  <div className="flex items-center gap-2.5 text-slate-500">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">
                      Filter by question type
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Practice Items Grid (2 cols x 3 rows) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {mockPracticeItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  {/* Top Row: Icon Badge + Skill Name + Action Circle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.status === "completed" ? (
                        <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-5 h-5 fill-emerald-100 text-emerald-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
                          <Headphones className="w-5 h-5" />
                        </div>
                      )}

                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {item.skill}
                      </span>
                    </div>

                    {/* Action Icon Button */}
                    {item.status === "completed" ? (
                      <button
                        aria-label="Retry Practice"
                        className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        aria-label="Start Practice"
                        className="w-9 h-9 rounded-full bg-blue-100/70 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition cursor-pointer"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    {item.title}
                  </h3>

                  {/* Bottom Stats & Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-medium text-slate-500">
                        {item.status === "completed"
                          ? `Correct: ${item.score} | Time: ${item.time}`
                          : item.questionType}
                      </span>

                      {item.status === "completed" ? (
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                          COMPLETED
                        </span>
                      ) : (
                        <span
                          className={`font-bold ${item.progress > 0 ? "text-blue-600" : "text-slate-700"
                            }`}
                        >
                          {item.progress}%
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.status === "completed"
                            ? "bg-emerald-600"
                            : item.progress > 0
                              ? "bg-[#1e50e6]"
                              : "bg-blue-200"
                          }`}
                        style={{
                          width: item.status === "completed" ? "100%" : `${item.progress}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200/60 mt-8">
            {/* Show items dropdown */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Show</span>
              <div className="relative">
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-7 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value={6}>6 items</option>
                  <option value={12}>12 items</option>
                  <option value={24}>24 items</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage(1)}
                className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition ${currentPage === 1
                    ? "bg-[#1e50e6] text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                1
              </button>

              <button
                onClick={() => setCurrentPage(2)}
                className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition ${currentPage === 2
                    ? "bg-[#1e50e6] text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                2
              </button>

              <button
                onClick={() => setCurrentPage(2)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default PracticeModulesPage
