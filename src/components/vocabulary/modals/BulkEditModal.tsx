import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { X, Loader2, Save, Trash2, Sparkles } from 'lucide-react'
import CustomSelect from '../../common/CustomSelect'
import type { VocabularyCollection, WordDetail } from '../../../types/vocabulary'
import { bulkUpdateWords, fetchIPA } from '../../../services/vocabularyApi'

interface BulkEditModalProps {
  open: boolean
  collection: VocabularyCollection | null
  onClose: () => void
  onUpdated: (updatedWords: WordDetail[]) => void
}

const WORD_TYPES = [
  { value: 'noun', label: 'noun (Danh từ)' },
  { value: 'verb', label: 'verb (Động từ)' },
  { value: 'adjective', label: 'adjective (Tính từ)' },
  { value: 'adverb', label: 'adverb (Phó từ)' },
  { value: 'phrasal verb', label: 'phrasal verb (Cụm động từ)' },
  { value: 'idiom', label: 'idiom (Thành ngữ)' },
  { value: 'pronoun', label: 'pronoun (Đại từ)' },
  { value: 'preposition', label: 'preposition (Giới từ)' },
  { value: 'conjunction', label: 'conjunction (Liên từ)' },
]

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  open,
  collection,
  onClose,
  onUpdated,
}) => {
  const [words, setWords] = useState<WordDetail[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingIPA, setIsFetchingIPA] = useState(false)

  useEffect(() => {
    if (collection) {
      setWords(collection.words_list ? JSON.parse(JSON.stringify(collection.words_list)) : [])
    }
  }, [collection])

  if (!open || !collection) return null

  const updateRow = (index: number, field: keyof WordDetail, value: string) => {
    setWords(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const deleteRow = (index: number) => {
    setWords(prev => prev.filter((_, i) => i !== index))
  }

  const handleAutoFillIPA = async () => {
    setIsFetchingIPA(true)
    try {
      const updated = await Promise.all(
        words.map(async w => {
          if (w.word.trim() && (!w.ipa || !w.ipa.trim())) {
            const fetched = await fetchIPA(w.word)
            return fetched ? { ...w, ipa: fetched } : w
          }
          return w
        })
      )
      setWords(updated)
    } finally {
      setIsFetchingIPA(false)
    }
  }

  const handleSave = async () => {
    if (words.length === 0) return

    try {
      setIsSubmitting(true)

      const finalWords = await Promise.all(
        words.map(async w => {
          if (w.word.trim() && (!w.ipa || !w.ipa.trim())) {
            const fetched = await fetchIPA(w.word)
            return fetched ? { ...w, ipa: fetched } : w
          }
          return w
        })
      )

      if (collection.id && !collection.id.startsWith('650000000000')) {
        await bulkUpdateWords(
          collection.id,
          finalWords.map(w => ({
            id: w.id,
            word: w.word,
            word_type: w.word_type ?? 'noun',
            ipa: w.ipa ?? '',
            meaning: w.meaning ?? '',
            example_sentence: w.example_sentence ?? '',
            image_url: w.image_url ?? '',
          }))
        )
      }

      onUpdated(finalWords)
      onClose()
    } catch (error) {
      console.error('Failed bulk edit', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-900/25 backdrop-blur-[2px] font-['Be_Vietnam_Pro'] select-none">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-slate-100 overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Sửa từ vựng hàng loạt</h2>
            <p className="text-xs text-slate-400 font-medium truncate">Chỉnh sửa tất cả {words.length} từ trong bộ "{collection.title}"</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-3 sm:p-6">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3 text-left w-12">#</th>
                <th className="py-2.5 px-3 text-left w-[24%]">Từ tiếng Anh *</th>
                <th className="py-2.5 px-3 text-left w-[18%]">Loại từ</th>
                <th className="py-2.5 px-3 text-left w-[18%]">Phiên âm IPA</th>
                <th className="py-2.5 px-3 text-left w-[32%]">Định nghĩa tiếng Việt *</th>
                <th className="py-2.5 px-3 text-center w-12">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {words.map((w, index) => (
                <tr key={w.id || index} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3 text-xs font-extrabold text-slate-400">{index + 1}</td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={w.word}
                      onChange={e => updateRow(index, 'word', e.target.value)}
                      required
                      placeholder="Word"
                      className="w-full px-3 py-1.5 text-xs font-extrabold text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <CustomSelect
                      value={(w.word_type || 'noun').toLowerCase()}
                      onChange={v => updateRow(index, 'word_type', v)}
                      options={WORD_TYPES}
                      placeholder="Chọn loại từ..."
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={w.ipa || ''}
                      onChange={e => updateRow(index, 'ipa', e.target.value)}
                      placeholder="/ipa/"
                      className="w-full px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={w.meaning || ''}
                      onChange={e => updateRow(index, 'meaning', e.target.value)}
                      required
                      placeholder="Nghĩa tiếng Việt"
                      className="w-full px-3 py-1.5 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => deleteRow(index)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa dòng này"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          {/* Left: count + auto IPA */}
          <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
              Tổng cộng: {words.length} từ vựng
            </span>
            <button
              type="button"
              onClick={handleAutoFillIPA}
              disabled={isFetchingIPA}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all disabled:opacity-50 whitespace-nowrap cursor-pointer"
              title="Tự động tra cứu và điền IPA cho các từ chưa có"
            >
              <Sparkles size={12} className={isFetchingIPA ? 'animate-spin' : ''} />
              {isFetchingIPA ? 'Đang lấy...' : 'Tự động lấy IPA'}
            </button>
          </div>

          {/* Right: Cancel + Save */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-extrabold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap text-center justify-center cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting || words.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-extrabold text-white bg-[#1D4ED8] rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 shadow-md shadow-blue-500/20 gap-1.5 whitespace-nowrap text-center cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Lưu tất cả thay đổi</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )

  return ReactDOM.createPortal(modalContent, document.body)
}

export default BulkEditModal
