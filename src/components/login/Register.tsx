
import Hero from '../utils/Hero'
import { Lock, Mail, User } from 'lucide-react'

const Register = () => {
  return (
    <div className="w-[40vw] h-full flex flex-col items-center justify-center bg-white">
      <Hero />
      <form className="flex flex-col gap-2 border-2 px-12 py-12 rounded-lg border-gray-200 mb-12">
        <h1 className="font-bold text-2xl">Bắt đầu hành trình của bạn</h1>
        <p>Tạo tài khoản miễn phí để khám phá kho tài liệu chuẩn</p>
        <label htmlFor="username">Họ và tên</label>
        <div className="flex gap-4 border border-gray-300 py-2 px-4">
          <User color="black" />
          <input
            className="focus:outline-0"
            id="username"
            type="text"
            placeholder="example"
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
          />
        </div>
        <label htmlFor="password">Password</label>
        <div className="flex gap-4 border border-gray-300 py-2 px-4">
          <Lock color="black" />
          <input
            className="focus:outline-0"
            id="password"
            type="password"
            placeholder="***********"
          />
        </div>
        <p></p>
        <button
          className="bg-blue-700 text-white py-3 rounded-lg my-4"
          type="button"
        >
          Tạo tài khoản
        </button>
        <p className="text-center my-4">Hoặc tiếp tục với</p>
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
          Đã có tài khoản?{" "}
          <button className="underline text-blue-400" type="button">
            Đăng nhập ngay
          </button>
        </p>
      </form>
    </div>
  )
}

export default Register