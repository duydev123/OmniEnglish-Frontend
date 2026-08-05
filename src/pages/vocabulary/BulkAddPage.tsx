import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, Sparkles, X,
  Info, FileText, AlignLeft, Lightbulb
} from 'lucide-react'
import VocabLayout from '../../components/vocabulary/layout/VocabLayout'
import { useToast } from '../../components/common/Toast'
import { bulkAddWords, pasteText, getCollection } from '../../services/vocabularyApi'
import type { AddWordPayload } from '../../types/vocabulary'

interface BulkRow extends AddWordPayload {
  _key: number
}

type BulkTab = 'manual' | 'paste'

const WORD_TYPES = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Pronoun', 'Preposition', 'Conjunction', 'Interjection']

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!id || id.startsWith('650000000000')) return
    getCollection(id)
      .then(col => setCollectionTitle(col.title))
      .catch(() => {})
  }, [id])

  function updateRow(key: number, field: keyof Omit<BulkRow, '_key'>, value: string) {
    setRows(prev => prev.map(r => r._key === key ? { ...r, [field]: value } : r))
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
    setLoading(true)
    try {
      if (activeTab === 'manual') {
        const valid = rows.filter(r => r.word.trim() && r.meaning.trim())
        if (valid.length === 0) {
          showToast('Vui lòng nhập ít nhất 1 từ có đầy đủ thông tin!', 'error')
          return
        }
        if (!id.startsWith('650000000000')) {
          await bulkAddWords(id, valid.map(({ _key: _k, ...rest }) => rest))
        }
        showToast(`✅ Đã thêm ${valid.length} từ vào bộ!`, 'success')
        setRows([makeRow(), makeRow(), makeRow()])
        navigate(`/vocabulary/${id}`)
      } else {
        const raw = pasteTextValue.trim()
        if (!raw) { showToast('Vui lòng dán văn bản!', 'error'); return }
        if (!id.startsWith('650000000000')) {
          const result = await pasteText(id, raw)
          setAiResult(result.extracted_words)
          setAiMessage(result.message)
          showToast(`🤖 AI đã thêm ${result.added_count} từ!`, 'success')
        } else {
          setAiResult(['Analyze', 'Demonstrate', 'Evaluate'])
          setAiMessage('Gemini AI successfully analyzed the text (Demo Mode)')
          showToast('🤖 AI đã thêm 3 từ mẫu!', 'success')
        }
      }
    } catch (err) {
      showToast(`❌ ${(err as Error).message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleDiscard() {
    if (activeTab === 'manual') clearAll()
    else { setPasteTextValue(''); setAiResult(null); setAiMessage('') }
    navigate(`/vocabulary/${id}`)
  }

  const wordCount = pasteTextValue.trim().split(/\s+/).filter(Boolean).length
  const charCount = pasteTextValue.length
  const validRowsCount = rows.filter(r => r.word.trim()).length

  return (
    <VocabLayout breadcrumbs={[
      { label: 'BASIC' },
      { label: 'VOCABULARY', href: '/vocabulary' },
      { label: 'BỘ TỪ VỰNG CỦA TÔI', href: '/vocabulary' },
      { label: collectionTitle.toUpperCase(), href: `/vocabulary/${id}` },
      { label: 'THÊM HÀNG LOẠT' },
    ]}>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">

          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate(`/vocabulary/${id}`)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Thêm hàng loạt
            </h1>
          </div>

          <div className="flex gap-0 border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px
                ${activeTab === 'manual'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px
                ${activeTab === 'paste'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Paste Text
            </button>
          </div>

          {activeTab === 'manual' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={addRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600
                      border border-blue-200 rounded-lg hover:bg-blue-50 transition-all"
                  >
                    <Plus size={14} /> Add New Row
                  </button>
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500
                      border border-slate-200 rounded-lg hover:bg-slate-100 transition-all"
                  >
                    <X size={14} /> Clear All
                  </button>
                </div>
                <span className="text-xs text-slate-400 hidden sm:block">
                  {validRowsCount} row{validRowsCount !== 1 ? 's' : ''} currently active
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/30">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-[28%]">Word</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-[20%]">IPA</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-[18%]">Part of Speech</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Meaning</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((row, i) => (
                      <tr key={row._key} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            value={row.word}
                            onChange={e => updateRow(row._key, 'word', e.target.value)}
                            placeholder={i === 0 ? 'Serendipity' : 'Required word...'}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg
                              focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            value={row.ipa ?? ''}
                            onChange={e => updateRow(row._key, 'ipa', e.target.value)}
                            placeholder="e.g. /ɒ/"
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg
                              focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            value={row.word_type ?? ''}
                            onChange={e => updateRow(row._key, 'word_type', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg
                              focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100
                              transition-all bg-white text-slate-700"
                          >
                            <option value="">Select...</option>
                            {WORD_TYPES.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            value={row.meaning}
                            onChange={e => updateRow(row._key, 'meaning', e.target.value)}
                            placeholder="Enter meaning..."
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg
                              focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                          />
                        </td>
                        <td className="px-2 py-2.5">
                          <button
                            onClick={() => removeRow(row._key)}
                            disabled={rows.length <= 1}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300
                              hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100
                              disabled:opacity-0 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center gap-2">
                <Sparkles size={14} className="text-blue-400 shrink-0" />
                <p className="text-xs text-slate-400">AI will automatically suggest synonyms and IPA for new entries.</p>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="flex flex-col lg:flex-row gap-5">
              <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <AlignLeft size={15} className="text-blue-500" />
                    Paste Raw Text
                  </div>
                  <button
                    onClick={() => { setPasteTextValue(''); setAiResult(null); setAiMessage('') }}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={12} /> Clear All
                  </button>
                </div>

                <div className="p-4">
                  <textarea
                    ref={textareaRef}
                    value={pasteTextValue}
                    onChange={e => {
                      if (e.target.value.length <= 5000) setPasteTextValue(e.target.value)
                    }}
                    placeholder={`Enter your text here...\n\nExample formats:\n– ephemeral: lasting for a very short time.\n– ubiquitous – existing or being everywhere at the same time.\n– Or just paste an article and let AI find the key terms!`}
                    rows={12}
                    className="w-full text-sm text-slate-700 resize-none focus:outline-none placeholder:text-slate-300
                      leading-relaxed"
                  />
                </div>

                {aiResult && aiResult.length > 0 && (
                  <div className="px-4 pb-4">
                    <p className="text-xs font-semibold text-emerald-600 mb-2">{aiMessage}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {aiResult.map(w => (
                        <span key={w} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium
                          bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                          ✓ {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="px-4 pb-4 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={loading || !pasteTextValue.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white
                      bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-sm
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles size={15} />
                    )}
                    Process Text with AI
                  </button>
                </div>
              </div>

              <div className="w-full lg:w-72 shrink-0 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Info size={14} className="text-blue-500" />
                    FORMAT GUIDE
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-2">
                        <FileText size={13} className="text-blue-500" />
                        Structured Data
                      </div>
                      <p className="text-xs text-slate-500 mb-2">
                        Copy-paste lists from dictionaries or notebooks. Most delimiters are supported.
                      </p>
                      <div className="bg-slate-50 rounded-lg p-3 text-xs font-mono text-slate-500 space-y-1">
                        <div>Word – Definition</div>
                        <div>Word : Definition</div>
                        <div>Word (Translation) – Note</div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100" />

                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-2">
                        <AlignLeft size={13} className="text-purple-500" />
                        Raw Narrative
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        Paste entire paragraphs or articles. Our AI will automatically identify academic and high-frequency terms.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {['News Articles', 'Essays', 'Transcripts'].map(tag => (
                          <span key={tag} className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-100" />

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{wordCount} words</span>
                      <span>{charCount} / 5000 chars</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb size={15} className="text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-700 mb-1">Pro Tip</p>
                      <p className="text-xs text-amber-600">
                        Use "Sync from Browser" for a faster workflow while reading articles and high-frequency terms.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-3 z-20">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            {activeTab === 'manual' ? (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold">V</span>
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-xs flex items-center justify-center font-bold">M</span>
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center justify-center font-bold">!</span>
                </div>
                <span>{validRowsCount} word{validRowsCount !== 1 ? 's' : ''} pending save</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>{wordCount} words pending save</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleDiscard}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200
                  rounded-lg hover:bg-slate-50 transition-all"
              >
                Discard Draft
              </button>
              {activeTab === 'manual' && (
                <button
                  onClick={handleSave}
                  disabled={loading || validRowsCount === 0}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white
                    bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Save All Changes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </VocabLayout>
  )
}
