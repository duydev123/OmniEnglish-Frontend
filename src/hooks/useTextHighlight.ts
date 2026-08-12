// src/hooks/useTextHighlight.ts
import { useState, useCallback, useEffect } from 'react';

interface UseTextHighlightOptions {
    containerRefs: React.RefObject<HTMLElement | null>[];
    isContentEditable?: boolean;
    onHighlight?: (range: Range) => void;
    enableEditor?: boolean;
    editorRef?: React.RefObject<HTMLElement | null>; //  Thêm editorRef riêng
}

export const useTextHighlight = (options: UseTextHighlightOptions) => {
    const {
        containerRefs,
        isContentEditable = false,
        onHighlight,
        enableEditor = true,
        editorRef
    } = options;

    // State
    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
    const [noteInputOpen, setNoteInputOpen] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [lastColor, setLastColor] = useState<string>('#fef08a');
    const [currentHighlightSpan, setCurrentHighlightSpan] = useState<HTMLElement | null>(null);

    // Kiểm tra xem range có nằm trong bất kỳ container nào không
    const isInAnyContainer = useCallback((node: Node | null) => {
        if (!node) return false;
        return containerRefs.some(ref => ref.current?.contains(node));
    }, [containerRefs]);

    // Lấy container chứa node
    const getContainer = useCallback((node: Node | null) => {
        if (!node) return null;
        for (const ref of containerRefs) {
            if (ref.current?.contains(node)) {
                return ref.current;
            }
        }
        return null;
    }, [containerRefs]);

    //  Kiểm tra chính xác node có nằm trong editor không
    const isInEditor = useCallback((node: Node | null) => {
        if (!node) return false;
        return editorRef?.current?.contains(node) || false;
    }, [editorRef]);

    // Xóa highlight cũ trong vùng range
    const clearExistingHighlights = useCallback((range: Range) => {
        const container = getContainer(range.commonAncestorContainer);
        if (!container) return;

        const spans = container.querySelectorAll<HTMLElement>('span[data-annotation="true"]');
        const toRemove: Node[] = [];

        spans.forEach((span) => {
            if (range.intersectsNode(span)) {
                toRemove.push(span);
            }
        });

        toRemove.forEach((span) => {
            const parent = span.parentNode;
            if (parent) {
                while (span.firstChild) {
                    parent.insertBefore(span.firstChild, span);
                }
                parent.removeChild(span);
            }
        });

        container.normalize();
    }, [getContainer]);

    // Xử lý bôi đen → highlight (không hiện toolbar)
    const handleSelectionChange = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
            setShowToolbar(false);
            return;
        }

        const range = selection.getRangeAt(0);
        const inContainer = isInAnyContainer(range.commonAncestorContainer);
        if (!inContainer) {
            setShowToolbar(false);
            return;
        }

        //  Nếu selection ở editor và enableEditor = false → bỏ qua
        const inEditor = isInEditor(range.commonAncestorContainer);
        if (!enableEditor && inEditor) {
            setShowToolbar(false);
            return;
        }

        if (selection.toString().trim() === '') {
            setShowToolbar(false);
            return;
        }

        clearExistingHighlights(range);

        const colorToUse = lastColor;

        //  Nếu là editor và enableEditor = false, không highlight
        if (inEditor && !enableEditor) {
            setShowToolbar(false);
            return;
        }

        if (isContentEditable) {
            document.execCommand('hiliteColor', false, colorToUse);
        } else {
            const container = getContainer(range.commonAncestorContainer);
            if (!container) return;

            const span = document.createElement('span');
            span.setAttribute('data-annotation', 'true');
            span.style.backgroundColor = colorToUse;
            span.style.cursor = 'pointer';
            try {
                const contents = range.extractContents();
                span.appendChild(contents);
                range.insertNode(span);
            } catch (err) {
                console.error('Highlight failed:', err);
            }
        }

        selection.removeAllRanges();
        setShowToolbar(false);
        onHighlight?.(range);
    }, [isInAnyContainer, isInEditor, enableEditor, clearExistingHighlights, lastColor, isContentEditable, getContainer, onHighlight]);

    // Xử lý click vào highlight → hiện toolbar
    const handleHighlightClick = useCallback((e: React.MouseEvent | MouseEvent) => {
        const target = e.target as HTMLElement;
        const highlightSpan = target.closest<HTMLElement>('span[data-annotation="true"]');
        if (!highlightSpan) {
            setShowToolbar(false);
            setNoteInputOpen(false);
            setCurrentHighlightSpan(null);
            return;
        }

        //  Kiểm tra xem span có nằm trong editor không
        const inEditor = isInEditor(highlightSpan);
        if (!enableEditor && inEditor) {
            setShowToolbar(false);
            setCurrentHighlightSpan(null);
            return;
        }

        setCurrentHighlightSpan(highlightSpan);

        const rect = highlightSpan.getBoundingClientRect();
        setToolbarPos({
            top: rect.top - 48,
            left: rect.left + rect.width / 2,
        });
        setShowToolbar(true);

        // Tạo selection để apply annotation có thể dùng
        try {
            const range = document.createRange();
            range.selectNodeContents(highlightSpan);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
        } catch (err) {
            console.error('Failed to select highlight:', err);
        }
    }, [isInEditor, enableEditor]);

    const applyAnnotation = useCallback((type: 'highlight' | 'strikethrough' | 'clear' | 'note', color?: string, noteValue?: string) => {
        // Lấy span từ selection
        let span = currentHighlightSpan;

        if (!span) {
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
                setShowToolbar(false);
                return;
            }
            const range = selection.getRangeAt(0);
            span = range.commonAncestorContainer.nodeType === 3
                ? range.commonAncestorContainer.parentElement?.closest('span[data-annotation="true"]') as HTMLElement | null
                : (range.commonAncestorContainer as HTMLElement)?.closest?.('span[data-annotation="true"]') as HTMLElement | null;
        }

        if (!span) {
            setShowToolbar(false);
            return;
        }

        //  Kiểm tra editor
        const inEditor = isInEditor(span);
        if (!enableEditor && inEditor) {
            setShowToolbar(false);
            return;
        }

        const container = getContainer(span);
        if (!container) {
            setShowToolbar(false);
            setCurrentHighlightSpan(null);
            return;
        }

        // Clear
        if (type === 'clear') {
            const parent = span.parentNode;
            if (parent) {
                while (span.firstChild) {
                    parent.insertBefore(span.firstChild, span);
                }
                parent.removeChild(span);
                container.normalize();
            }
            setShowToolbar(false);
            setCurrentHighlightSpan(null);
            return;
        }

        // Highlight - đổi màu
        if (type === 'highlight' && color) {
            setLastColor(color);
            span.style.backgroundColor = color;
            setShowToolbar(false);
            return;
        }

        // Strikethrough
        if (type === 'strikethrough') {
            span.style.textDecoration = span.style.textDecoration === 'line-through' ? 'none' : 'line-through';
            span.style.textDecorationColor = '#ef4444';
            span.style.textDecorationThickness = '2px';
            setShowToolbar(false);
            return;
        }

        //  NOTE - XỬ LÝ GHI CHÚ
        if (type === 'note' && noteValue && noteValue.trim() !== '') {
            console.log(' Processing note:', noteValue);

            // Xóa badge cũ
            const oldBadge = span.querySelector('.note-badge-container');
            if (oldBadge) oldBadge.remove();

            // Tạo box ghi chú
            const noteBox = document.createElement('span');
            noteBox.className = 'note-badge-container';
            noteBox.style.display = 'inline-flex';
            noteBox.style.alignItems = 'center';
            noteBox.style.gap = '4px';
            noteBox.style.backgroundColor = '#fef3c7';
            noteBox.style.border = '2px dashed #f59e0b';
            noteBox.style.borderRadius = '0px';
            noteBox.style.padding = '0px 6px 0px 8px'; //  Giảm padding
            noteBox.style.fontSize = '12px'; //  Tăng font size
            noteBox.style.lineHeight = '1.4'; //  Điều chỉnh line-height
            noteBox.style.marginLeft = '4px';
            noteBox.style.verticalAlign = 'middle';
            noteBox.style.fontWeight = '500';
            noteBox.style.color = '#92400e';
            noteBox.style.height = '100%'; //  Tự động điều chỉnh
            noteBox.style.maxHeight = '24px'; //  Giới hạn chiều cao
            noteBox.style.overflow = 'hidden'; //  Ẩn phần tràn

            const noteTextSpan = document.createElement('span');
            noteTextSpan.textContent = noteValue.trim();
            noteTextSpan.style.maxWidth = '150px';
            noteTextSpan.style.overflow = 'hidden';
            noteTextSpan.style.textOverflow = 'ellipsis';
            noteTextSpan.style.whiteSpace = 'nowrap';

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '×';
            deleteBtn.style.background = 'transparent';
            deleteBtn.style.border = 'none';
            deleteBtn.style.color = '#92400e';
            deleteBtn.style.fontSize = '14px';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.padding = '0 2px';
            deleteBtn.style.opacity = '0.7';
            deleteBtn.title = 'Xóa ghi chú';
            deleteBtn.onmouseenter = () => { deleteBtn.style.opacity = '1'; };
            deleteBtn.onmouseleave = () => { deleteBtn.style.opacity = '0.7'; };
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                span.removeAttribute('data-note');
                span.title = '';
                const container2 = noteBox.parentNode;
                if (container2) {
                    container2.removeChild(noteBox);
                }
                span.style.borderBottom = 'none';
            };

            noteBox.appendChild(noteTextSpan);
            noteBox.appendChild(deleteBtn);
            span.appendChild(noteBox);

            span.style.borderBottom = '2px dashed #f59e0b';
            span.style.cursor = 'pointer';

            setShowToolbar(false);
            setNoteInputOpen(false);
            setNoteText('');
            return;
        }

        setShowToolbar(false);
    }, [getContainer, isInEditor, enableEditor, currentHighlightSpan]);

    // Gắn sự kiện click cho tất cả container
    useEffect(() => {
        const handles: { container: HTMLElement; handler: (e: MouseEvent) => void }[] = [];

        containerRefs.forEach((ref) => {
            const container = ref.current;
            if (!container) return;

            const handleClick = (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                const highlightSpan = target.closest<HTMLElement>('span[data-annotation="true"]');
                if (highlightSpan) {
                    handleHighlightClick(e);
                } else {
                    setShowToolbar(false);
                    setNoteInputOpen(false);
                    setCurrentHighlightSpan(null);
                }
            };

            container.addEventListener('click', handleClick);
            handles.push({ container, handler: handleClick });
        });

        return () => {
            handles.forEach(({ container, handler }) => {
                container.removeEventListener('click', handler);
            });
        };
    }, [containerRefs, handleHighlightClick]);

    // Click ra ngoài → ẩn toolbar
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const inAnyContainer = containerRefs.some(ref => ref.current?.contains(target));
            if (inAnyContainer || target.closest('.highlight-toolbar-container')) {
                return;
            }
            setShowToolbar(false);
            setNoteInputOpen(false);
            setCurrentHighlightSpan(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [containerRefs]);

    return {
        showToolbar,
        toolbarPos,
        noteInputOpen,
        noteText,
        setNoteInputOpen,
        setNoteText,
        handleSelectionChange,
        applyAnnotation,
        isSelectionInEditor: false,
        lastColor,
    };
};