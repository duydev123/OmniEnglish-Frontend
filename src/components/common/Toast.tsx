import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastMessage {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => {
      const newToasts = [...prev, { id, message, type }]
      if (newToasts.length > 4) {
        return newToasts.slice(newToasts.length - 4)
      }
      return newToasts
    })

    setTimeout(() => {
      removeToast(id)
    }, 3500)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {ReactDOM.createPortal(
        <div className="fixed bottom-5 right-5 z-[999999] flex flex-col gap-2.5 pointer-events-none">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  const [isShowing, setIsShowing] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setIsShowing(true))
  }, [])

  const icons = {
    success: <CheckCircle className="text-emerald-600 shrink-0" size={20} />,
    error: <XCircle className="text-rose-600 shrink-0" size={20} />,
    info: <Info className="text-[#1D4ED8] shrink-0" size={20} />,
    warning: <AlertTriangle className="text-amber-600 shrink-0" size={20} />,
  }

  const bgColors = {
    success: 'bg-white border-slate-200 text-slate-800 shadow-2xl border-l-4 border-l-emerald-500',
    error: 'bg-white border-slate-200 text-slate-800 shadow-2xl border-l-4 border-l-rose-500',
    info: 'bg-white border-slate-200 text-slate-800 shadow-2xl border-l-4 border-l-[#1D4ED8]',
    warning: 'bg-white border-slate-200 text-slate-800 shadow-2xl border-l-4 border-l-amber-500',
  }

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 p-4 pr-10 rounded-2xl border shadow-xl max-w-sm w-full font-['Be_Vietnam_Pro'] transform transition-all duration-300 ${
        isShowing ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
      } ${bgColors[toast.type] || bgColors.info}`}
    >
      {icons[toast.type] || icons.info}
      <p className="text-xs font-bold leading-relaxed">{toast.message}</p>
      <button
        onClick={onRemove}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-black/5 transition-colors text-slate-500 cursor-pointer"
      >
        <X size={15} />
      </button>
    </div>
  )
}

export default ToastProvider
