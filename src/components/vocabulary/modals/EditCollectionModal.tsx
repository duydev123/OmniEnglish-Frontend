import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import CustomSelect from '../../common/CustomSelect';
import type { VocabularyCollection } from '../../../types/vocabulary';
import { updateCollection } from '../../../services/vocabularyApi';

interface EditCollectionModalProps {
  open: boolean;
  collection: VocabularyCollection | null;
  onClose: () => void;
  onUpdated: (title: string, description: string, language: string) => void;
}

export const EditCollectionModal: React.FC<EditCollectionModalProps> = ({
  open,
  collection,
  onClose,
  onUpdated,
}) => {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('Anh-Mỹ');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (collection) {
      setTitle(collection.title || '');
      setLanguage(collection.language || 'Anh-Mỹ');
      setDescription(collection.description || '');
    }
  }, [collection]);

  if (!open || !collection) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      if (collection.id && !collection.id.startsWith('650000000000')) {
        await updateCollection(collection.id, { title, description, language });
      }
      onUpdated(title, description, language);
      onClose();
    } catch (error) {
      console.error('Failed to edit collection', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/25 backdrop-blur-[2px] font-['Be_Vietnam_Pro'] select-none">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Chỉnh sửa bộ từ vựng</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-1.5">
              <label htmlFor="editTitle" className="block text-xs sm:text-sm font-bold text-slate-700">
                Tên bộ từ vựng <span className="text-red-500">*</span>
              </label>
              <input
                id="editTitle"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
              />
            </div>
            <div className="sm:w-44 space-y-1.5 shrink-0">
              <label htmlFor="editLanguage" className="block text-xs sm:text-sm font-bold text-slate-700">
                Ngôn ngữ
              </label>
              <CustomSelect
                id="editLanguage"
                value={language}
                onChange={setLanguage}
                options={[
                  { value: 'Anh-Mỹ', label: 'Anh - Mỹ' },
                  { value: 'Anh-Anh', label: 'Anh - Anh' },
                ]}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="editDescription" className="block text-xs sm:text-sm font-bold text-slate-700">
              Mô tả
            </label>
            <textarea
              id="editDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all font-medium"
            />
          </div>
        </form>

        {/* Responsive Footer - Grid 2 columns on mobile */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:justify-end sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-extrabold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors text-center whitespace-nowrap cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-[#1D4ED8] rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 shadow-md shadow-blue-500/20 text-center whitespace-nowrap cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin shrink-0" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>Lưu thay đổi</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default EditCollectionModal;
