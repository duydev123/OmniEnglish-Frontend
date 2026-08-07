import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import {
  ArrowLeft, Plus, Trash2, Sparkles, X,
  Info, FileText, AlignLeft
} from 'lucide-react'
import VocabLayout from '../../components/vocabulary/layout/VocabLayout'
import CustomSelect from '../../components/common/CustomSelect'
import { useToast } from '../../components/common/Toast'
import { bulkAddWords, pasteText, getCollection, fetchIPA, fetchWordDetails } from '../../services/vocabularyApi'
import type { AddWordPayload } from '../../types/vocabulary'

interface BulkRow extends AddWordPayload {
  _key: number
}

type BulkTab = 'manual' | 'paste'

const WORD_TYPES = [
  { value: 'noun', label: 'Noun (Danh từ)' },
  { value: 'verb', label: 'Verb (Động từ)' },
  { value: 'adjective', label: 'Adjective (Tính từ)' },
  { value: 'adverb', label: 'Adverb (Phó từ)' },
  { value: 'phrasal verb', label: 'Phrasal Verb (Cụm động từ)' },
  { value: 'idiom', label: 'Idiom (Thành ngữ)' },
  { value: 'pronoun', label: 'Pronoun (Đại từ)' },
  { value: 'preposition', label: 'Preposition (Giới từ)' },
  { value: 'conjunction', label: 'Conjunction (Liên từ)' },
]

let keyCounter = 0
function makeRow(): BulkRow {
  return { _key: ++keyCounter, word: '', word_type: '', ipa: '', meaning: '', example_sentence: '', image_url: '' }
}

export default function BulkAddPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [collectionTitle, setCollectionTitle] = useState('Bộ từ vựng')
  const [activeTab, setActiveTab] = useState<BulkTab>('manual')
  const [rows, setRows] = useState<BulkRow[]>([makeRow(), makeRow(), makeRow()])
  const [pasteTextValue, setPasteTextValue] = useState('')
  const [aiResult, setAiResult] = useState<string[] | null>(null)
  const [aiMessage, setAiMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingIpa, setFetchingIpa] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!id || id.startsWith('650000000000')) return
    getCollection(id)
      .then(col => setCollectionTitle(col.title))
      .catch(() => { })
  }, [id])

  function updateRow<K extends keyof AddWordPayload>(key: number, field: K, value: AddWordPayload[K]) {
    setRows(prev => prev.map(r => r._key === key ? { ...r, [field]: value } : r))
  }

  async function handleWordBlur(key: number, wordVal: string, currentIpa?: string) {
    if (!wordVal.trim() || (currentIpa && currentIpa.trim())) return
    const details = await fetchWordDetails(wordVal)
    if (details.ipa) {
      updateRow(key, 'ipa', details.ipa)
      if (details.word_type) {
        updateRow(key, 'word_type', details.word_type)
      }
      if (details.meaning) {
        updateRow(key, 'meaning', details.meaning)
      }
      if (details.example_sentence) {
        updateRow(key, 'example_sentence', details.example_sentence)
      }
    }
  }

  async function handleAutoFillAllIPA() {
    setFetchingIpa(true)
    try {
      let foundCount = 0
      const updated = await Promise.all(
        rows.map(async (row) => {
          if (row.word.trim() && (!row.ipa || !row.ipa.trim())) {
            const details = await fetchWordDetails(row.word)
            if (details.ipa && details.ipa.trim() && details.ipa !== '/No IPA available/') {
              foundCount++
              return {
                ...row,
                ipa: details.ipa,
                word_type: details.word_type || row.word_type || 'Noun',
                meaning: row.meaning || details.meaning || '',
                example_sentence: row.example_sentence || details.example_sentence || '',
              }
            }
          }
          return row
        })
      )
      setRows(updated)
      if (foundCount > 0) {
        showToast(`✨ Đã tự động tra cứu IPA, loại từ, nghĩa & ví dụ cho ${foundCount} từ!`, 'success')
      } else {
        showToast('Không tìm thấy thông tin cho các từ đã nhập. Vui lòng kiểm tra lại từ đúng chính tả tiếng Anh!', 'warning')
      }
    } catch {
      showToast('Tự động điền thông tin thất bại. Vui lòng nhập từ tiếng Anh hợp lệ!', 'error')
    } finally {
      setFetchingIpa(false)
    }
  }



  function addRow() {
    setRows(prev => [...prev, makeRow()])
  }

  function removeRow(key: number) {
    setRows(prev => prev.length > 1 ? prev.filter(r => r._key !== key) : prev)
  }

  function clearAll() {
    setRows([makeRow(), makeRow(), makeRow()])
  }

  async function handleSave() {
    if (!id) return

    if (activeTab === 'paste') {
      const raw = pasteTextValue.trim()
      if (!raw) {
        showToast('Vui lòng dán văn bản trước khi xử lý!', 'error')
        return
      }
      // Must have at least 20 characters
      if (raw.length < 20) {
        showToast('Văn bản quá ngắn! Vui lòng nhập ít nhất 20 ký tự.', 'warning')
        return
      }
      // Must contain at least 3 real English words (letters only tokens)
      const engWords = raw.match(/[a-zA-Z]{2,}/g) || []
      if (engWords.length < 3) {
        showToast('Văn bản không hợp lệ! Cần ít nhất 3 từ tiếng Anh thực sự (không phải dấu chấm hoặc ký tự đặc biệt).', 'warning')
        return
      }
    }

    setLoading(true)
    try {
      if (activeTab === 'manual') {
        const valid = rows.filter(r => r.word.trim() && r.meaning.trim())
        if (valid.length === 0) {
          showToast('Vui lòng nhập ít nhất 1 từ có đầy đủ thông tin!', 'error')
          setLoading(false)
          return
        }

        // Auto-fill missing IPAs before save
        const rowsWithIpa = await Promise.all(
          valid.map(async ({ _key: _k, ...rest }) => {
            if (!rest.ipa || !rest.ipa.trim()) {
              const fetched = await fetchIPA(rest.word)
              return { ...rest, ipa: fetched || '' }
            }
            return rest
          })
        )

        if (!id.startsWith('650000000000')) {
          const result = await bulkAddWords(id, rowsWithIpa) as { added_count?: number; skipped_words?: string[] } | undefined
          const addedCount = result?.added_count ?? valid.length
          const skipped = result?.skipped_words ?? []
          if (skipped.length > 0) {
            showToast(`Đã thêm ${addedCount} từ. ⚠️ Bỏ qua ${skipped.length} từ đã tồn tại: ${skipped.join(', ')}`, 'warning')
          } else {
            showToast(`Đã thêm ${addedCount} từ vào bộ!`, 'success')
          }
        } else {
          showToast(`Đã thêm ${valid.length} từ vào bộ!`, 'success')
        }
        setRows([makeRow(), makeRow(), makeRow()])
        navigate(`/vocabulary/${id}`)
      } else {
        const raw = pasteTextValue.trim()
        if (raw.length < 20) {
          showToast('Vui lòng nhập đoạn văn có ít nhất 20 ký tự để AI phân tích!', 'warning')
          return
        }
        if (!id.startsWith('650000000000')) {
          const result = await pasteText(id, raw)
          setAiResult(result.extracted_words)
          setAiMessage(result.message)
          if (result.added_count > 0) {
            showToast(result.message || `AI đã thêm ${result.added_count} từ!`, 'success')
          } else {
            showToast(result.message || 'Không trích xuất hoặc thêm được từ vựng tiếng Anh phù hợp nào từ đoạn văn trên!', 'warning')
          }
        } else {
          setAiResult(['Analyze', 'Demonstrate', 'Evaluate'])
          setAiMessage('Gemini AI successfully analyzed the text (Demo Mode)')
          showToast('AI đã thêm 3 từ mẫu!', 'success')
        }
      }
    } catch (err) {
      showToast(`${(err as Error).message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleDiscard() {
    if (activeTab === 'manual') clearAll()
    else { setPasteTextValue(''); setAiResult(null); setAiMessage('') }
    navigate(`/vocabulary/${id}`)
  }

  // Danh sách stop words tiếng Anh phổ biến - không cần tra từ điển
  const STOP_WORDS = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'do', 'does', 'did', 'have', 'has', 'had', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'in', 'on', 'at', 'by', 'for', 'of', 'to', 'up', 'as', 'or', 'and',
    'but', 'nor', 'so', 'yet', 'not', 'no', 'nor', 'if', 'or', 'then',
    'than', 'that', 'this', 'these', 'those', 'it', 'its', 'he', 'she',
    'we', 'they', 'you', 'me', 'him', 'her', 'us', 'them', 'my', 'our',
    'his', 'your', 'their', 'its', 'who', 'what', 'which', 'when', 'where',
    'how', 'why', 'all', 'both', 'each', 'few', 'more', 'most', 'other',
    'some', 'such', 'only', 'own', 'same', 'too', 'very', 'just', 'also',
    'from', 'into', 'with', 'about', 'after', 'before', 'between', 'through',
    'during', 'without', 'within', 'along', 'following', 'across', 'behind',
    'beyond', 'plus', 'except', 'up', 'out', 'around', 'down', 'off', 'above',
    'over', 'under', 'again', 'further', 'once', 'here', 'there', 'while',
  ])

  // Validation rules cơ bản loại trừ mẫu từ vô nghĩa / tiếng Việt không dấu
  function isLikelyEnglishWordLocal(w: string): boolean {
    const word = w.toLowerCase().trim()

    // Yêu cầu tối thiểu 3 ký tự để loại các từ chức năng quá ngắn
    if (word.length < 3 || word.length > 25) return false

    // Loại stop words - những từ phổ biến không cần học
    if (STOP_WORDS.has(word)) return false

    // Bắt buộc chứa ít nhất 1 nguyên âm tiếng Anh (a, e, i, o, u, y)
    if (!/[aeiouy]/.test(word)) return false

    // Không được chứa 4 phụ âm liên tiếp
    if (/[bcdfghjklmnpqrstvwxz]{4,}/.test(word)) return false

    // Không chứa 3 ký tự lặp liên tiếp
    if (/(.)\1\1/.test(word)) return false

    // Chặn các cấu trúc âm tiết đặc trưng tiếng Việt không dấu
    if (/^(ngh|kh|nh)[a-z]*/.test(word)) return false
    if (/^ng[aeiouy]/.test(word)) return false
    if (/[a-z]+nh$/.test(word) && !/[a-z]+nch$/.test(word)) return false

    // Chặn các kết hợp nguyên âm đặc trưng tiếng Việt
    if (/(uoc|uon|uong|uyen|uyet|ieu|yeu|uoi|oan|oat|oac|oam)/.test(word)) return false

    // Chặn chuỗi phụ âm cuối bất thường gợi ý tên riêng nước ngoài
    // (kết thúc bằng -tti, -lli, -ssi, -zzi thường là tên Ý)
    if (/([tls]i|zz[ai])$/.test(word) && word.length > 6) return false

    return true
  }



  const [verifiedEngWordCount, setVerifiedEngWordCount] = useState(0)

  useEffect(() => {
    const rawWords = pasteTextValue.trim().match(/[a-zA-Z]{2,}/g) || []
    const count = rawWords.filter(w => isLikelyEnglishWordLocal(w)).length
    setVerifiedEngWordCount(count)
  }, [pasteTextValue])


  // Xóa kết quả AI cũ khi khung nhập trống
  useEffect(() => {
    if (pasteTextValue.trim().length === 0) {
      setAiResult(null)
      setAiMessage('')
    }
  }, [pasteTextValue])

  const engWordCount = verifiedEngWordCount
  const charCount = pasteTextValue.length
  const isPasteValid = charCount >= 20 && engWordCount >= 3
  const wordCount = pasteTextValue.trim().split(/\s+/).filter(Boolean).length
  const validRowsCount = rows.filter(r => r.word.trim()).length

  return (
    <VocabLayout breadcrumbs={[
      { label: 'BASIC' },
      { label: 'VOCABULARY', href: '/vocabulary' },
      { label: 'BỘ TỪ VỰNG CỦA TÔI', href: '/vocabulary' },
      { label: collectionTitle.toUpperCase(), href: `/vocabulary/${id}` },
      { label: 'THÊM HÀNG LOẠT' },
    ]}>
      <div className="min-h-screen flex flex-col font-['Be_Vietnam_Pro']">
        <div className="flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto w-full pb-28">

          {/* Page Title Header */}
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <button
              onClick={() => navigate(`/vocabulary/${id}`)}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-500 shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Thêm hàng loạt
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-slate-200 mb-4 sm:mb-6">
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-extrabold border-b-2 transition-all -mb-px whitespace-nowrap cursor-pointer
                ${activeTab === 'manual'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-extrabold border-b-2 transition-all -mb-px whitespace-nowrap cursor-pointer
                ${activeTab === 'paste'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Paste Text
            </button>
          </div>

          {/* Tab 1: Manual Entry */}
          {activeTab === 'manual' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Action Toolbar - Responsive flex wrap for all screen sizes */}
              <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    onClick={addRow}
                    className="flex-1 min-w-[95px] sm:flex-none inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-bold text-blue-600
                      bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition-all whitespace-nowrap cursor-pointer shadow-xs"
                  >
                    <Plus size={14} className="shrink-0" />
                    <span>Add Row</span>
                  </button>
                  <button
                    onClick={handleAutoFillAllIPA}
                    disabled={fetchingIpa}
                    className="flex-1 min-w-[95px] sm:flex-none inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-bold text-purple-600
                      bg-white border border-purple-200 rounded-xl hover:bg-purple-50 transition-all disabled:opacity-50 whitespace-nowrap cursor-pointer shadow-xs"
                    title="Tự động tra cứu và điền IPA cho tất cả các từ"
                  >
                    <Sparkles size={14} className={`shrink-0 ${fetchingIpa ? 'animate-spin' : ''}`} />
                    <span>{fetchingIpa ? 'Đang lấy...' : 'Auto IPA'}</span>
                  </button>
                  <button
                    onClick={clearAll}
                    className="flex-1 min-w-[95px] sm:flex-none inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-600
                      bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all whitespace-nowrap cursor-pointer shadow-xs"
                  >
                    <X size={14} className="shrink-0" />
                    <span>Clear All</span>
                  </button>
                </div>
                <span className="text-xs text-slate-400 font-bold hidden sm:block">
                  {validRowsCount} row{validRowsCount !== 1 ? 's' : ''} currently active
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto p-2 sm:p-4">
                <table className="w-full min-w-[640px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3 text-left w-[28%]">Word *</th>
                      <th className="py-2.5 px-3 text-left w-[20%]">IPA</th>
                      <th className="py-2.5 px-3 text-left w-[18%]">Part of Speech</th>
                      <th className="py-2.5 px-3 text-left">Meaning *</th>
                      <th className="py-2.5 px-3 text-center w-10">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, i) => (
                      <tr key={row._key} className="group hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={row.word}
                            onChange={e => updateRow(row._key, 'word', e.target.value)}
                            onBlur={e => handleWordBlur(row._key, e.target.value, row.ipa)}
                            placeholder={i === 0 ? 'Serendipity' : 'Required word...'}
                            className="w-full px-3 py-1.5 text-xs sm:text-sm font-extrabold text-slate-900 border border-slate-200 rounded-xl
                              focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={row.ipa ?? ''}
                            onChange={e => updateRow(row._key, 'ipa', e.target.value)}
                            placeholder="e.g. /ɒ/"
                            className="w-full px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 border border-slate-200 rounded-xl
                              focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <CustomSelect
                            value={row.word_type ?? ''}
                            onChange={v => updateRow(row._key, 'word_type', v)}
                            options={WORD_TYPES}
                            placeholder="Chọn loại từ..."
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={row.meaning}
                            onChange={e => updateRow(row._key, 'meaning', e.target.value)}
                            placeholder="Enter meaning..."
                            className="w-full px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 border border-slate-200 rounded-xl
                              focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => removeRow(row._key)}
                            disabled={rows.length <= 1}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all
                              disabled:opacity-0 disabled:cursor-not-allowed cursor-pointer inline-flex items-center justify-center"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Sparkles size={14} className="text-blue-500 shrink-0" />
                <p className="text-xs font-semibold text-slate-500">AI will automatically suggest synonyms and IPA for new entries.</p>
              </div>
            </div>
          )}

          {/* Tab 2: Paste Text - Split Box (1) into 2 Side-by-Side Halves + Compact Sidebar Box (2) */}
          {activeTab === 'paste' && (
            <div className="max-w-6xl mx-auto w-full flex flex-col lg:flex-row gap-5 items-stretch">
              {/* Main Box (1): Paste Raw Text */}
              <div className="w-full flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <AlignLeft size={15} className="text-blue-500" />
                      <span>Paste Raw Text</span>
                    </div>
                    <button
                      onClick={() => { setPasteTextValue(''); setAiResult(null); setAiMessage('') }}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <X size={12} /> Clear All
                    </button>
                  </div>

                  {/* Symmetrical 2-card grid */}
                  <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Left Symmetrical Card: Raw Text Area */}
                      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between h-64 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                          <span className="text-xs font-extrabold text-slate-700">Văn bản đầu vào</span>
                          <span className={`text-xs font-semibold select-none pointer-events-none ${
                            charCount > 4500 ? 'text-red-500' : charCount > 3000 ? 'text-amber-500' : 'text-slate-400'
                          }`}>
                            {charCount} / 5000
                          </span>
                        </div>
                        <textarea
                          ref={textareaRef}
                          value={pasteTextValue}
                          onChange={e => {
                            if (e.target.value.length <= 5000) setPasteTextValue(e.target.value)
                          }}
                          placeholder="Nhập nội dung hoặc dán đoạn văn tại đây..."
                          className="w-full flex-1 text-xs sm:text-sm text-slate-700 resize-none focus:outline-none bg-transparent placeholder:text-slate-400 font-medium leading-relaxed"
                        />
                      </div>

                      {/* Right Symmetrical Card: AI Extracted Words Display */}
                      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between h-64 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                          <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                            <Sparkles size={14} className="text-emerald-500" />
                            <span>Từ vựng AI bóc tách</span>
                          </span>
                          {aiResult && aiResult.length > 0 && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                              {aiResult.length} từ
                            </span>
                          )}
                        </div>

                        {aiResult && aiResult.length > 0 ? (
                          <div className="flex-1 flex flex-col justify-between gap-2 overflow-hidden">
                            <p className="text-xs font-bold text-emerald-700 leading-snug">
                              {aiMessage}
                            </p>
                            <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[150px] pr-1 py-1">
                              {aiResult.map(w => (
                                <span
                                  key={w}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl shadow-2xs"
                                >
                                  ✓ {w}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-1">
                            <Sparkles size={26} className="text-slate-300 mb-1" />
                            <p className="text-xs font-bold text-slate-600">Chưa có từ vựng trích xuất</p>
                            <p className="text-[11px] text-slate-400 max-w-[200px]">Nhấn "Process Text with AI" để bóc tách từ vựng</p>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>

                {/* Process Button */}
                <div className="px-4 pb-4 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={loading || pasteTextValue.trim().length === 0}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white
                      bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition-all shadow-md shadow-blue-500/20
                      disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <Sparkles size={15} className="shrink-0" />
                    )}
                    Process Text with AI
                  </button>
                </div>
              </div>

              {/* Sidebar Box (2): HƯỚNG DẪN DÁN DỮ LIỆU (Width reduced to w-64) */}
              <div className="w-full lg:w-64 shrink-0 flex flex-col">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 h-full flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 mb-3.5 flex items-center gap-2">
                      <Info size={15} className="text-blue-500 shrink-0" />
                      <span>HƯỚNG DẪN DÁN DỮ LIỆU</span>
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1">
                          <FileText size={13} className="text-blue-500 shrink-0" />
                          <span>Dữ liệu có cấu trúc</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2 leading-relaxed font-medium">
                          Dán danh sách từ sổ tay hoặc từ điển. Hỗ trợ hầu hết các dấu phân cách.
                        </p>
                        <div className="bg-slate-50 rounded-xl p-2.5 text-[11px] font-mono text-slate-600 space-y-1 border border-slate-100">
                          <div>Từ – Nghĩa</div>
                          <div>Từ : Nghĩa</div>
                          <div>Từ (Phiên âm) – Nghĩa</div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100" />

                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1">
                          <AlignLeft size={13} className="text-purple-500 shrink-0" />
                          <span>Đoạn văn thô (AI bóc tách)</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2.5 leading-relaxed font-medium">
                          Dán nguyên đoạn văn hoặc bài báo. AI sẽ tự động trích xuất các từ vựng quan trọng và tạo định nghĩa.
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {['Bài báo', 'Đoạn văn', 'Hội thoại'].map(tag => (
                            <span key={tag} className="px-2.5 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-600 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-3 z-30 shadow-lg font-['Be_Vietnam_Pro']">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            {activeTab === 'manual' ? (
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 text-center justify-center">
                <div className="flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] flex items-center justify-center font-extrabold">V</span>
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-[10px] flex items-center justify-center font-extrabold">M</span>
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] flex items-center justify-center font-extrabold">!</span>
                </div>
                <span>{validRowsCount} từ chờ lưu</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 text-center justify-center">
                <span>{wordCount} từ chờ lưu</span>
              </div>
            )}

            {/* Buttons Layout: 2 buttons stacked vertically on ultra-narrow screens (<380px), side-by-side above 380px */}
            {activeTab === 'manual' ? (
              <div className="flex flex-col min-[380px]:flex-row gap-2.5 w-full sm:w-auto min-[380px]:items-center sm:gap-3">
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-extrabold text-slate-700 bg-white border border-slate-300
                    rounded-xl hover:bg-slate-50 transition-all text-center justify-center whitespace-nowrap cursor-pointer shadow-xs"
                >
                  Hủy bản nháp
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading || validRowsCount === 0}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-extrabold text-white
                    bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20
                    disabled:opacity-50 disabled:cursor-not-allowed text-center whitespace-nowrap cursor-pointer"
                >
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />}
                  <span>Lưu tất cả thay đổi</span>
                </button>
              </div>
            ) : (
              <div className="w-full sm:w-auto flex justify-center items-center">
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="w-full sm:w-56 px-6 py-2.5 text-xs sm:text-sm font-extrabold text-slate-700 bg-white border border-slate-300
                    rounded-xl hover:bg-slate-50 transition-all text-center justify-center whitespace-nowrap cursor-pointer shadow-xs"
                >
                  Hủy bản nháp
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </VocabLayout>
  )
}
