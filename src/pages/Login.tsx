
import { useState } from "react";
import SignIn from "../components/login/SignIn";
import Register from "../components/login/Register";
import Forgot from "../components/login/Forgot";
import sideImage from '../assets/loginSide.jpg'

export interface UserData {
  username: string,
  email: string,
  password: string,
}

const Login = () => {
  const [stage, setStage] = useState("signin");
  const [data, setData] = useState<UserData>({
    username: "",
    email: "",
    password: ""
  })

  const UIByStage = () => {
    switch (stage) {
      case "signin":
        return <SignIn data={data} setData={setData} setStage={setStage}/>;
      case "register":
        return <Register data={data} setData={setData} setStage={setStage}/>
      case "forgot":
        return <Forgot data={data} setData={setData} setStage={setStage}/>
      default:
        break;
    }
  };
  return (
    <main className="w-full h-screen flex bg-gray-50">
      <div className="w-[60vw] h-full bg-amber-100">
        <img src={sideImage} alt="loginSide" className="w-full h-full object-cover" />
      </div>
      {UIByStage()}
    </main>
  );
};

export default Login;
