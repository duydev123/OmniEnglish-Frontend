
import Hero from "../utils/Hero";
import { ArrowLeft, Mail } from "lucide-react";

const Forgot = () => {
  return (
    <div className="w-[40vw] h-full flex flex-col items-center justify-center bg-white">
      <Hero />
      <form className="flex max-w-[30vw]  flex-col gap-2 border-2 px-8 py-12 rounded-lg border-gray-200 mb-12">
        <h1 className="font-bold text-2xl">Quên mật khẩu?</h1>
        <p>Nhập email liên kết với tài khoản của bạn và chúng tôi sẽ gửi cho bạn hướng dẫn để đặt lại mật khẩu</p>
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
        <button
          className="bg-blue-700 text-white py-3 rounded-lg my-4"
          type="button"
        >
          Đặt lại mật khẩu
        </button>
        <span className="border border-gray-200"></span>
        <div className="flex gap-4 items-center justify-center my-4">
            <ArrowLeft color="blue" />
                <p className=" text-blue-700">Quay lại đăng nhập</p>
        </div>  
      </form>
    </div>
  );
};

export default Forgot;
