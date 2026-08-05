
import { useState } from "react";
import SignIn from "../components/login/SignIn";
import Register from "../components/login/Register";
import Forgot from "../components/login/Forgot";

const Login = () => {
  const [stage, setStage] = useState("signin");
  const UIByStage = () => {
    switch (stage) {
      case "signin":
        return <SignIn />;
      case "register":
        return <Register />
      case "forgot":
        return <Forgot />
      default:
        break;
    }
  };
  return (
    <main className="w-full h-screen flex bg-gray-50">
      <div className="w-[60vw] h-full bg-amber-100"></div>
      {UIByStage()}
    </main>
  );
};

export default Login;
