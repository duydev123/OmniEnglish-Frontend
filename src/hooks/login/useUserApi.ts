import axiosClient from "../../configs/axios";
import type { UserData } from "../../pages/Login";
import { useUserStore } from "../../stores/user/useUserStore";

export const useUserApi = () => {
  const { setUser } = useUserStore();
  const Login = async (req: UserData) => {
    try {
      const res = await axiosClient.post("/user/login", req);
      setUser(res.data);
      localStorage.setItem("token", res.data?.token)
    } catch (error) {
      console.log(error);
    }
  };
  const Register = async (req: UserData) => {
    try {
      const res = await axiosClient.post("/user/register", req);
      setUser(res.data);
      localStorage.setItem("token", res.data?.token)
    } catch (error) {
      console.log(error);
    }
  };

  return { Login, Register };
};