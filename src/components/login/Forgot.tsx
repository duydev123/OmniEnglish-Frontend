import type { UserData } from "../../pages/Login";
import Hero from "../utils/Hero";
import { ArrowLeft, Mail } from "lucide-react";

const Forgot = ({
  data,
  setData,
  setStage
}: {
  data: UserData;
  setData: React.Dispatch<React.SetStateAction<UserData>>;
  setStage: React.Dispatch<React.SetStateAction<string>>;
}) => {
  return (
    <div className="w-full max-w-lg mx-auto py-8 px-6 flex flex-col items-center justify-center bg-white">
      <div className="w-full max-w-xs mb-6 flex justify-center"> 
        <Hero />
      </div>
      <form className="w-full flex flex-col gap-3 border border-slate-200/90 px-8 sm:px-10 py-9 rounded-3xl bg-white shadow-xl shadow-slate-200/50 font-sans">
        <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight">Quên mật khẩu?</h1>
        <p className="mb-4 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
          Nhập email liên kết với tài khoản của bạn và chúng tôi sẽ gửi cho bạn
          hướng dẫn để đặt lại mật khẩu.
        </p>

        <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-600 mt-1">Email</label>
        <div className="flex items-center gap-3 border border-slate-200 rounded-xl py-2.5 px-4 bg-slate-50/50 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-500/15 transition-all duration-200 group">
          <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200 shrink-0" />
          <input
            className="w-full bg-transparent focus:outline-none text-slate-800 text-sm font-medium placeholder:text-slate-400"
            id="email"
            type="text"
            placeholder="example@gmail.com"
            onChange={(e) =>
              setData((prev) => ({ ...prev, email: e.target.value }))
            }
            value={data.email}
          />
        </div>

        <button
          className="bg-gradient-to-r from-[#1e50e6] to-[#1442c7] hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl my-3 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99] duration-200 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          type="submit"
        >
          Đặt lại mật khẩu
        </button>

        <div className="border-t border-slate-200 my-1"></div>

        <div className="flex gap-2 items-center justify-center my-2">
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          <button type="button" className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors" onClick={() => setStage("signin")}>
            Quay lại đăng nhập
          </button>
        </div>
      </form>
    </div>
  );
};

export default Forgot;