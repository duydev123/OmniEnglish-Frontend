import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { X, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react'
import type { WordDetail } from '../../../types/vocabulary'
import { updateWord, fetchIPA } from '../../../services/vocabularyApi'

interface EditWordModalProps {
  open: boolean
  word: WordDetail | null
  onClose: () => void
  onUpdated: (updatedWord: WordDetail) => void
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

export const EditWordModal: React.FC<EditWordModalProps> = ({
  open,
  word,
  onClose,
  onUpdated,
}) => {
  const [wordText, setWordText] = useState('')
  const [wordType, setWordType] = useState('')
  const [ipa, setIpa] = useState('')
  const [meaning, setMeaning] = useState('')
  const [example, setExample] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingIPA, setIsFetchingIPA] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (word) {
      setWordText(word.word || '')
      setWordType(word.word_type || 'noun')
      setIpa(word.ipa || '')
      setMeaning(word.meaning || '')
      setExample(word.example_sentence || '')
      setImageUrl(word.image_url || '')
    }
  }, [word])

  if (!open || !word) return null

  const handleAutoFetchIPA = async () => {
    if (!wordText.trim()) return
    setIsFetchingIPA(true)
    try {
      const fetched = await fetchIPA(wordText)
      if (fetched) setIpa(fetched)
    } finally {
      setIsFetchingIPA(false)
    }
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const fakeUrl = URL.createObjectURL(file)
      setImageUrl(fakeUrl)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wordText.trim() || !meaning.trim()) return

    try {
      setIsSubmitting(true)
      const updated: WordDetail = {
        ...word,
        word: wordText.trim(),
        word_type: wordType.trim(),
        ipa: ipa.trim(),
        meaning: meaning.trim(),
        example_sentence: example.trim(),
        image_url: imageUrl.trim(),
      }

      if (word.id && !word.id.startsWith('w')) {
        await updateWord(word.id, {
          word: updated.word,
          word_type: updated.word_type,
          ipa: updated.ipa ?? '',
          meaning: updated.meaning ?? '',
          example_sentence: updated.example_sentence ?? '',
          image_url: updated.image_url ?? '',
        })
      }

      onUpdated(updated)
      onClose()
    } catch (error) {
      console.error('Failed to update word', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm font-['Be_Vietnam_Pro'] select-none">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <h2 className="text-xl font-extrabold text-slate-900">Chỉnh sửa từ vựng</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form id="edit-word-form-modal" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Từ mới * */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700">
              Từ mới <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={wordText}
              onChange={(e) => setWordText(e.target.value)}
              required
              placeholder="Vd: Resilience"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium transition-all"
            />
          </div>

          {/* Grid: Loại từ (Select Dropdown) & Phiên âm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">
                Loại từ
              </label>
              <select
                value={wordType.toLowerCase()}
                onChange={(e) => setWordType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium transition-all cursor-pointer text-slate-800"
              >
                <option value="">Chọn loại từ...</option>
                {WORD_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-700">
                  Phiên âm
                </label>
                <button
                  type="button"
                  onClick={handleAutoFetchIPA}
                  disabled={isFetchingIPA || !wordText.trim()}
                  className="text-xs text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 disabled:opacity-40"
                  title="Tra cứu tự động IPA từ từ điển"
                >
                  <Sparkles size={12} className={isFetchingIPA ? 'animate-spin' : ''} />
                  {isFetchingIPA ? 'Đang lấy...' : 'Tự động lấy'}
                </button>
              </div>
              <input
                type="text"
                value={ipa}
                onChange={(e) => setIpa(e.target.value)}
                placeholder="Vd: /rɪˈzɪl.jəns/"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium transition-all"
              />
            </div>
          </div>

          {/* Định nghĩa * */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700">
              Định nghĩa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              required
              placeholder="Vd: Khả năng phục hồi nhanh chóng sau khó khăn"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium transition-all"
            />
          </div>

          {/* Ví dụ */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700">
              Ví dụ
            </label>
            <textarea
              value={example}
              onChange={(e) => setExample(e.target.value)}
              rows={2}
              placeholder="Vd: Trauma research has highlighted the remarkable resilience of the human psyche."
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-medium transition-all"
            />
          </div>

          {/* Hình ảnh minh họa */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700">
              Hình ảnh minh họa
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-2xl p-6
                bg-blue-50/20 hover:bg-blue-50/50 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
            >
              {imageUrl ? (
                <div className="relative w-full h-32 rounded-xl overflow-hidden group/img">
                  <img src={imageUrl} alt="Uploaded" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                    Bấm để thay đổi ảnh
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-[#1D4ED8] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ImageIcon size={22} />
                  </div>
                  <p className="text-sm font-bold text-slate-800 mb-0.5">
                    Kéo thả ảnh hoặc nhấp để tải lên
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    JPG, PNG, GIF (Tối đa 5MB)
                  </p>
                </>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="edit-word-form-modal"
            disabled={isSubmitting || !wordText.trim() || !meaning.trim()}
            className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-white bg-[#1D4ED8] rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 min-w-[130px] shadow-md shadow-blue-500/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Lưu thay đổi'
            )}
          </button>
        </div>
      </div>
    </div>
  )

  return ReactDOM.createPortal(modalContent, document.body)
}

export default EditWordModal
