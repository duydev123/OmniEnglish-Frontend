import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Log request để debug
  console.debug(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.params ?? '');
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    console.debug(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // Server trả về response nhưng status >= 400
      console.error(
        `[API Error] ${error.response.status} ${error.config?.url}`,
        '\nMessage:', error.response.data?.message ?? error.response.data,
      );
      if (error.response.status === 401) {
        localStorage.removeItem('token');
      }
    } else if (error.request) {
      // Request đã gửi nhưng không nhận được response → Network Error / CORS / server down
      console.error(
        `[Network Error] Không thể kết nối tới server: ${BASE_URL}`,
        '\nURL:', error.config?.url,
        '\nHãy kiểm tra: 1) Backend có đang chạy không? 2) CORS đã cấu hình đúng chưa? 3) Firewall/proxy?',
        error.message,
      );
    } else {
      console.error('[Axios Config Error]', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;