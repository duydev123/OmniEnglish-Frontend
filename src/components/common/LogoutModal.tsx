import React, { useEffect } from "react";
import { LogOut, X } from "lucide-react";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white border border-slate-400/60 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-glow-4side-lg z-10 transform transition-all duration-300 scale-100 animate-scale-up font-sans">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-5 shadow-inner">
          <LogOut className="w-7 h-7 stroke-[2.2]" />
        </div>

        {/* Modal Title & Body */}
        <div className="text-center space-y-2 mb-7">
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Xác nhận đăng xuất
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
            Bạn có chắc chắn muốn đăng xuất khỏi tài khoản omniEnglish không?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition duration-200 cursor-pointer active:scale-98"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-600/25 transition duration-200 cursor-pointer active:scale-98"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
