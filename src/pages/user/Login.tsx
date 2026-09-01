import { useState } from "react";
import SignIn from "../../components/login/SignIn";
import Register from "../../components/login/Register";
import Forgot from "../../components/login/Forgot";
import towerBridge from "../../assets/towerBridge.png";
import { Sparkles, ShieldCheck, Zap } from "lucide-react";

import type { UserData } from "../../types/user";

const getStageText = (stage: string) => {
  switch (stage) {
    case "signin":
      return {
        badge: "Nền tảng học tiếng Anh thông minh",
        title: "Chinh phục tiếng Anh thông minh và hiệu quả cùng omniEnglish.",
        description:
          "Khám phá kho từ vựng chuẩn, bài luyện tập cá nhân hóa và hệ thống theo dõi tiến độ thông minh hàng ngày.",
        card1Title: "Bảo mật tối đa",
        card1Desc: "Xác thực hai lớp an toàn.",
        card2Title: "Xử lý nhanh chóng",
        card2Desc: "Nhận phản hồi ngay lập tức.",
      };
    case "register":
      return {
        badge: "Khởi đầu hành trình mới",
        title: "Bắt đầu hành trình nâng tầm tiếng Anh của bạn ngay hôm nay.",
        description:
          "Tạo tài khoản miễn phí để tiếp cận kho tài liệu chuẩn Oxford, bài tập cá nhân hóa và công nghệ AI luyện phát âm.",
        card1Title: "Kho từ vựng chuẩn",
        card1Desc: "Phân loại theo chuẩn CEFR.",
        card2Title: "Luyện tập AI",
        card2Desc: "Phản hồi phát âm tức thì.",
      };
    case "forgot":
      return {
        badge: "Khôi phục tài khoản",
        title: "Lấy lại quyền truy cập vào hành trình ngôn ngữ của bạn.",
        description:
          "Đừng lo lắng, việc quên mật khẩu xảy ra với tất cả chúng ta. Chúng tôi sẽ giúp bạn quay lại học tập chỉ trong vài phút.",
        card1Title: "Bảo mật tối đa",
        card1Desc: "Xác thực hai lớp an toàn.",
        card2Title: "Xử lý nhanh chóng",
        card2Desc: "Nhận liên kết khôi phục ngay.",
      };
    default:
      return {
        badge: "Nền tảng học tiếng Anh thông minh",
        title: "Chinh phục tiếng Anh cùng omniEnglish",
        description: "Luyện tập từ vựng, phát âm và ngữ pháp chuẩn quốc tế.",
        card1Title: "Bảo mật tối đa",
        card1Desc: "Bảo vệ thông tin cá nhân.",
        card2Title: "Học tập hiệu quả",
        card2Desc: "Cá nhân hóa lộ trình.",
      };
  }
};

const Login = () => {
  const [stage, setStage] = useState("signin");
  const [data, setData] = useState<UserData>({
    username: "",
    email: "",
    password: "",
  });

  const stageText = getStageText(stage);

  const UIByStage = () => {
    switch (stage) {
      case "signin":
        return <SignIn data={data} setData={setData} setStage={setStage} />;
      case "register":
        return <Register data={data} setData={setData} setStage={setStage} />;
      case "forgot":
        return <Forgot data={data} setData={setData} setStage={setStage} />;
      default:
        return <SignIn data={data} setData={setData} setStage={setStage} />;
    }
  };

  return (
    <main className="w-full h-screen flex bg-slate-50 overflow-hidden font-sans antialiased">
      {/* Left Panel: London Tower Bridge Image + Blue Overlay + Text Content */}
      <div className="hidden lg:flex lg:w-[48vw] xl:w-[52vw] h-full relative overflow-hidden shrink-0 select-none group">
        {/* Background Image */}
        <img
          src={towerBridge}
          alt="London Tower Bridge"
          className="absolute inset-0 w-full h-full object-cover object-center transform group-hover:scale-110 transition-transform duration-1000 ease-out"
        />

        {/* Gradient & Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#091b48]/95 via-[#1e50e6]/80 to-[#0b1b46]/75 backdrop-blur-[1px]" />

        {/* Floating Ambient Glow */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 w-full h-full p-10 xl:p-14 flex flex-col justify-between text-white">
          {/* Top Badge */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-bold text-white shadow-md transition-all duration-300 hover:bg-white/25 hover:scale-105 cursor-default">
              <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>{stageText.badge}</span>
            </div>
          </div>

          {/* Middle Typography with Fade Animation */}
          <div key={stage} className="space-y-4 max-w-xl my-auto animate-fade-in">
            <h1 className="text-3xl xl:text-4xl font-black tracking-tight leading-snug text-white drop-shadow-md">
              {stageText.title}
            </h1>
            <p className="text-sm xl:text-base text-blue-100/90 leading-relaxed font-medium max-w-lg">
              {stageText.description}
            </p>
          </div>

          {/* Bottom Glassmorphism Feature Cards */}
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:-translate-y-1 hover:shadow-2xl">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3 transition-transform duration-300 hover:scale-110">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
              </div>
              <h4 className="text-xs font-bold text-white">
                {stageText.card1Title}
              </h4>
              <p className="text-[11px] text-blue-100/80 leading-snug mt-0.5">
                {stageText.card1Desc}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:-translate-y-1 hover:shadow-2xl">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3 transition-transform duration-300 hover:scale-110">
                <Zap className="w-5 h-5 text-amber-300 fill-current" />
              </div>
              <h4 className="text-xs font-bold text-white">
                {stageText.card2Title}
              </h4>
              <p className="text-[11px] text-blue-100/80 leading-snug mt-0.5">
                {stageText.card2Desc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Form Component Container */}
      <div key={stage} className="flex-1 h-full overflow-y-auto flex items-center justify-center bg-white animate-fade-in">
        {UIByStage()}
      </div>
    </main>
  );
};

export default Login;