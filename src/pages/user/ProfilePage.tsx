// ProfilePage.tsx - Đã sửa

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore, initialUser } from "../../stores/user/useUserStore";
import { userApi } from "../../services/userApi";
import { clearLocalVocabCache } from "../../services/vocabularyApi";
import { useToast } from "../../components/common/Toast";
import { getApiErrorMessage } from "../../utils/error";
import { LogoutModal } from "../../components/common/LogoutModal";
import { AppLayout } from "../../components/common/AppLayout";
import {
  Bell,
  BookOpen,
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
  LogOut,
  X,
  Loader2,
  Check
} from "lucide-react";

const ProfilePage = () => {
  const [selectedGoal, setSelectedGoal] = useState<"fluency" | "steady">("fluency");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Avatar & Password Modal States
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { user, setUser } = useUserStore();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token && !user?.token && !user?.username) {
        navigate("/login");
        return;
      }
      try {
        const data = await userApi.getUserProfile();
        if (data && data.username) {
          setUser(data);
          if (data.settings?.learning_mode === "Fluency Push") {
            setSelectedGoal("fluency");
          } else if (data.settings?.learning_mode === "Steady Growth") {
            setSelectedGoal("steady");
          }
        }
      } catch (err) {
        console.warn("Could not fetch user profile:", err);
      }
    };
    fetchUserData();
  }, [navigate, setUser, user?.token, user?.username]);

  const handleSelectGoal = async (mode: "Fluency Push" | "Steady Growth") => {
    const goalKey = mode === "Fluency Push" ? "fluency" : "steady";
    setSelectedGoal(goalKey);
    try {
      const updatedUser = await userApi.updateProfile({ learning_mode: mode });
      setUser(updatedUser);
      showToast(`Đã đổi mục tiêu học tập thành ${mode}!`, "success");
    } catch (err: any) {
      showToast(getApiErrorMessage(err, "Không thể lưu mục tiêu học tập!"), "error");
    }
  };

  const username = user?.username || "";
  const email = user?.email || "";
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1e50e6&color=fff&size=128`;
  const avatarUrl = user?.avatar || user?.avarta || defaultAvatar;

  const presetAvatars = [
    `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1e50e6&color=fff&size=200`,
    `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=059669&color=fff&size=200`,
    `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=7c3aed&color=fff&size=200`,
    `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=ea580c&color=fff&size=200`,
    `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80`,
    `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80`,
    `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80`,
    `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80`
  ];

  const handleSaveAvatar = async () => {
    if (!selectedAvatarUrl) return;
    setAvatarLoading(true);
    try {
      const updatedUser = await userApi.updateProfile({ avatar: selectedAvatarUrl });
      setUser(updatedUser);
      showToast("Đã cập nhật ảnh đại diện thành công!", "success");
      setShowAvatarModal(false);
    } catch (err: any) {
      showToast(getApiErrorMessage(err, "Không thể cập nhật ảnh đại diện!"), "error");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Mật khẩu mới và xác nhận mật khẩu không khớp!", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Mật khẩu mới phải có ít nhất 6 ký tự!", "error");
      return;
    }
    setPasswordLoading(true);
    try {
      await userApi.changePassword(oldPassword, newPassword);
      showToast("Đổi mật khẩu thành công!", "success");
      setShowPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showToast(getApiErrorMessage(err, "Đổi mật khẩu thất bại!"), "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  const streakDays = user?.stats?.current_streak_days ?? 0;
  const totalWords = user?.stats?.total_words_learned ?? 0;
  const dailyWordTarget = user?.settings?.daily_word_target ?? 30;
  const baseLanguage = user?.settings?.base_language || "Vietnamese (Tiếng Việt)";

  const readingPct = user?.stats?.reading_progress_pct ?? 0;
  const listeningPct = user?.stats?.listening_progress_pct ?? 0;
  const speakingPct = user?.stats?.speaking_progress_pct ?? 0;
  const writingPct = user?.stats?.writing_progress_pct ?? 0;
  const overallPracticePct = Math.round((readingPct + listeningPct + speakingPct + writingPct) / 4);

  const proficiencyLevel = user?.proficiency_level || user?.stats?.general_english_level || "A1";

  const vocabProgressPercent = totalWords > 0 ? Math.min(100, Math.round((totalWords / 1000) * 100)) : 0;

  const rawReading = user?.stats?.avg_reading_score ?? 0;
  const rawListening = user?.stats?.avg_listening_score ?? 0;
  const rawSpeaking = user?.stats?.avg_speaking_score ?? 0;
  const rawWriting = user?.stats?.avg_writing_score ?? 0;
  const avgBandScoreNum = (rawReading + rawListening + rawSpeaking + rawWriting) / 4;
  const overallBandVal = user?.stats?.avg_band_score ?? user?.stats?.overall_score;
  const overallBand = overallBandVal != null && overallBandVal > 0
    ? Number(overallBandVal).toFixed(1)
    : (avgBandScoreNum > 0 ? avgBandScoreNum.toFixed(1) : "0.0");
  const generalEnglishPercent = avgBandScoreNum > 0
    ? Math.min(100, Math.round((avgBandScoreNum / 9.0) * 100))
    : 0;

  const cefrLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];

  const handleLogout = () => {
    localStorage.removeItem("token");
    clearLocalVocabCache();
    setUser(initialUser);
    showToast("Đã đăng xuất tài khoản!", "info");
    navigate("/login");
  };

  return (
    <AppLayout breadcrumbs={[{ label: "Hồ sơ cá nhân", href: "/profile" }]}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-7 max-w-7xl mx-auto overflow-x-hidden flex flex-col justify-between">
        <div className="space-y-7">
          {/* Header Title & Description */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Trang Cá Nhân
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1.5 leading-relaxed font-normal">
              Quản lý thông tin cá nhân, theo dõi lộ trình học tiếng Anh và thiết lập mục tiêu cá nhân hóa.
            </p>
          </div>

          {/* Top Grid: User Info Card + Stats & Proficiency */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Profile Card */}
            <div className="lg:col-span-4 bg-white border border-slate-400/60 rounded-2xl p-6 shadow-glow-4side hover:shadow-glow-4side-lg hover:border-blue-400/80 transition-all duration-300 flex flex-col items-center text-center justify-between h-full">
              <div className="w-full flex flex-col items-center">
                <div className="relative mb-3 group">
                  <img
                    src={avatarUrl}
                    alt={`${username} Avatar`}
                    className="w-24 h-24 rounded-2xl object-cover ring-4 ring-slate-100 shadow-soft-4side group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={() => {
                      setSelectedAvatarUrl(avatarUrl);
                      setShowAvatarModal(true);
                    }}
                    aria-label="Upload Photo"
                    title="Đổi ảnh đại diện"
                    className="absolute -bottom-1 -right-1 bg-[#1e50e6] hover:bg-blue-700 text-white p-2 rounded-xl border-2 border-white shadow-soft-4side transition active:scale-95 cursor-pointer"
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

                <div className="w-full flex items-center justify-between px-1 text-left">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      NGÀY THAM GIA
                    </span>
                    <span className="text-sm font-extrabold text-slate-800">
                      {user?.created_at || "Tháng 8/2024"}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      CHUỖI NGÀY HỌC
                    </span>
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-sm font-extrabold text-slate-800">
                        {streakDays} Ngày
                      </span>
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Đổi Mật Khẩu</span>
                </button>

                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng Xuất</span>
                </button>
              </div>
            </div>

            {/* Right Column: Stats Cards + CEFR Level */}
            <div className="lg:col-span-8 flex flex-col justify-between space-y-6 h-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* English Vocabulary Card */}
                <div
                  onClick={() => navigate('/vocabulary')}
                  className="bg-white border border-slate-400/60 rounded-2xl p-5 shadow-glow-4side hover:shadow-glow-4side-lg hover:border-blue-400 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
                  title="Nhấp để đến trang Từ Vựng"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full text-blue-700 bg-blue-50 border border-blue-100">
                      Từ Vựng
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      TỪ VỰNG TÍCH LŨY
                    </span>
                    <div className="flex items-baseline gap-1.5 mb-3">
                      <span className="text-2xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {totalWords.toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        từ đã thuộc
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#1e50e6] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(3, vocabProgressPercent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 4-Skill Practice Progress Card */}
                <div
                  onClick={() => navigate('/practice-modules')}
                  className="bg-white border border-slate-400/60 rounded-2xl p-5 shadow-glow-4side hover:shadow-glow-4side-lg hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
                  title="Nhấp để đến trang Luyện Tập 4 Kỹ Năng"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full text-emerald-700 bg-emerald-50 border border-emerald-100">
                      4 Kỹ Năng IELTS
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      TIẾN ĐỘ LUYỆN TẬP TỔNG THỂ
                    </span>
                    <div className="flex items-baseline gap-1.5 mb-3">
                      <span className="text-2xl font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        {overallPracticePct}%
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        kho bài tập đã hoàn thành
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(3, overallPracticePct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* English Proficiency Level Box */}
              <div className="bg-white border border-slate-400/60 rounded-2xl p-6 shadow-glow-4side hover:shadow-glow-4side-lg hover:border-blue-300 transition-all duration-300 flex flex-col justify-between space-y-4 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">
                    Trình Độ Tiếng Anh (CEFR)
                  </h3>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {cefrLevels.map((lvl) => {
                      const isActive = proficiencyLevel.toUpperCase() === lvl;
                      return (
                        <span
                          key={lvl}
                          className={`w-7 h-7 rounded-full text-xs flex items-center justify-center transition-all duration-200 cursor-pointer ${isActive
                            ? "bg-[#1e50e6] text-white font-black shadow-soft-4side ring-2 ring-blue-400/50 scale-105"
                            : "bg-slate-100 text-slate-400 font-semibold hover:bg-slate-200"
                            }`}
                        >
                          {lvl}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Overall Band Row */}
                <div className="flex items-center justify-between py-2 px-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
                  <span className="text-xs font-bold text-slate-800">
                    Overall Band
                  </span>
                  <span className="text-sm font-black text-[#1e50e6]">
                    {overallBand} <span className="text-xs font-bold text-slate-400">/ 9.0</span>
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800">
                      Tiếng Anh Tổng Quát (CEFR)
                    </span>
                    <span className="text-xs font-extrabold text-blue-600">
                      Cấp độ {proficiencyLevel} • {generalEnglishPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#1e50e6] h-full rounded-full transition-all duration-500 shadow-xs"
                      style={{ width: `${generalEnglishPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Learning Goals + Account Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Learning Goals */}
            <div className="lg:col-span-6 bg-white border border-slate-400/60 rounded-2xl p-6 shadow-glow-4side hover:shadow-glow-4side-lg hover:border-amber-300 transition-all duration-300 h-full flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Mục Tiêu Học Tập
                  </h3>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    CHỈ TIÊU TỪ VỰNG HÀNG NGÀY
                  </span>
                  <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    {dailyWordTarget} từ/ngày
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 pb-1">
                  <div
                    onClick={() => handleSelectGoal("Fluency Push")}
                    className={`rounded-2xl p-6 border-2 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center ${selectedGoal === "fluency"
                      ? "border-[#1e50e6] bg-blue-50/40 shadow-soft-4side scale-[1.02]"
                      : "border-slate-200/70 bg-white hover:border-slate-300"
                      }`}
                  >
                    <Zap className={`w-5 h-5 mb-2 ${selectedGoal === "fluency" ? "text-blue-600 fill-current" : "text-slate-400"}`} />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                      Học Tốc Độ (Fluency)
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-400 mt-1">
                      45 phút/ngày
                    </span>
                  </div>

                  <div
                    onClick={() => handleSelectGoal("Steady Growth")}
                    className={`rounded-2xl p-6 border-2 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center ${selectedGoal === "steady"
                      ? "border-[#1e50e6] bg-blue-50/40 shadow-soft-4side scale-[1.02]"
                      : "border-slate-200/70 bg-white hover:border-slate-300"
                      }`}
                  >
                    <Leaf className={`w-5 h-5 mb-2 ${selectedGoal === "steady" ? "text-blue-600 fill-current" : "text-slate-400"}`} />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                      Học Bền Bỉ (Steady)
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-400 mt-1">
                      15 phút/ngày
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="lg:col-span-6 bg-white border border-slate-400/60 rounded-2xl p-6 shadow-glow-4side hover:shadow-glow-4side-lg hover:border-blue-300 transition-all duration-300 h-full flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Cài Đặt Tài Khoản
                  </h3>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-xl transition cursor-pointer border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                          Thông Báo
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Thông báo Email & Ứng dụng đã bật
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-xl transition cursor-pointer border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                          Ngôn Ngữ Giao Diện
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Hiện tại: {baseLanguage}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="pt-2">
                  <button className="w-full bg-[#1e50e6] hover:bg-blue-700 text-white font-bold text-sm py-3.5 px-4 rounded-xl shadow-md shadow-blue-500/20 transition active:scale-98 cursor-pointer">
                    Lưu Tất Cả Thay Đổi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-12 pb-4 border-t border-slate-200/60 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © 2024 Hệ thống Ngôn ngữ OmniEnglish. Tất cả các quyền được bảo lưu.
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-600 transition">
              Chính sách bảo mật
            </a>
            <a href="#" className="hover:text-slate-600 transition">
              Điều khoản dịch vụ
            </a>
            <a href="#" className="hover:text-slate-600 transition">
              Hỗ trợ
            </a>
          </div>
        </footer>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />

      {/* Avatar Picker Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-400/60 rounded-3xl p-6 max-w-md w-full shadow-glow-4side-lg space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#1e50e6]" />
                <h3 className="text-base font-extrabold text-slate-900">Chọn Ảnh Đại Diện</h3>
              </div>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-semibold text-slate-500 block">Chọn từ kho avatar mẫu:</span>
              <div className="grid grid-cols-4 gap-3">
                {presetAvatars.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedAvatarUrl(url)}
                    className={`relative rounded-2xl overflow-hidden ring-2 transition p-0.5 cursor-pointer ${selectedAvatarUrl === url ? "ring-[#1e50e6] scale-105 shadow-md" : "ring-transparent hover:ring-slate-300"
                      }`}
                  >
                    <img src={url} alt={`Preset ${idx}`} className="w-full h-16 rounded-xl object-cover" />
                    {selectedAvatarUrl === url && (
                      <div className="absolute inset-0 bg-[#1e50e6]/30 flex items-center justify-center rounded-xl">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Hoặc dán URL ảnh tùy chọn:</label>
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={selectedAvatarUrl}
                  onChange={(e) => setSelectedAvatarUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#1e50e6]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveAvatar}
                disabled={avatarLoading || !selectedAvatarUrl}
                className="px-5 py-2 text-xs font-bold text-white bg-[#1e50e6] hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                {avatarLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Lưu Avatar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <form
            onSubmit={handleChangePassword}
            className="bg-white border border-slate-400/60 rounded-3xl p-6 max-w-md w-full shadow-glow-4side-lg space-y-5 relative"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#1e50e6]" />
                <h3 className="text-base font-extrabold text-slate-900">Đổi Mật Khẩu</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu hiện tại"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#1e50e6]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mật khẩu mới (Tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#1e50e6]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#1e50e6]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-[#1e50e6] hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                {passwordLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác Nhận Đổi Mật Khẩu</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
};

export default ProfilePage;