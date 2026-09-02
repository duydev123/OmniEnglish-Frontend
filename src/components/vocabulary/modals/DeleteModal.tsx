import React, { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteModalProps {
  open: boolean;
  collectionTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  open,
  collectionTitle,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Failed to delete', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/25 backdrop-blur-[2px] font-['Be_Vietnam_Pro'] select-none">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-glow-4side-lg p-5 sm:p-6 text-center animate-in zoom-in-95 duration-200 border border-slate-400/60">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Trash2 className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        
        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1.5">Xóa bộ từ vựng?</h3>
        <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
          Bạn có chắc chắn muốn xóa bộ từ vựng <span className="font-extrabold text-slate-900">"{collectionTitle}"</span> không? Hành động này không thể hoàn tác.
        </p>

        <div className="grid grid-cols-2 gap-2.5 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full py-2.5 px-3 text-xs sm:text-sm font-extrabold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap text-center justify-center cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="w-full inline-flex items-center justify-center py-2.5 px-3 text-xs sm:text-sm font-extrabold text-white bg-red-600 border border-transparent rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors shadow-md shadow-red-500/20 whitespace-nowrap text-center cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin shrink-0" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <span>Xóa bộ từ</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
