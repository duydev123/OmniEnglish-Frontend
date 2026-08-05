import { Lock, Mail } from "lucide-react";
import Hero from "../utils/Hero";

const SignIn = () => {
  return (
    <div className="w-[40vw] h-full flex flex-col items-center justify-center bg-white">
      <Hero />
      <form className="flex max-w-[30vw] flex-col gap-2 border-2 px-12 py-12 rounded-lg border-gray-200 mb-12">
        <h1 className="font-bold text-2xl">Chào mừng trở lại</h1>
        <p>Vui lòng đăng nhập vào tài khoản của bạn để tiếp tục</p>
        <label htmlFor="email">Email</label>
        <div className="flex gap-4 border border-gray-300 py-2 px-4">
          <Mail color="black" />
          <input
            className="focus:outline-0"
            id="email"
            type="text"
            placeholder="example@gmail.com"
          />
        </div>
        <label htmlFor="password">Password</label>
        <div className="flex gap-4 border border-gray-300 py-2 px-4">
          <Lock color="black" />
          <input
            className="focus:outline-0"
            id="password"
            type="password"
            placeholder="example@gmail.com"
          />
        </div>
        <button
          className="bg-blue-700 text-white py-3 rounded-lg my-4"
          type="button"
        >
          Đăng nhập
        </button>
        <p className="text-center my-4">Hoặc đăng nhập bằng</p>
        <div className="flex gap-4">
          <button
            className="flex-1 border border-gray-200 bg-gray-100 p-3 rounded-sm"
            type="button"
          >
            Google
          </button>
          <button
            className="flex-1 border border-gray-200 bg-gray-100 p-3 rounded-sm"
            type="button"
          >
            Facebook
          </button>
        </div>
        <p className="text-center my-8">
          Chưa có tài khoản?{" "}
          <button className="underline text-blue-400" type="button">
            Đăng ký ngay
          </button>
        </p>
      </form>
    </div>
  );
};

export default SignIn;
