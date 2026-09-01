import { useState } from "react";
import { useUserApi } from "../../hooks/login/useUserApi";
import type { UserData } from "../../types/user";
import Hero from "../utils/Hero";
import { Lock, Mail, User, Loader2 } from "lucide-react";

const Register = ({
  data,
  setData,
  setStage,
}: {
  data: UserData;
  setData: React.Dispatch<React.SetStateAction<UserData>>;
  setStage: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const { Register: registerUser, GoogleLogin, FacebookLogin } = useUserApi();
  const [loading, setLoading] = useState<"none" | "local" | "google" | "facebook">("none");

  const HandleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("local");
    try {
      await registerUser(data);
    } finally {
      setLoading("none");
    }
  };

  const handleGoogleClick = async () => {
    setLoading("google");
    try {
      await GoogleLogin();
    } finally {
      setLoading("none");
    }
  };

  const handleFacebookClick = async () => {
    setLoading("facebook");
    try {
      await FacebookLogin();
    } finally {
      setLoading("none");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto py-8 px-6 flex flex-col items-center justify-center bg-white">
      <div className="w-full max-w-xs mb-6 flex justify-center">
        <Hero />
      </div>
      <form
        onSubmit={HandleSubmit}
        className="w-full flex flex-col gap-3 border border-slate-200/90 px-8 sm:px-10 py-9 rounded-3xl bg-white shadow-xl shadow-slate-200/50 font-sans"
      >
        <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight">Bắt đầu hành trình của bạn</h1>
        <p className="mb-4 text-xs sm:text-sm text-slate-500 font-medium">
          Tạo tài khoản miễn phí để khám phá kho tài liệu chuẩn
        </p>

        <label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-600 mt-1">Họ và tên</label>
        <div className="flex items-center gap-3 border border-slate-200 rounded-xl py-2.5 px-4 bg-slate-50/50 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-500/15 transition-all duration-200 group">
          <User className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200 shrink-0" />
          <input
            className="w-full bg-transparent focus:outline-none text-slate-800 text-sm font-medium placeholder:text-slate-400"
            id="username"
            type="text"
            placeholder="Nguyen Van A"
            onChange={(e) =>
              setData((prev) => ({ ...prev, username: e.target.value }))
            }
            value={data.username}
          />
        </div>

        <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-600 mt-1">Email</label>
        <div className="flex items-center gap-3 border border-slate-200 rounded-xl py-2.5 px-4 bg-slate-50/50 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-500/15 transition-all duration-200 group">
          <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200 shrink-0" />
          <input
            className="w-full bg-transparent focus:outline-none text-slate-800 text-sm font-medium placeholder:text-slate-400"
            id="email"
            type="text"
            placeholder="example@gmail.com"
            value={data.email}
            onChange={(e) =>
              setData((prev) => ({ ...prev, email: e.target.value }))
            }
          />
        </div>

        <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-600 mt-1">Mật khẩu</label>
        <div className="flex items-center gap-3 border border-slate-200 rounded-xl py-2.5 px-4 bg-slate-50/50 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-500/15 transition-all duration-200 group">
          <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200 shrink-0" />
          <input
            className="w-full bg-transparent focus:outline-none text-slate-800 text-sm font-medium placeholder:text-slate-400"
            id="password"
            type="password"
            placeholder="***********"
            value={data.password}
            onChange={(e) =>
              setData((prev) => ({ ...prev, password: e.target.value }))
            }
          />
        </div>

        <button
          className="bg-gradient-to-r from-[#1e50e6] to-[#1442c7] hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl my-3 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99] duration-200 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
          type="submit"
          disabled={loading !== "none"}
        >
          {loading === "local" ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang tạo tài khoản...
            </>
          ) : (
            "Tạo tài khoản"
          )}
        </button>

        <div className="flex items-center gap-4 my-2">
          <p className="border-t flex-1 border-slate-200"></p>
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Hoặc tiếp tục với</p>
          <p className="border-t flex-1 border-slate-200"></p>
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 border border-slate-200 bg-slate-50/80 p-3 rounded-xl hover:bg-slate-100 hover:border-slate-300 hover:scale-[1.01] active:scale-[0.98] duration-200 transition-all font-semibold text-slate-700 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-50"
            type="button"
            disabled={loading !== "none"}
            onClick={handleGoogleClick}
          >
            {loading === "google" ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Google</span>
          </button>

          <button
            className="flex-1 border border-slate-200 bg-slate-50/80 p-3 rounded-xl hover:bg-slate-100 hover:border-slate-300 hover:scale-[1.01] active:scale-[0.98] duration-200 transition-all font-semibold text-slate-700 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-50"
            type="button"
            disabled={loading !== "none"}
            onClick={handleFacebookClick}
          >
            {loading === "facebook" ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            )}
            <span>Facebook</span>
          </button>
        </div>

        <p className="text-center text-xs sm:text-sm text-slate-500 font-medium my-4">
          Đã có tài khoản?{" "}
          <button
            className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
            type="button"
            onClick={() => setStage("signin")}
          >
            Đăng nhập ngay
          </button>
        </p>
      </form>
    </div>
  );
};

export default Register;