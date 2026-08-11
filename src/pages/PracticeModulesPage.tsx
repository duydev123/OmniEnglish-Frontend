import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useUserStore, initialUser } from "../stores/user/useUserStore"
import { userApi } from "../services/userApi"
import { useToast } from "../components/common/Toast"
import { LogoutModal } from "../components/common/LogoutModal"
import Sidebar from "../components/common/Sidebar"
import { practiceApi } from "../services/practiceApi"
import type { ReadingPassageItem, ListeningPassageItem } from "../services/practiceApi"
import {
  Bell,
  BookOpen,
  GraduationCap,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Mic,
  FileText,
  ArrowRight,
  SlidersHorizontal,
  Filter,
  Zap,
  Loader2,
  Clock,
  HelpCircle,
  LogOut
} from "lucide-react"

const PracticeModulesPage = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"listening" | "reading" | "speaking" | "writing">("listening")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)
  const [loading, setLoading] = useState(false)
  const [readingItems, setReadingItems] = useState<ReadingPassageItem[]>([])
  const [listeningItems, setListeningItems] = useState<ListeningPassageItem[]>([])
  const [speakingTopics, setSpeakingTopics] = useState<import("../types/speaking").SpeakingTopic[]>([])
  const [shadowingSentences, setShadowingSentences] = useState<import("../types/speaking").ShadowingSentence[]>([])
  const [speakingSubTab, setSpeakingSubTab] = useState<"ielts" | "shadowing">("ielts")
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const { user, setUser } = useUserStore()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const username = user?.username || "User"
  const email = user?.email || ""
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1e50e6&color=fff&size=128`
  const avatarUrl = user?.avatar || user?.avarta || defaultAvatar

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

  useEffect(() => {
    const fetchModuleData = async () => {
      setLoading(true)
      if (activeTab === "reading") {
        const data = await practiceApi.getReadingPassages(currentPage, itemsPerPage)
        setReadingItems(data)
      } else if (activeTab === "listening") {
        const data = await practiceApi.getListeningPassages(currentPage, itemsPerPage)
        setListeningItems(data)
      } else if (activeTab === "speaking") {
        if (speakingSubTab === "ielts") {
          const topics = await (await import("../services/speakingApi")).speakingApi.getTopics(currentPage, itemsPerPage)
          setSpeakingTopics(topics)
        } else {
          const sentences = await (await import("../services/speakingApi")).speakingApi.getShadowingSentences(currentPage, itemsPerPage)
          setShadowingSentences(sentences)
        }
      }
      setLoading(false)
    }

    fetchModuleData()
  }, [activeTab, currentPage, itemsPerPage, speakingSubTab])

  return (
    <div className="min-h-screen bg-[#f8fafd] flex flex-col text-slate-800 font-sans antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 h-16 px-4 lg:px-8 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          {/* Logo (Hero style) */}
          <Link to="/" className="flex items-center gap-2.5 cursor-pointer select-none hover:opacity-90 transition">
            <div className="bg-[#1e50e6] rounded-lg p-1.5 flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1e50e6] tracking-tight">OmniEnglish</span>
          </Link>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
          </button>

          {/* User Profile Avatar */}
          <Link to="/profile" className="flex items-center gap-3 cursor-pointer group">
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
          </Link>

          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            aria-label="Log Out"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
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

        {/* Centralized Reusable Sidebar */}
        <Sidebar isOpen={mobileSidebarOpen || true} onClose={() => setMobileSidebarOpen(false)} />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 w-full p-4 sm:p-6 lg:p-8 space-y-7 max-w-7xl mx-auto overflow-x-hidden flex flex-col justify-between">
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

            {/* Practice Items Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Loader2 className="w-8 h-8 text-[#1e50e6] animate-spin" />
                <span className="text-xs font-semibold text-slate-500">
                  Đang tải danh sách bài tập từ hệ thống...
                </span>
              </div>
            ) : activeTab === "reading" ? (
              readingItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {readingItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-amber-300/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                              READING PASSAGE
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400">
                              {item.difficulty || "Intermediate"}
                            </span>
                          </div>
                        </div>

                        <button
                          aria-label="Start Reading"
                          className="w-9 h-9 rounded-full bg-amber-50 text-amber-700 group-hover:bg-[#1e50e6] group-hover:text-white flex items-center justify-center transition-colors duration-200 cursor-pointer shadow-xs"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors leading-snug line-clamp-2">
                        {item.title}
                      </h3>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.total_questions} Questions</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.time_limit_minutes} Mins</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-700">Chưa có bài đọc nào</h3>
                  <p className="text-xs text-slate-400">Hệ thống chưa tìm thấy dữ liệu bài Reading trong cơ sở dữ liệu.</p>
                </div>
              )
            ) : activeTab === "listening" ? (
              listeningItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {listeningItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-blue-300/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <Headphones className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                              LISTENING PASSAGE
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400">
                              {item.unit_code || "Academic"}
                            </span>
                          </div>
                        </div>

                        <button
                          aria-label="Start Listening"
                          className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 group-hover:bg-[#1e50e6] group-hover:text-white flex items-center justify-center transition-colors duration-200 cursor-pointer shadow-xs"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                        {item.title}
                      </h3>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.total_questions} Questions</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.time_limit_minutes} Mins</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
                  <Headphones className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-700">Chưa có bài nghe nào</h3>
                  <p className="text-xs text-slate-400">Hệ thống chưa tìm thấy dữ liệu bài Listening trong cơ sở dữ liệu.</p>
                </div>
              )
            ) : activeTab === "speaking" ? (
              <div className="space-y-4">
                {/* Sub-tab selection for Speaking: IELTS Tests vs Shadowing */}
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <button
                    onClick={() => setSpeakingSubTab("ielts")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      speakingSubTab === "ielts"
                        ? "bg-[#1e50e6] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    IELTS Speaking Tests
                  </button>
                  <button
                    onClick={() => setSpeakingSubTab("shadowing")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      speakingSubTab === "shadowing"
                        ? "bg-[#1e50e6] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Shadowing Practice
                  </button>
                </div>

                {speakingSubTab === "ielts" ? (
                  speakingTopics.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                      {speakingTopics.map((topic, idx) => (
                        <div
                          key={topic.id}
                          onClick={() => navigate(`/speaking/practice/topic/${topic.id}`)}
                          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-blue-300/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 group cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-[#1e50e6] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                <Mic className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1e50e6] block">
                                  SPEAKING
                                </span>
                                <span className="text-[11px] font-semibold text-slate-400">
                                  {topic.is_full_test ? "Full Mock Test" : "Topic Practice"}
                                </span>
                              </div>
                            </div>

                            <button
                              aria-label="Start Speaking Test"
                              className="w-9 h-9 rounded-full bg-blue-50 text-[#1e50e6] group-hover:bg-[#1e50e6] group-hover:text-white flex items-center justify-center transition-colors duration-200 cursor-pointer shadow-xs"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>

                          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#1e50e6] transition-colors leading-snug line-clamp-2">
                            {topic.title || `Speaking Authentic Test Practice ${idx + 1}`}
                          </h3>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                              <span>{topic.tags?.join(" • ") || "Part 1, 2, 3"}</span>
                              <span className="font-bold text-blue-600">{topic.prompt_count || 3} Prompts</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#1e50e6] rounded-full w-0 group-hover:w-full transition-all duration-500" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
                      <Mic className="w-10 h-10 text-slate-300 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-700">No speaking topics found</h3>
                      <p className="text-xs text-slate-400">Click below to start a quick sample practice.</p>
                      <button
                        onClick={() => navigate("/speaking/practice/topic/sample")}
                        className="mt-2 px-5 py-2.5 bg-[#1e50e6] text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
                      >
                        Start Speaking Practice
                      </button>
                    </div>
                  )
                ) : (
                  shadowingSentences.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                      {shadowingSentences.map((sentence) => (
                        <div
                          key={sentence.id}
                          onClick={() => navigate(`/speaking/shadowing/${sentence.id}`, { state: { sentence } })}
                          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-indigo-300/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 group cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                <Zap className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                                  SHADOWING
                                </span>
                                <span className="text-[11px] font-semibold text-slate-400">
                                  {sentence.target_skill || "Intonation & Accent"}
                                </span>
                              </div>
                            </div>

                            <button
                              aria-label="Start Shadowing"
                              className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors duration-200 cursor-pointer shadow-xs"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-relaxed italic">
                            "{sentence.english_text}"
                          </p>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                            <span>{sentence.ipa_text}</span>
                            <span className="font-sans font-bold text-indigo-600">Practice Now →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
                      <Zap className="w-10 h-10 text-indigo-300 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-700">No Shadowing sentences available</h3>
                      <button
                        onClick={() => navigate("/speaking/shadowing")}
                        className="mt-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition"
                      >
                        Open Shadowing Tool
                      </button>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
                <FileText className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-base font-extrabold text-slate-800">
                  Module WRITING is coming soon
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Our development team is preparing automated essay evaluation. Stay tuned!
                </p>
              </div>
            )}
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

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </div>
  )
}

export default PracticeModulesPage
