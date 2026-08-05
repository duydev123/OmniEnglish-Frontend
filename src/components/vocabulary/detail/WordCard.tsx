import React, { useState } from 'react';
import { Volume2, Edit3 } from 'lucide-react';
import type { WordDetail } from '../../../types/vocabulary';
import EditWordModal from '../modals/EditWordModal';

interface WordCardProps {
  word?: WordDetail;
  showIPA: boolean;
  onWordUpdated?: (updatedWord: WordDetail) => void;
}

export const WordCard: React.FC<WordCardProps> = ({ word, showIPA, onWordUpdated }) => {
  const [editingWord, setEditingWord] = useState<WordDetail | null>(null);

  if (!word) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 w-full animate-pulse">
        <div className="flex justify-between items-start mb-3">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-5 bg-slate-100 rounded-full w-24"></div>
        </div>
        <div className="h-4 bg-slate-100 rounded w-1/4 mb-4"></div>
        <div className="h-5 bg-slate-200 rounded w-3/4 mb-4"></div>
        <div className="h-16 bg-slate-50 rounded-r-lg border-l-4 border-slate-200 w-full"></div>
      </div>
    );
  }

  const speakWord = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const status = word.learning_status;
  let statusBadge = { bg: 'bg-slate-100', text: 'text-slate-600', label: 'CHƯA HỌC', border: 'border-[#1D4ED8]' };
  if (status === 'MASTERED') {
    statusBadge = { bg: 'bg-emerald-100/80', text: 'text-emerald-700', label: 'ĐÃ THUỘC', border: 'border-[#1D4ED8]' };
  } else if (status === 'LEARNING') {
    statusBadge = { bg: 'bg-blue-100/80', text: 'text-blue-700', label: 'ĐANG HỌC', border: 'border-[#1D4ED8]' };
  } else if (status === 'NEEDS_REVIEW') {
    statusBadge = { bg: 'bg-red-100/80', text: 'text-red-600', label: 'CẦN ÔN TẬP', border: 'border-red-500' };
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingWord(word);
  };

  const handleSaveUpdated = (updated: WordDetail) => {
    if (onWordUpdated) {
      onWordUpdated(updated);
    }
    setEditingWord(null);
  };

  return (
    <>
      <div className="group bg-white rounded-2xl border border-slate-200/90 p-5 hover:shadow-md hover:border-slate-300 transition-all select-none flex flex-col justify-between h-full relative">
        <div>
          {/* Header row: Word Name + Edit icon + Status Badge */}
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">{word.word}</h3>
              <button
                onClick={handleEditClick}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-[#1D4ED8] hover:bg-blue-50 rounded-lg transition-all"
                title="Chỉnh sửa từ vựng"
              >
                <Edit3 size={14} />
              </button>
            </div>
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider ${statusBadge.bg} ${statusBadge.text}`}>
              {statusBadge.label}
            </span>
          </div>

          {/* IPA with Speaker Icon */}
          {showIPA && word.ipa && (
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-3">
              <span>/{word.ipa.replace(/\//g, '')}/</span>
              <button
                onClick={speakWord}
                className="p-0.5 hover:text-blue-600 transition-colors"
                title="Nghe âm"
              >
                <Volume2 size={13} />
              </button>
            </div>
          )}

          {/* Vietnamese Meaning */}
          <p className="text-slate-700 font-medium text-sm leading-relaxed mb-4">
            {word.meaning}
          </p>
        </div>

        {/* Example Box */}
        {word.example_sentence && (
          <div className={`bg-[#F1F5F9]/80 p-3.5 rounded-r-xl border-l-4 ${statusBadge.border} mt-auto`}>
            <p className="italic text-slate-600 text-xs leading-relaxed">
              "{word.example_sentence}"
            </p>
          </div>
        )}
      </div>

      <EditWordModal
        open={!!editingWord}
        word={editingWord}
        onClose={() => setEditingWord(null)}
        onUpdated={handleSaveUpdated}
      />
    </>
  );
};

export default WordCard;
