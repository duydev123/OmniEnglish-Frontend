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
    <div className="w-[40vw] h-full flex flex-col items-center justify-center bg-white">
        <div className="w-[28vw] mb-4"> 
        <Hero />
      </div>
      <form className="flex max-w-[30vw]  flex-col gap-2 border-2 px-8 py-12 rounded-lg border-gray-200 mb-12 shadow-2xl">
        <h1 className="font-bold text-2xl">Quên mật khẩu?</h1>
        <p className="mb-8 text-gray-500">
          Nhập email liên kết với tài khoản của bạn và chúng tôi sẽ gửi cho bạn
          hướng dẫn để đặt lại mật khẩu
        </p>
        <label htmlFor="email">Email</label>
        <div className="flex gap-4 border border-gray-300 py-2 px-4">
          <Mail color="black" />
          <input
            className="focus:outline-0"
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
          className="bg-blue-700 text-white py-3 rounded-lg my-4 hover:bg-blue-500 hover:cursor-pointer duration-200 transition-all  "
          type="submit"
        >
          Đặt lại mật khẩu
        </button>
        <span className="border border-gray-200"></span>
        <div className="flex gap-2 items-center justify-center my-4">
          <ArrowLeft color="blue" />
          <button type="button" className=" text-blue-700 hover:underline hover:cursor-pointer" onClick={() => setStage("signin")} >Quay lại đăng nhập</button>
        </div>
      </form>
    </div>
  );
};

export default Forgot;