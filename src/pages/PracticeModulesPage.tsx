import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useUserStore, initialUser } from "../stores/user/useUserStore"
import { userApi } from "../services/userApi"
import { useToast } from "../components/common/Toast"
import { LogoutModal } from "../components/common/LogoutModal"
import { AppLayout } from "../components/common/AppLayout"
import { practiceApi } from "../services/practiceApi"
import type { ReadingPassageItem, ListeningPassageItem } from "../services/practiceApi"
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Mic,
  FileText,
  ArrowRight,
  SlidersHorizontal,
  Filter,
  Loader2,
  Clock,
  HelpCircle
} from "lucide-react"

import { writingApi } from "../services/writingApi"
import type { WritingPrompt } from "../types/writing"

const PracticeModulesPage = () => {
  const [activeTab, setActiveTab] = useState<"listening" | "reading" | "speaking" | "writing">("listening")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)
  const [loading, setLoading] = useState(false)
  const [readingItems, setReadingItems] = useState<ReadingPassageItem[]>([])
  const [listeningItems, setListeningItems] = useState<ListeningPassageItem[]>([])
  const [writingItems, setWritingItems] = useState<WritingPrompt[]>([])
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const { setUser } = useUserStore()
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
      } else if (activeTab === "writing") {
        const data = await writingApi.getPrompts()
        setWritingItems(data)
      }
      setLoading(false)
    }

    fetchModuleData()
  }, [activeTab, currentPage, itemsPerPage])

  return (
    <AppLayout breadcrumbs={[{ label: 'PRACTICE MODULES' }]}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-7 max-w-7xl mx-auto overflow-x-hidden flex flex-col justify-between">
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
            ) : activeTab === "writing" ? (
              writingItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {writingItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/writing/editor/${item.id}`)}
                      className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-blue-400/80 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                                {item.task_type === 'WITH_GRAPH' ? 'TASK 1 • CHART' : 'TASK 2 • ESSAY'}
                              </span>
                              {item.user_status === 'DRAFT' && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-extrabold rounded-md uppercase tracking-wider">
                                  Draft
                                </span>
                              )}
                              {item.user_status === 'REVIEWED' && (
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold rounded-md uppercase tracking-wider">
                                  Reviewed
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400">
                              {item.ref_id || 'Academic'}
                            </span>
                          </div>
                        </div>

                        <button
                          aria-label="Start Writing"
                          className="w-9 h-9 rounded-full bg-purple-50 text-purple-700 group-hover:bg-[#1e50e6] group-hover:text-white flex items-center justify-center transition-colors duration-200 cursor-pointer shadow-xs"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors leading-snug line-clamp-2">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                        {item.task_description}
                      </p>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.word_count_target}+ Words</span>
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
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-700">Chưa có bài viết nào</h3>
                  <p className="text-xs text-slate-400">Hệ thống chưa tìm thấy dữ liệu bài Writing.</p>
                </div>
              )
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
                <Mic className="w-10 h-10 text-indigo-400 mx-auto" />
                <h3 className="text-base font-extrabold text-slate-800">
                  Module SPEAKING đang được hoàn thiện
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Đội ngũ phát triển đang xây dựng tính năng nhận diện giọng nói AI và chấm điểm speaking tự động.
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
        </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </AppLayout>
  )
}

export default PracticeModulesPage
