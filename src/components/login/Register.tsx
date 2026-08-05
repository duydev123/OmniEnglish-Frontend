import { useUserApi } from "../../hooks/login/useUserApi";
import type { UserData } from "../../pages/Login";
import Hero from "../utils/Hero";
import { Lock, Mail, User } from "lucide-react";

const Register = ({
  data,
  setData,
  setStage,
}: {
  data: UserData;
  setData: React.Dispatch<React.SetStateAction<UserData>>;
  setStage: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const { Register } = useUserApi();
  const HandleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    Register(data);
  };
  return (
    <div className="w-[40vw] h-full flex flex-col items-center justify-center bg-white">
      <div className="w-[28vw] mb-4">
        <Hero />
      </div>
      <form
        onSubmit={(e: React.SubmitEvent) => HandleSubmit(e)}
        className="flex max-w-[30vw] flex-col gap-2 border-2 px-12 py-12 rounded-lg border-gray-200 mb-12 shadow-2xl"
      >
        <h1 className="font-bold text-2xl">Bắt đầu hành trình của bạn</h1>
        <p className="mb-8 text-gray-500">
          Tạo tài khoản miễn phí để khám phá kho tài liệu chuẩn
        </p>
        <label htmlFor="username">Họ và tên</label>
        <div className="flex gap-4 border border-gray-300 py-2 px-4">
          <User color="black" />
          <input
            className="focus:outline-0"
            id="username"
            type="text"
            placeholder="example"
            onChange={(e) =>
              setData((prev) => ({ ...prev, username: e.target.value }))
            }
            value={data.username}
          />
        </div>
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
        <label htmlFor="password">Mật khẩu</label>
        <div className="flex gap-4 border border-gray-300 py-2 px-4">
          <Lock color="black" />
          <input
            className="focus:outline-0"
            id="password"
            type="password"
            placeholder="***********"
            value={data.password}
            onChange={(e) =>
              setData((prev) => ({ ...prev, password: e.target.value }))
            }
          />
        </div>
        <p></p>
        <button
          className="bg-blue-700 text-white py-3 rounded-lg my-4 hover:bg-blue-500 hover:cursor-pointer duration-200 transition-all"
          type="submit"
        >
          Tạo tài khoản
        </button>
        <div className="flex items-center gap-4">
          <p className="border flex-1 h-0.5 border-gray-300"></p>
          <p className="text-center my-4 text-gray-500">Hoặc tiếp tục với</p>
          <p className="border flex-1 h-0.5 border-gray-300"></p>
        </div>
        <div className="flex gap-4">
          <button
            className="flex-1 border border-gray-200 bg-gray-100 p-3 rounded-sm hover:bg-gray-200 hover:cursor-pointer duration-200 transition-all"
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
        <p className="text-center my-8 text-gray-500">
          Đã có tài khoản?{" "}
          <button
            className="underline text-blue-400"
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