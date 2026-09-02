/**
 * Utility function to extract user-friendly error messages from Axios / API errors.
 */
export function getApiErrorMessage(error: any, fallbackMessage: string = "Đã xảy ra lỗi. Vui lòng thử lại!"): string {
  if (!error) return fallbackMessage;
  if (typeof error === "string") return error;

  const data = error.response?.data;
  if (data) {
    // FastAPI HTTPExceptions or custom API error objects
    if (typeof data.detail === "string" && data.detail.trim().length > 0) {
      return data.detail;
    }
    // FastAPI validation error array [{ msg: "..." }]
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const firstErr = data.detail[0];
      if (typeof firstErr === "string") return firstErr;
      if (firstErr?.msg) return firstErr.msg;
    }
    if (typeof data.message === "string" && data.message.trim().length > 0) {
      return data.message;
    }
    if (typeof data.error === "string" && data.error.trim().length > 0) {
      return data.error;
    }
  }

  // Axios network or standard Error object
  if (error.message && typeof error.message === "string") {
    if (error.message === "Network Error") {
      return "Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng hoặc thử lại sau!";
    }
    if (error.message.includes("timeout")) {
      return "Kết nối tới máy chủ quá thời gian (Timeout). Vui lòng thử lại!";
    }
    return error.message;
  }

  return fallbackMessage;
}
