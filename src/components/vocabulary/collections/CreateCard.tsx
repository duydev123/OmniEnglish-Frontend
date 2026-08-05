import React from 'react'
import { Plus } from 'lucide-react'

interface CreateCardProps {
  onClick: () => void
}

export const CreateCard: React.FC<CreateCardProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group relative border-2 border-dashed border-slate-200 hover:border-blue-400
        bg-white hover:bg-blue-50/20 rounded-3xl p-6 transition-all duration-200 cursor-pointer
        flex flex-col items-center justify-center text-center h-[310px] w-full select-none shadow-xs hover:shadow-md shrink-0"
    >
      <div className="w-12 h-12 rounded-full border border-slate-200 group-hover:border-blue-400 group-hover:bg-blue-50
        flex items-center justify-center text-slate-400 group-hover:text-[#1D4ED8] transition-all mb-3 shadow-xs">
        <Plus size={22} strokeWidth={2.5} />
      </div>

      <h3 className="font-extrabold text-base text-slate-800 group-hover:text-[#1D4ED8] transition-colors mb-1.5">
        Tạo bộ từ mới
      </h3>

      <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed font-medium">
        Bắt đầu xây dựng danh sách từ vựng của riêng bạn.
      </p>
    </div>
  )
}

export default CreateCard
