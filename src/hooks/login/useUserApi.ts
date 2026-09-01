import { useNavigate } from "react-router-dom";
import type { UserData } from "../../types/user";
import { userApi, type SocialLoginPayload } from "../../services/userApi";
import { useUserStore } from "../../stores/user/useUserStore";
import { useToast } from "../../components/common/Toast";

declare global {
  interface Window {
    google?: any;
    FB?: any;
  }
}

export const useUserApi = () => {
  const { setUser } = useUserStore();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const Login = async (req: UserData) => {
    try {
      const user = await userApi.login({ email: req.email, password: req.password });
      if (user?.status?.toLowerCase() === "blocked" || user?.status?.toLowerCase() === "inactive") {
        showToast("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên!", "error");
        return;
      }
      setUser(user);
      if (user?.token) {
        localStorage.setItem("token", user.token);
      }
      showToast("Đăng nhập thành công!", "success");
      navigate("/");
      return user;
    } catch (error: any) {
      console.error("Login error:", error);
      const message = error.response?.data?.detail || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!";
      showToast(message, "error");
    }
  };

  const Register = async (req: UserData) => {
    try {
      const user = await userApi.register({
        username: req.username,
        email: req.email,
        password: req.password,
      });
      setUser(user);
      if (user?.token) {
        localStorage.setItem("token", user.token);
      }
      showToast("Tạo tài khoản thành công!", "success");
      navigate("/");
      return user;
    } catch (error: any) {
      console.error("Register error:", error);
      const message = error.response?.data?.detail || "Đăng ký thất bại. Vui lòng kiểm tra lại!";
      showToast(message, "error");
    }
  };

  const GoogleLogin = async (overridePayload?: Partial<SocialLoginPayload>) => {
    try {
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      // Direct payload case (for testing / manual trigger)
      if (overridePayload?.email && overridePayload?.token) {
        const data: SocialLoginPayload = {
          provider: "google",
          email: overridePayload.email,
          name: overridePayload.name || "Google User",
          avatar: overridePayload.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
          token: overridePayload.token,
        };
        const user = await userApi.googleLogin(data);
        setUser(user);
        showToast("Đăng nhập bằng Google thành công!", "success");
        navigate("/");
        return user;
      }

      // Real Google Identity OAuth Popup flow if VITE_GOOGLE_CLIENT_ID is provided
      if (googleClientId && window.google?.accounts?.oauth2) {
        return new Promise((resolve, reject) => {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: "openid email profile",
            callback: async (tokenResponse: any) => {
              if (tokenResponse.error) {
                showToast("Đăng nhập Google bị hủy!", "warning");
                return reject(tokenResponse);
              }
              try {
                const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoRes.json();

                const data: SocialLoginPayload = {
                  provider: "google",
                  email: userInfo.email,
                  name: userInfo.name || userInfo.email.split("@")[0],
                  avatar: userInfo.picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
                  token: tokenResponse.access_token,
                };
                const user = await userApi.googleLogin(data);
                setUser(user);
                showToast(`Xin chào ${userInfo.name || userInfo.email}! Đăng nhập Google thành công!`, "success");
                navigate("/");
                resolve(user);
              } catch (err: any) {
                console.error("Google Login error:", err);
                const msg = err.response?.data?.detail || "Không thể đăng nhập bằng Google!";
                showToast(msg, "error");
                reject(err);
              }
            },
            error_callback: (error: any) => {
              showToast("Đã đóng cửa sổ đăng nhập Google!", "warning");
              reject(error);
            },
          });

          client.requestAccessToken();
        });
      } else {
        // Warning notification if Client ID is missing in .env
        if (!googleClientId) {
          showToast("Vui lòng điền VITE_GOOGLE_CLIENT_ID trong file .env để bật Popup Google thật!", "warning");
        }
        const data: SocialLoginPayload = {
          provider: "google",
          email: "google_user@example.com",
          name: "Google User (Demo)",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
          token: "demo_google_oauth_token",
        };
        const user = await userApi.googleLogin(data);
        setUser(user);
        showToast("Đăng nhập bằng Google (Demo) thành công!", "success");
        navigate("/");
        return user;
      }
    } catch (error: any) {
      console.error("Google Login error:", error);
    }
  };

  const FacebookLogin = async (overridePayload?: Partial<SocialLoginPayload>) => {
    try {
      const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

      if (overridePayload?.email && overridePayload?.token) {
        const data: SocialLoginPayload = {
          provider: "facebook",
          email: overridePayload.email,
          name: overridePayload.name || "Facebook User",
          avatar: overridePayload.avatar || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120",
          token: overridePayload.token,
        };
        const user = await userApi.facebookLogin(data);
        setUser(user);
        showToast("Đăng nhập bằng Facebook thành công!", "success");
        navigate("/");
        return user;
      }

      // Real Facebook SDK OAuth Popup flow if VITE_FACEBOOK_APP_ID is provided
      if (facebookAppId && window.FB) {
        return new Promise((resolve, reject) => {
          window.FB.init({
            appId: facebookAppId,
            cookie: true,
            xfbml: true,
            version: "v18.0",
          });

          window.FB.login((response: any) => {
            if (response.authResponse) {
              const accessToken = response.authResponse.accessToken;
              window.FB.api("/me", { fields: "name,email,picture" }, async (userInfo: any) => {
                try {
                  const data: SocialLoginPayload = {
                    provider: "facebook",
                    email: userInfo.email || `fb_${userInfo.id}@facebook.com`,
                    name: userInfo.name,
                    avatar: userInfo.picture?.data?.url || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120",
                    token: accessToken,
                  };
                  const user = await userApi.facebookLogin(data);
                  setUser(user);
                  showToast(`Xin chào ${userInfo.name}! Đăng nhập Facebook thành công!`, "success");
                  navigate("/");
                  resolve(user);
                } catch (err) {
                  showToast("Xác thực Facebook thất bại!", "error");
                  reject(err);
                }
              });
            } else {
              showToast("Đăng nhập Facebook bị hủy!", "warning");
              reject(response);
            }
          }, { scope: "public_profile,email" });
        });
      } else {
        if (!facebookAppId) {
          showToast("Vui lòng điền VITE_FACEBOOK_APP_ID trong file .env để bật Popup Facebook thật!", "warning");
        }
        const data: SocialLoginPayload = {
          provider: "facebook",
          email: "facebook_user@example.com",
          name: "Facebook User (Demo)",
          avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120",
          token: "demo_facebook_oauth_token",
        };
        const user = await userApi.facebookLogin(data);
        setUser(user);
        showToast("Đăng nhập bằng Facebook (Demo) thành công!", "success");
        navigate("/");
        return user;
      }
    } catch (error: any) {
      console.error("Facebook Login error:", error);
    }
  };

  return { Login, Register, GoogleLogin, FacebookLogin };
};