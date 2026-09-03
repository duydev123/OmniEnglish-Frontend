import React, { useState, useRef, useEffect } from 'react'
import { FileText, Type, Bookmark } from 'lucide-react'
import type { ReadingPassageData } from '../../types/reading'
import { useTextHighlight } from '../../hooks/useTextHighlight'
import { HighlightToolbar } from '../common/HighlightToolbar'
import { AddWordModal } from '../vocabulary/modals/AddWordModal'
import { getMyCollections } from '../../services/vocabularyApi'
import type { VocabularyCollection } from '../../types/vocabulary'
import { useToast } from '../common/Toast'

interface ReadingPassageCardProps {
  passage: ReadingPassageData
  activeParagraphId?: string
}

export const ReadingPassageCard: React.FC<ReadingPassageCardProps> = ({ passage, activeParagraphId }) => {
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base')
  const [isBookmarked, setIsBookmarked] = useState(false)
  const passageRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  // Vocab Modal state
  const [isAddWordOpen, setIsAddWordOpen] = useState(false)
  const [selectedWord, setSelectedWord] = useState('')
  const [collections, setCollections] = useState<VocabularyCollection[]>([])

  // Load My Vocabulary Collections ("Bộ từ vựng của tôi")
  useEffect(() => {
    getMyCollections()
      .then((cols) => setCollections(cols))
      .catch((err) => console.warn('Could not load user collections:', err))
  }, [])

  const {
    showToolbar,
    toolbarPos,
    noteInputOpen,
    noteText,
    setNoteText,
    setNoteInputOpen,
    handleSelectionChange,
    applyAnnotation,
    selectedText,
  } = useTextHighlight({
    containerRefs: [passageRef],
  })

  // Handle mouseup for text selection
  const handleMouseUp = () => {
    handleSelectionChange()
  }

  const handleOpenAddVocabModal = () => {
    let wordToAdd = selectedText.trim()
    if (!wordToAdd) {
      const sel = window.getSelection()
      if (sel) {
        wordToAdd = sel.toString().trim()
      }
    }
    // Clean trailing punctuation
    wordToAdd = wordToAdd.replace(/^[^\w]+|[^\w]+$/g, '')

    if (!wordToAdd) {
      showToast('Vui lòng bôi đen từ vựng trong bài đọc trước khi thêm!', 'warning')
      return
    }

    // Refresh My Collections ("Bộ từ vựng của tôi")
    getMyCollections()
      .then((cols) => setCollections(cols))
      .catch(() => {})

    setSelectedWord(wordToAdd)
    setIsAddWordOpen(true)
  }

  const fontClasses = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base leading-relaxed',
    lg: 'text-lg leading-relaxed',
  }

  const toggleFontSize = () => {
    if (fontSize === 'sm') setFontSize('base')
    else if (fontSize === 'base') setFontSize('lg')
    else setFontSize('sm')
  }

  return (
    <div className="bg-white border border-slate-400/60 rounded-2xl p-5 sm:p-6 shadow-glow-4side flex flex-col gap-5 h-full relative">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1D4ED8] flex items-center justify-center">
            <FileText size={18} />
          </div>
          <h2 className="font-bold text-slate-800 text-lg tracking-tight">Reading Passage</h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleFontSize}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
            title="Kích thước chữ"
          >
            <Type size={16} />
            <span className="uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">{fontSize}</span>
          </button>
          <button
            onClick={() => setIsBookmarked((b) => !b)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isBookmarked ? 'bg-amber-50 text-amber-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title="Bookmark bài đọc"
          >
            <Bookmark size={16} className={isBookmarked ? 'fill-amber-600' : ''} />
          </button>
        </div>
      </div>

      {/* Passage Paragraphs container with Ref & Selection handler */}
      <div
        ref={passageRef}
        onMouseUp={handleMouseUp}
        className={`space-y-4 text-slate-700 font-normal ${fontClasses[fontSize]}`}
      >
        {passage.paragraphs.map((p, idx) => {
          const isHighlighted = p.highlighted || activeParagraphId === p.id

          return (
            <React.Fragment key={p.id || idx}>
              <p
                className={`transition-all duration-200 ${
                  isHighlighted
                    ? 'bg-blue-50/80 border-l-4 border-blue-600 p-4 rounded-r-xl text-slate-900 font-medium shadow-2xs'
                    : ''
                }`}
              >
                {p.text}
              </p>

              {/* Render optional image after 1st paragraph if image exists */}
              {idx === 0 && passage.imageUrl && (
                <div className="my-4 rounded-xl overflow-hidden border border-slate-200/80 shadow-xs max-h-72">
                  <img
                    src={passage.imageUrl}
                    alt={passage.passageTitle}
                    className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Floating Highlight & Add Vocab Toolbar */}
      <HighlightToolbar
        show={showToolbar}
        position={toolbarPos}
        onHighlight={(color) => applyAnnotation('highlight', color)}
        onStrikethrough={() => applyAnnotation('strikethrough')}
        onClear={() => applyAnnotation('clear')}
        onNote={(note) => applyAnnotation('note', undefined, note)}
        noteInputOpen={noteInputOpen}
        noteText={noteText}
        setNoteText={setNoteText}
        setNoteInputOpen={setNoteInputOpen}
        showNoteButton={true}
        showAddVocabButton={true}
        onAddVocab={handleOpenAddVocabModal}
      />

      {/* Add Flashcard Vocabulary Modal */}
      <AddWordModal
        open={isAddWordOpen}
        onClose={() => setIsAddWordOpen(false)}
        collections={collections}
        initialWord={selectedWord}
        onWordAdded={() => {
          showToast(`✨ Đã thêm từ "${selectedWord}" vào bộ từ vựng thành công!`, 'success')
          setIsAddWordOpen(false)
        }}
      />
    </div>
  )
}

export default ReadingPassageCard

