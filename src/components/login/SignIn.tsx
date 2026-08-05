import { Lock, Mail } from "lucide-react";
import Hero from "../utils/Hero";
import type { UserData } from "../../pages/Login";
import { useUserApi } from "../../hooks/login/useUserApi";

const SignIn = ({
  data,
  setData,
  setStage
}: {
  data: UserData;
  setData: React.Dispatch<React.SetStateAction<UserData>>;
  setStage: React.Dispatch<React.SetStateAction<string>>
}) => {
  const { Login } = useUserApi();
  const HandleSubmit = (e: React.SubmitEvent) =>  { e.preventDefault(); Login(data)} 
  return (
    <div className="w-[40vw] h-full flex flex-col items-center justify-center bg-white">
      <div className="w-[28vw] mb-4"> 
        <Hero />
      </div>
      <form onSubmit={(e: React.SubmitEvent) => HandleSubmit(e)} className="flex max-w-[30vw] flex-col gap-2 border-2 px-12 py-12 rounded-lg border-gray-200 mb-12 shadow-2xl">
        <h1 className="font-bold text-2xl">Chào mừng trở lại</h1>
        <p className="mb-8 text-gray-500">Vui lòng đăng nhập vào tài khoản của bạn để tiếp tục</p>
        <label htmlFor="email">Email</label>
        <div className="flex gap-4 border border-gray-300 py-2 px-4">
          <Mail color="black" />
          <input
            className="focus:outline-0"
            id="email"
            type="text"
            placeholder="example@gmail.com"
            value={data.email}
            onChange={(e) =>
              setData((prev) => ({ ...prev, email: e.target.value }))
            }
          />
        </div>
        <div className="flex justify-between">
          <label htmlFor="password" >Mật khẩu</label>
          <button type="button" className="text-blue-700 hover:underline hover:cursor-pointer" onClick={() => setStage("forgot")}>Quên mật khẩu</button>
        </div>
        <div className="flex gap-4 border border-gray-300 py-2 px-4">
          <Lock color="black" />
          <input
            className="focus:outline-0"
            id="password"
            type="password"
            placeholder="*********"
            onChange={(e) =>
              setData((prev) => ({ ...prev, password: e.target.value }))
            }
            value={data.password}
          />
        </div>
        <button
          className="bg-blue-700 text-white py-3 rounded-lg my-4 hover:bg-blue-500 hover:cursor-pointer duration-200 transition-all"
          type="submit"
        >
          Đăng nhập
        </button>
        <div className="flex items-center gap-4">
          <p className="border flex-1 h-0.5 border-gray-300"></p>
          <p className="text-center my-4 text-gray-500">Hoặc đăng nhập bằng</p>
          <p className="border flex-1 h-0.5 border-gray-300"></p>
        </div>
        <div className="flex gap-4">
          <button
            className="flex-1 border border-gray-200 bg-gray-100 p-3 rounded-sm  hover:bg-gray-200 hover:cursor-pointer duration-200 transition-all"
            type="button"
          >
            Google
          </button>
          <button
            className="flex-1 border border-gray-200 bg-gray-100 p-3 rounded-sm hover:bg-gray-200 hover:cursor-pointer duration-200 transition-all"
            type="button"
          >
            Facebook
          </button>
        </div>
        <p className="text-center text-gray-500 my-8">
          Chưa có tài khoản?{" "}
          <button className="underline text-blue-700 hover:cursor-pointer " type="button" onClick={() => setStage("register")}>
            Đăng ký ngay
          </button>
        </p>
      </form>
    </div>
  );
};

export default SignIn;
