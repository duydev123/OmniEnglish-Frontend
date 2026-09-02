import { Trash2, Pencil, Plus, BookPlus } from 'lucide-react';

interface HighlightToolbarProps {
    show: boolean;
    position: { top: number; left: number };
    onHighlight: (color: string) => void;
    onStrikethrough: () => void;
    onClear: () => void;
    onNote: (note: string) => void;
    noteInputOpen?: boolean;
    noteText?: string;
    setNoteText?: (text: string) => void;
    setNoteInputOpen?: (open: boolean) => void;
    showNoteButton?: boolean;
    showAddVocabButton?: boolean;
    onAddVocab?: () => void;
}

export const HighlightToolbar = ({
    show,
    position,
    onHighlight,
    onStrikethrough,
    onClear,
    onNote,
    noteInputOpen,
    noteText,
    setNoteText,
    setNoteInputOpen,
    showNoteButton = false,
    showAddVocabButton = true,
    onAddVocab,
}: HighlightToolbarProps) => {
    if (!show) return null;

    return (
        <div
            className="highlight-toolbar-container fixed z-50 flex items-center gap-1 bg-slate-800 text-white px-2 py-1 rounded-lg shadow-lg border border-slate-700/80 -translate-x-1/2"
            style={{ top: position.top, left: position.left }}
        >
            {!noteInputOpen ? (
                <>
                    {/* Trash/Clear button */}
                    <button
                        onClick={onClear}
                        className="p-1 hover:bg-slate-700 rounded-md text-slate-300 hover:text-red-400 transition"
                        title="Xóa highlight"
                    >
                        <Trash2 size={13} />
                    </button>

                    {/* Pencil button - opens note input */}
                    {showNoteButton && (
                        <button
                            onClick={() => setNoteInputOpen?.(true)}
                            className="p-1 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white transition"
                            title="Thêm ghi chú"
                        >
                            <Pencil size={13} />
                        </button>
                    )}

                    <div className="h-3.5 w-px bg-slate-600 mx-0.5" />

                    {/* Color buttons */}
                    <button
                        onClick={() => onHighlight('#bae6fd')}
                        className="w-3.5 h-3.5 rounded-full bg-[#bae6fd] border border-white/20 hover:scale-110 transition"
                        title="Xanh dương"
                    />
                    <button
                        onClick={() => onHighlight('#fbcfe8')}
                        className="w-3.5 h-3.5 rounded-full bg-[#fbcfe8] border border-white/20 hover:scale-110 transition"
                        title="Hồng"
                    />
                    <button
                        onClick={() => onHighlight('#bbf7d0')}
                        className="w-3.5 h-3.5 rounded-full bg-[#bbf7d0] border border-white/20 hover:scale-110 transition"
                        title="Xanh lá"
                    />
                    <button
                        onClick={() => onHighlight('#fef08a')}
                        className="w-3.5 h-3.5 rounded-full bg-[#fef08a] border border-white/20 hover:scale-110 transition"
                        title="Vàng"
                    />

                    <div className="h-3.5 w-px bg-slate-600 mx-0.5" />

                    {/* Strikethrough */}
                    <button
                        onClick={onStrikethrough}
                        className="px-1.5 py-0.5 hover:bg-slate-700 rounded-md text-[10px] font-bold text-slate-100 line-through decoration-red-500 decoration-2 transition"
                        title="Gạch giữa chữ"
                    >
                        abc
                    </button>

                    {/* Plus button - opens note input */}
                    {showNoteButton && (
                        <button
                            onClick={() => setNoteInputOpen?.(true)}
                            className="p-1 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white transition"
                        >
                            <Plus size={13} />
                        </button>
                    )}

                    {/* Add Vocab Button - Thêm vào bộ từ vựng Flashcard */}
                    {showAddVocabButton && onAddVocab && (
                        <>
                            <div className="h-3.5 w-px bg-slate-600 mx-0.5" />
                            <button
                                onClick={onAddVocab}
                                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 rounded-md text-[11px] font-extrabold text-white flex items-center gap-1 transition shadow-xs"
                                title="Thêm từ vựng này vào bộ Flashcard"
                            >
                                <BookPlus size={13} />
                                <span>Thêm từ</span>
                            </button>
                        </>
                    )}
                </>
            ) : (
                // ✅ Note Input - ĐÃ SỬA
                <div className="flex items-center gap-1 p-0.5">
                    <input
                        type="text"
                        value={noteText || ''}
                        onChange={(e) => setNoteText?.(e.target.value)}
                        placeholder="Ghi chú..."
                        className="bg-slate-700 text-white text-[11px] px-1.5 py-0.5 rounded border border-slate-600 outline-none w-28"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && noteText?.trim()) {
                                onNote(noteText.trim());
                                setNoteText?.('');
                                setNoteInputOpen?.(false);
                            } else if (e.key === 'Escape') {
                                setNoteInputOpen?.(false);
                                setNoteText?.('');
                            }
                        }}
                    />
                    <button
                        onClick={() => {
                            if (noteText?.trim()) {
                                console.log('✅ onNote called with:', noteText.trim());
                                onNote(noteText.trim());
                                setNoteText?.('');
                                setNoteInputOpen?.(false);
                            }
                        }}
                        className="bg-[#1D4ED8] hover:bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded transition"
                    >
                        Lưu
                    </button>
                    <button
                        onClick={() => {
                            setNoteInputOpen?.(false);
                            setNoteText?.('');
                        }}
                        className="bg-slate-600 hover:bg-slate-500 text-slate-300 text-[9px] font-black px-1.5 py-0.5 rounded transition"
                    >
                        Hủy
                    </button>
                </div>
            )}
        </div>
    );
};