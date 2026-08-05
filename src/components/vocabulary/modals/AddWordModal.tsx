import React, { useState, useRef } from 'react'
import ReactDOM from 'react-dom'
import { X, Loader2, Image as ImageIcon } from 'lucide-react'
import type { VocabularyCollection, AddWordPayload } from '../../../types/vocabulary'
import { addWord } from '../../../services/vocabularyApi'

interface AddWordModalProps {
  open: boolean
  onClose: () => void
  collections: VocabularyCollection[]
  preselectedCollectionId?: string
  onWordAdded: (collectionId: string) => void
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

export const AddWordModal: React.FC<AddWordModalProps> = ({
  open,
  onClose,
  collections,
  preselectedCollectionId,
  onWordAdded,
}) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState(
    preselectedCollectionId || (collections[0]?.id ?? '')
  )
  const [word, setWord] = useState('')
  const [wordType, setWordType] = useState('noun')
  const [ipa, setIpa] = useState('')
  const [meaning, setMeaning] = useState('')
  const [example, setExample] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const fakeUrl = URL.createObjectURL(file)
      setImageUrl(fakeUrl)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetId = preselectedCollectionId || selectedCollectionId
    if (!targetId || !word.trim() || !meaning.trim()) return

    try {
      setIsSubmitting(true)
      const payload: AddWordPayload = {
        word: word.trim(),
        word_type: wordType.trim(),
        ipa: ipa.trim(),
        meaning: meaning.trim(),
        example_sentence: example.trim(),
        image_url: imageUrl.trim(),
      }

      if (!targetId.startsWith('650000000000')) {
        await addWord(targetId, payload)
      }

      onWordAdded(targetId)
      onClose()
      // reset form
      setWord('')
      setWordType('noun')
      setIpa('')
      setMeaning('')
      setExample('')
      setImageUrl('')
    } catch (error) {
      console.error('Failed to add word', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm font-['Be_Vietnam_Pro'] select-none">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <h2 className="text-xl font-extrabold text-slate-900">Tạo từ vựng mới</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form id="add-word-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Collection selection if not preselected */}
          {!preselectedCollectionId && collections.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">
                Bộ từ vựng <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium transition-all"
              >
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Từ mới * */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700">
              Từ mới <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              required
              placeholder="Vd: Resilience"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium transition-all"
            />
          </div>

          {/* Grid: Loại từ & Phiên âm */}
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
                {WORD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">
                Phiên âm
              </label>
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
            form="add-word-form"
            disabled={isSubmitting || !word.trim() || !meaning.trim()}
            className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-white bg-[#1D4ED8] rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 min-w-[130px] shadow-md shadow-blue-500/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Lưu từ vựng'
            )}
          </button>
        </div>
      </div>
    </div>
  )

  return ReactDOM.createPortal(modalContent, document.body)
}

export default AddWordModal
