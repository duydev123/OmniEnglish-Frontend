import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { X, Loader2, Save, Trash2, Plus } from 'lucide-react'
import type { VocabularyCollection, WordDetail } from '../../../types/vocabulary'
import { bulkUpdateWords } from '../../../services/vocabularyApi'

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

  const handleSave = async () => {
    if (words.length === 0) return

    try {
      setIsSubmitting(true)
      // Call Backend bulkUpdateWords API if real MongoDB collection ID
      if (collection.id && !collection.id.startsWith('650000000000')) {
        await bulkUpdateWords(
          collection.id,
          words.map(w => ({
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

      onUpdated(words)
      onClose()
    } catch (error) {
      console.error('Failed bulk edit', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm font-['Be_Vietnam_Pro'] select-none">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-slate-100 overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Sửa từ vựng hàng loạt</h2>
            <p className="text-xs text-slate-400 font-medium">Chỉnh sửa tất cả {words.length} từ trong bộ "{collection.title}"</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6">
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
                    <select
                      value={(w.word_type || 'noun').toLowerCase()}
                      onChange={e => updateRow(index, 'word_type', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      {WORD_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
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
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-slate-400">
            Tổng cộng: {words.length} từ vựng
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting || words.length === 0}
              className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-white bg-[#1D4ED8] rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 min-w-[150px] shadow-md shadow-blue-500/20 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Lưu tất cả thay đổi
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
