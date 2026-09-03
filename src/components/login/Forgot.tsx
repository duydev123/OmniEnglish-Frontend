import { useState, useEffect, useRef } from "react";
import type { UserData } from "../../types/user";
import Hero from "../utils/Hero";
import { ArrowLeft, Mail, Lock, KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { userApi } from "../../services/userApi";
import { useToast } from "../common/Toast";

export const Forgot = ({
  data,
  setData,
  setStage
}: {
  data: UserData;
  setData: React.Dispatch<React.SetStateAction<UserData>>;
  setStage: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown for OTP resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Focus first OTP box when entering Step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // Step 1: Send OTP to email
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.email || !data.email.includes("@")) {
      showToast("Vui lòng nhập địa chỉ email hợp lệ!", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await userApi.sendForgotOTP(data.email);
      showToast(res.message || "Mã OTP đã được gửi tới email của bạn!", "success");
      setStep(2);
      setResendTimer(60);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || "Không thể gửi mã OTP. Vui lòng kiểm tra lại email!";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // OTP Digits input handler
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpDigits];
    newOtp[index] = value.slice(-1);
    setOtpDigits(newOtp);

    // Auto advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split("");
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
    }
  };

  // Step 2: Reset password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpDigits.join("");
    if (otpCode.length !== 6) {
      showToast("Vui lòng nhập đủ 6 chữ số mã OTP!", "error");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showToast("Mật khẩu mới phải có ít nhất 6 ký tự!", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Mật khẩu mới và xác nhận mật khẩu không khớp!", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await userApi.resetPasswordWithOTP(data.email, otpCode, newPassword);
      showToast(res.message || "Đặt lại mật khẩu thành công!", "success");
      setStage("signin");
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || "Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại OTP!";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto py-8 px-6 flex flex-col items-center justify-center bg-white">
      <div className="w-full max-w-xs mb-6 flex justify-center">
        <Hero />
      </div>

      {step === 1 ? (
        // STEP 1: Enter Email
        <form
          onSubmit={handleSendOTP}
          className="w-full flex flex-col gap-3 border border-slate-400/60 shadow-glow-4side px-8 sm:px-10 py-9 rounded-3xl bg-white shadow-xl shadow-slate-200/50 font-sans animate-fade-in"
        >
          <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight">Quên mật khẩu?</h1>
          <p className="mb-4 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Nhập email liên kết với tài khoản của bạn và chúng tôi sẽ gửi cho bạn mã OTP xác thực để đặt lại mật khẩu.
          </p>

          <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-600 mt-1">
            Email tài khoản
          </label>
          <div className="flex items-center gap-3 border border-slate-200 rounded-xl py-2.5 px-4 bg-slate-50/50 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-500/15 transition-all duration-200 group">
            <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200 shrink-0" />
            <input
              className="w-full bg-transparent focus:outline-none text-slate-800 text-sm font-medium placeholder:text-slate-400"
              id="email"
              type="email"
              required
              placeholder="example@gmail.com"
              onChange={(e) => setData((prev) => ({ ...prev, email: e.target.value }))}
              value={data.email}
            />
          </div>

          <button
            className="bg-gradient-to-r from-[#1e50e6] to-[#1442c7] hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl my-3 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99] duration-200 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang gửi OTP...
              </>
            ) : (
              "Gửi mã OTP xác nhận"
            )}
          </button>

          <div className="border-t border-slate-200 my-1" />

          <div className="flex gap-2 items-center justify-center my-2">
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <button
              type="button"
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
              onClick={() => setStage("signin")}
            >
              Quay lại đăng nhập
            </button>
          </div>
        </form>
      ) : (
        // STEP 2: Input 6-digit OTP & New Password
        <form
          onSubmit={handleResetPassword}
          className="w-full flex flex-col gap-3 border border-slate-400/60 shadow-glow-4side px-8 sm:px-10 py-9 rounded-3xl bg-white shadow-xl shadow-slate-200/50 font-sans animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight">Xác thực OTP</h1>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Step 2/2
            </span>
          </div>

          <p className="mb-2 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Mã OTP 6 số đã được gửi tới <strong className="text-slate-800">{data.email}</strong>. Vui lòng kiểm tra hộp thư của bạn.
          </p>

          {/* 6 OTP Boxes */}
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mt-2">
            Mã xác thực OTP (6 chữ số)
          </label>
          <div className="flex items-center justify-between gap-2 my-1">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                onPaste={handleOtpPaste}
                className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-3 focus:ring-blue-500/15 transition-all duration-150 outline-none"
              />
            ))}
          </div>

          {/* Resend Timer Button */}
          <div className="text-right text-xs font-bold text-slate-500 mb-2">
            {resendTimer > 0 ? (
              <span className="text-slate-400 font-medium">Gửi lại mã sau {resendTimer}s</span>
            ) : (
              <button
                type="button"
                onClick={handleSendOTP}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                Gửi lại mã OTP
              </button>
            )}
          </div>

          {/* New Password */}
          <label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Mật khẩu mới
          </label>
          <div className="flex items-center gap-3 border border-slate-200 rounded-xl py-2.5 px-4 bg-slate-50/50 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-500/15 transition-all duration-200 group">
            <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200 shrink-0" />
            <input
              className="w-full bg-transparent focus:outline-none text-slate-800 text-sm font-medium placeholder:text-slate-400"
              id="newPassword"
              type="password"
              required
              placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          {/* Confirm New Password */}
          <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-slate-600 mt-1">
            Xác nhận mật khẩu mới
          </label>
          <div className="flex items-center gap-3 border border-slate-200 rounded-xl py-2.5 px-4 bg-slate-50/50 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-500/15 transition-all duration-200 group">
            <KeyRound className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200 shrink-0" />
            <input
              className="w-full bg-transparent focus:outline-none text-slate-800 text-sm font-medium placeholder:text-slate-400"
              id="confirmPassword"
              type="password"
              required
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            className="bg-gradient-to-r from-[#1e50e6] to-[#1442c7] hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl my-3 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99] duration-200 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang đặt lại mật khẩu...
              </>
            ) : (
              "Xác nhận & Đặt lại mật khẩu"
            )}
          </button>

          <div className="border-t border-slate-200 my-1" />

          <div className="flex items-center justify-between my-1">
            <button
              type="button"
              className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
              onClick={() => setStep(1)}
            >
              ← Thay đổi email
            </button>
            <button
              type="button"
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              onClick={() => setStage("signin")}
            >
              Đăng nhập
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Forgot;