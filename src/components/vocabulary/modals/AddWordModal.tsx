import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { X, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react'
import type { VocabularyCollection, AddWordPayload } from '../../../types/vocabulary'
import { addWord, fetchWordDetails } from '../../../services/vocabularyApi'
import { useToast } from '../../common/Toast'
import CustomSelect from '../../common/CustomSelect'

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
  const { showToast } = useToast()
  const [selectedCollectionId, setSelectedCollectionId] = useState(
    preselectedCollectionId || (collections[0]?.id ?? '')
  )

  useEffect(() => {
    if (preselectedCollectionId) {
      setSelectedCollectionId(preselectedCollectionId)
    } else if (collections.length > 0 && !selectedCollectionId) {
      setSelectedCollectionId(collections[0].id)
    }
  }, [preselectedCollectionId, collections, selectedCollectionId])

  const [word, setWord] = useState('')
  const [wordType, setWordType] = useState('noun')
  const [ipa, setIpa] = useState('')
  const [meaning, setMeaning] = useState('')
  const [example, setExample] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingIPA, setIsFetchingIPA] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleAutoFetchIPA = async (targetWord?: string) => {
    const w = targetWord || word
    const cleanWord = w.trim()
    if (!cleanWord) {
      showToast('Vui lòng nhập từ vựng trước khi lấy phiên âm!', 'warning')
      return
    }
    if (!/[a-zA-Z]/.test(cleanWord)) {
      showToast(`"${cleanWord}" không phải là từ tiếng Anh hợp lệ. Vui lòng nhập từ có chứa chữ cái!`, 'warning')
      return
    }

    setIsFetchingIPA(true)
    try {
      const details = await fetchWordDetails(cleanWord)
      if (details.ipa && details.ipa.trim() && details.ipa !== '/No IPA available/') {
        setIpa(details.ipa)
        if (details.word_type) {
          setWordType(details.word_type)
        }
        showToast(`✨ Đã tự động điền IPA và loại từ cho "${cleanWord}"!`, 'success')
      } else {
        showToast(`Không tìm thấy phiên âm cho từ "${cleanWord}". Vui lòng nhập đúng từ tiếng Anh hợp lệ!`, 'warning')
      }
    } catch {
      showToast('Vui lòng nhập từ tiếng Anh hợp lệ!', 'warning')
    } finally {
      setIsFetchingIPA(false)
    }
  }

  const handleWordBlur = () => {
    const clean = word.trim()
    if (clean) {
      if (!/[a-zA-Z]/.test(clean)) {
        showToast(`"${clean}" không phải là từ tiếng Anh hợp lệ. Vui lòng nhập từ có chứa chữ cái!`, 'warning')
      } else if (!ipa.trim()) {
        handleAutoFetchIPA(word)
      }
    }
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setImageUrl(evt.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetId = preselectedCollectionId || selectedCollectionId
    if (!targetId || !word.trim() || !meaning.trim()) return

    const letters = word.trim().match(/[a-zA-Z]/g) || []
    if (letters.length < 2) {
      showToast('Từ vựng phải chứa ít nhất 2 chữ cái tiếng Anh!', 'warning')
      return
    }

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
      setWord('')
      setWordType('noun')
      setIpa('')
      setMeaning('')
      setExample('')
      setImageUrl('')
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { detail?: string } } }
      if (axiosError?.response?.status === 409) {
        showToast(axiosError.response.data?.detail || `Từ "${word.trim()}" đã tồn tại trong bộ từ vựng này!`, 'warning')
      } else {
        showToast('Không thếm được từ. Vui lòng thử lại!', 'error')
        console.error('Failed to add word', error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const collectionOptions = collections.map(col => ({ value: col.id, label: col.title }))

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/25 backdrop-blur-[2px] font-['Be_Vietnam_Pro'] select-none">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Tạo từ vựng mới</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form id="add-word-form" onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {!preselectedCollectionId && collections.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-700">
                Bộ từ vựng <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                value={selectedCollectionId}
                onChange={setSelectedCollectionId}
                options={collectionOptions}
                placeholder="Chọn bộ từ vựng..."
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-700">
              Từ mới <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onBlur={handleWordBlur}
              required
              placeholder="Vd: Resilience"
              className="w-full px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-700">
                Loại từ
              </label>
              <CustomSelect
                value={wordType.toLowerCase()}
                onChange={setWordType}
                options={WORD_TYPES}
                placeholder="Chọn loại từ..."
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-bold text-slate-700">
                  Phiên âm
                </label>
                <button
                  type="button"
                  onClick={() => handleAutoFetchIPA()}
                  disabled={isFetchingIPA || !word.trim()}
                  className="text-[11px] sm:text-xs text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 disabled:opacity-40"
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
                className="w-full px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium transition-all"
              />
            </div>
          </div>

          {/* Định nghĩa * */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-700">
              Định nghĩa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              required
              placeholder="Vd: Khả năng phục hồi nhanh chóng sau khó khăn"
              className="w-full px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium transition-all"
            />
          </div>

          {/* Ví dụ */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-700">
              Ví dụ
            </label>
            <textarea
              value={example}
              onChange={(e) => setExample(e.target.value)}
              rows={2}
              placeholder="Vd: Trauma research has highlighted the remarkable resilience of the human psyche."
              className="w-full px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-medium transition-all"
            />
          </div>

          {/* Hình ảnh minh họa */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-700">
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
              className="border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-2xl p-4 sm:p-6
                bg-blue-50/20 hover:bg-blue-50/50 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
            >
              {imageUrl ? (
                <div className="relative w-full h-28 sm:h-32 rounded-xl overflow-hidden group/img">
                  <img src={imageUrl} alt="Uploaded" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                    Bấm để thay đổi ảnh
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 text-[#1D4ED8] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                    <ImageIcon size={20} className="sm:w-5 sm:h-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 mb-0.5">
                    Kéo thả ảnh hoặc nhấp để tải lên
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
                    JPG, PNG, GIF (Tối đa 5MB)
                  </p>
                </>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
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
            form="add-word-form"
            disabled={isSubmitting || !word.trim() || !meaning.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-[#1D4ED8] rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 shadow-md shadow-blue-500/20 text-center whitespace-nowrap cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin shrink-0" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>Lưu từ vựng</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  return ReactDOM.createPortal(modalContent, document.body)
}

export default AddWordModal
