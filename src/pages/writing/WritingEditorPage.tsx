import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '../../components/common/AppLayout';
import { writingApi } from '../../services/writingApi';
import { useToast } from '../../components/common/Toast';
import { getApiErrorMessage } from '../../utils/error';
import type {
  WritingPrompt,
  AIOutlineResponse,
  AICollocationsResponse,
  AISampleEssayResponse,
} from '../../types/writing';
import {
  Clock,
  Save,
  Send,
  Sparkles,
  Bot,
  ListOrdered,
  List as ListIcon,
  Bold,
  Italic,
  Underline,
  Maximize2,
  X,
  BookOpen,
  FileText,
  Loader2,
  User,
  Copy,
  ArrowLeft,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  type: 'text' | 'outline' | 'collocations' | 'sample';
  text?: string;
  data?: any;
  loading?: boolean;
  isError?: boolean;
  tip?: string;
  timestamp: string;
}

export const WritingEditorPage: React.FC = () => {
  const { promptId } = useParams<{ promptId: string }>();
  const [searchParams] = useSearchParams();
  const isResetMode = searchParams.get('mode') === 'reset' || searchParams.get('reset') === 'true';
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [prompt, setPrompt] = useState<WritingPrompt | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState<boolean>(true);

  // Editor State
  const [essayContent, setEssayContent] = useState<string>('');
  const [wordCount, setWordCount] = useState<number>(0);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(true);
  const [savingDraft, setSavingDraft] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Assistant & Modals State
  const [aiModalType, setAiModalType] = useState<'OUTLINE' | 'COLLOCATIONS' | 'SAMPLE' | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiOutline] = useState<AIOutlineResponse | null>(null);
  const [aiCollocations] = useState<AICollocationsResponse | null>(null);
  const [aiSample] = useState<AISampleEssayResponse | null>(null);

  const [assistantInput, setAssistantInput] = useState<string>('');
  const [imageModalOpen, setImageModalOpen] = useState<boolean>(false);

  const editorDivRef = useRef<HTMLDivElement>(null);

  const [descriptionHtml, setDescriptionHtml] = useState<string>('');
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(true);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'advanced'>('medium');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      type: 'text',
      text: 'Xin chào! Tôi là Writing Assistant. Hãy chọn một chức năng bên dưới hoặc đặt câu hỏi để tôi hỗ trợ bạn viết bài nhé! 🚀',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const taskDescContainerRef = useRef<HTMLDivElement | null>(null);

  // Exit Confirmation Modal State
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [pendingNavigationUrl, setPendingNavigationUrl] = useState<string>('/practice-modules');

  const handleRequestExit = (targetUrl: string = '/practice-modules') => {
    if (essayContent && essayContent.trim().length > 0) {
      setPendingNavigationUrl(targetUrl);
      setShowExitModal(true);
    } else {
      navigate(targetUrl);
    }
  };

  const handleConfirmSaveAndExit = async () => {
    if (!promptId) return;
    if (!essayContent || !essayContent.trim()) {
      setShowExitModal(false);
      navigate(pendingNavigationUrl);
      return;
    }
    setSavingDraft(true);
    try {
      await writingApi.saveDraft({
        prompt_id: promptId,
        essay_content: essayContent,
        word_count: wordCount,
        time_spent_seconds: timeSpentSeconds,
      });
      showToast('Đã lưu nháp bài viết thành công!', 'success');
    } catch {
      showToast('Lỗi khi lưu nháp bài viết', 'error');
    } finally {
      setSavingDraft(false);
      setShowExitModal(false);
      navigate(pendingNavigationUrl);
    }
  };

  const handleConfirmExitWithoutSave = () => {
    setShowExitModal(false);
    navigate(pendingNavigationUrl);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (essayContent && essayContent.trim().length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [essayContent]);

  // Initialize descriptionHtml & draft content when prompt changes
  useEffect(() => {
    if (prompt?.task_description) {
      setDescriptionHtml(prompt.task_description);
    }
    if (!loadingPrompt && prompt && editorDivRef.current) {
      if (isResetMode) {
        editorDivRef.current.innerText = '';
        setEssayContent('');
        setWordCount(0);
        setTimeSpentSeconds(0);
      } else if (prompt.draft_content && !editorDivRef.current.innerText.trim()) {
        editorDivRef.current.innerHTML = prompt.draft_content;
        setEssayContent(prompt.draft_content);
        const count = prompt.draft_content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
        setWordCount(count);
        if (prompt.time_spent_seconds) {
          setTimeSpentSeconds(prompt.time_spent_seconds);
        }
      }
    }
  }, [prompt, loadingPrompt, isResetMode]);

  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });

  const checkActiveFormats = () => {
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
      });
    } catch {
      // ignore
    }
  };




  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimeSpentSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Fetch Prompt Data
  useEffect(() => {
    const fetchPrompt = async () => {
      if (!promptId) return;
      setLoadingPrompt(true);
      try {
        const data = await writingApi.getPromptById(promptId);
        setPrompt(data);
        if (data.draft_content) {
          setEssayContent(data.draft_content);
          const words = data.draft_content.trim() ? data.draft_content.trim().split(/\s+/).length : 0;
          setWordCount(words);
        }
        if (data.time_spent_seconds) {
          setTimeSpentSeconds(data.time_spent_seconds);
        }
      } catch (err) {
        showToast(getApiErrorMessage(err, 'Lỗi khi tải đề bài writing'), 'error');
      } finally {
        setLoadingPrompt(false);
      }
    };
    fetchPrompt();
  }, [promptId]);

  // Handle Content Input Change with strict 300 words limit
  const MAX_WORDS = 300;
  const handleEditorInput = () => {
    if (!editorDivRef.current) return;
    const html = editorDivRef.current.innerHTML || '';
    const text = editorDivRef.current.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean) : [];

    if (words.length > MAX_WORDS) {
      showToast(`Bài viết đã đạt giới hạn tối đa ${MAX_WORDS} từ! Không thể nhập thêm.`, 'warning');
      const truncatedText = words.slice(0, MAX_WORDS).join(' ');
      editorDivRef.current.innerText = truncatedText;

      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorDivRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);

      setEssayContent(truncatedText);
      setWordCount(MAX_WORDS);
      checkActiveFormats();
      return;
    }

    setEssayContent(html);
    setWordCount(words.length);
    checkActiveFormats();
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!promptId) return;
    if (!essayContent || !essayContent.trim()) {
      showToast('Bài viết chưa có nội dung để lưu nháp!', 'warning');
      return;
    }
    setSavingDraft(true);
    try {
      await writingApi.saveDraft({
        prompt_id: promptId,
        essay_content: essayContent,
        word_count: wordCount,
        time_spent_seconds: timeSpentSeconds,
      });
      showToast('Đã lưu nháp bài viết thành công!', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Lỗi khi lưu nháp bài viết'), 'error');
    } finally {
      setSavingDraft(false);
    }
  };

  // Submit Essay (UC-13 & UC-14)
  const handleSubmitEssay = async () => {
    if (!promptId) return;
    if (!essayContent.trim()) {
      showToast('Vui lòng nhập nội dung bài viết trước khi nộp!', 'warning');
      return;
    }
    if (wordCount > MAX_WORDS) {
      showToast(`Bài viết vượt quá giới hạn tối đa ${MAX_WORDS} từ. Vui lòng rút gọn trước khi nộp!`, 'error');
      return;
    }
    setSubmitting(true);
    try {
      // Auto-save latest essay content to draft state before AI submission
      await writingApi.saveDraft({
        prompt_id: promptId,
        essay_content: essayContent,
        word_count: wordCount,
        time_spent_seconds: timeSpentSeconds,
      });

      const res = await writingApi.submitEssay({
        prompt_id: promptId,
        essay_content: essayContent,
        word_count: wordCount,
        time_spent_seconds: timeSpentSeconds,
      });
      showToast('Nộp bài thành công! Đang chuyển tới trang đánh giá AI...', 'success');
      navigate(`/writing/review/${res.session_id}`);
    } catch (err: any) {
      showToast(getApiErrorMessage(err, 'Lỗi khi nộp bài essay'), 'error');
    } finally {
      setSubmitting(false);
    }
  };


  const applyFormat = (command: 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList') => {
    if (editorDivRef.current) {
      editorDivRef.current.focus();
    }
    document.execCommand(command, false, undefined);
    handleEditorInput();
    checkActiveFormats();
  };

  // Insert Vocabulary Chip into Editor at Cursor Selection Point
  const handleInsertWord = (word: string) => {
    const editor = editorDivRef.current;
    if (!editor) return;
    editor.focus();

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(` ${word} `);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editor.appendChild(document.createTextNode(` ${word} `));
    }

    handleEditorInput();
    showToast(`Đã thêm từ "${word}" vào bài viết`, 'info');
  };

  // Render formatted text (bold markers, newlines)
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {i > 0 && <br />}
        {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="font-extrabold">{part}</strong> : part
        )}
      </span>
    ));
  };

  // Scroll chat to bottom
  const scrollChatToBottom = () => {
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 100);
  };

  // Trigger AI action from chat quick-action buttons
  const handleTriggerAiAction = async (action: 'OUTLINE' | 'COLLOCATIONS' | 'SAMPLE') => {
    if (!promptId) return;
    const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const labelMap = { OUTLINE: 'Dàn bài AI', COLLOCATIONS: 'Collocations', SAMPLE: 'Bài mẫu' };
    const difficultyMap = {
      easy: 'Band 6.0-7.0',
      medium: 'Band 7.0-8.0',
      advanced: 'Band 8.0-9.0',
    };

    // User bubble
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      type: 'text',
      text: `Hãy tạo ${labelMap[action]} (${difficultyMap[difficulty]}) cho bài viết này`,
      timestamp: now,
    };

    // AI loading bubble
    const loadingMsg: ChatMessage = {
      id: `ai-loading-${Date.now()}`,
      sender: 'ai',
      type: action === 'OUTLINE' ? 'outline' : action === 'COLLOCATIONS' ? 'collocations' : 'sample',
      loading: true,
      timestamp: now,
    };

    setChatMessages(prev => [...prev, userMsg, loadingMsg]);
    scrollChatToBottom();
    setAiLoading(true);

    try {
      const res = await writingApi.getAiAssistance(
        promptId,
        action === 'SAMPLE' ? 'SAMPLE_ESSAY' : action,
        undefined,
        difficulty
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        type: action === 'OUTLINE' ? 'outline' : action === 'COLLOCATIONS' ? 'collocations' : 'sample',
        data: res,
        timestamp: now,
      };

      setChatMessages(prev => prev.filter(m => m.id !== loadingMsg.id).concat(aiMsg));
    } catch {
      const errMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        type: 'text',
        text: 'Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại.',
        isError: true,
        tip: 'Kiểm tra kết nối mạng hoặc thử lại sau vài giây.',
        timestamp: now,
      };
      setChatMessages(prev => prev.filter(m => m.id !== loadingMsg.id).concat(errMsg));
    } finally {
      setAiLoading(false);
      scrollChatToBottom();
    }
  };

  // Send custom user message
  // WritingEditorPage.tsx

  const handleSendCustomMessage = async () => {
    const text = assistantInput.trim();
    if (!text) return;

    const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    // 1. Thêm tin nhắn user
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      type: 'text',
      text,
      timestamp: now,
    };

    // 2. Thêm tin nhắn loading của AI
    const loadingMsg: ChatMessage = {
      id: `ai-loading-${Date.now()}`,
      sender: 'ai',
      type: 'text',
      text: 'Đang suy nghĩ...',
      loading: true,
      timestamp: now,
    };

    setChatMessages(prev => [...prev, userMsg, loadingMsg]);
    setAssistantInput('');
    scrollChatToBottom();

    try {
      // GỌI AI THẬT
      const result = await writingApi.answerQuestion(promptId!, text);

      // Cập nhật tin nhắn AI
      const aiReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        type: 'text',
        text: result.answer || 'Xin lỗi, mình chưa hiểu rõ câu hỏi. Bạn có thể hỏi cụ thể hơn về dàn bài, từ vựng, hay cấu trúc câu không?',
        timestamp: now,
      };

      setChatMessages(prev => prev.filter(m => m.id !== loadingMsg.id).concat(aiReply));
    } catch (error) {
      // Xử lý lỗi
      const errMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        type: 'text',
        text: 'Xin lỗi, mình không thể xử lý câu hỏi này. Vui lòng thử lại sau!',
        isError: true,
        tip: 'Kiểm tra kết nối mạng hoặc thử lại sau vài giây.',
        timestamp: now,
      };
      setChatMessages(prev => prev.filter(m => m.id !== loadingMsg.id).concat(errMsg));
      showToast('Lỗi khi gửi câu hỏi', 'error');
    } finally {
      scrollChatToBottom();
    }
  };


  // Format Timer Format (e.g. 44:59)
  const formatTimer = (totalSec: number) => {
    const targetSec = (prompt?.time_limit_minutes || 40) * 60;
    const remainingSec = Math.max(0, targetSec - totalSec);
    const mins = Math.floor(remainingSec / 60);
    const secs = remainingSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loadingPrompt || !prompt) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Luyện tập', href: '/practice-modules' }, { label: 'Luyện viết', href: '/practice-modules/writing' }, { label: 'Soạn thảo' }]}>
        <div className="flex flex-col items-center justify-center min-h-[600px]">
          <Loader2 className="w-10 h-10 text-[#1D4ED8] animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-600">Đang tải trình soạn thảo bài viết Writing...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[{ label: 'Luyện tập', href: '/practice-modules' }, { label: 'Luyện viết', href: '/practice-modules/writing' }, { label: prompt.title }]}>
      <div className="p-3 sm:p-6 max-w-[1600px] mx-auto font-['Be_Vietnam_Pro']">

        {/* 3-Column Layout Matching Screenshot 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

          {/* ================= LEFT COLUMN: Task Description & Reference Image (3 cols) ================= */}
          <div className="lg:col-span-3 flex flex-col space-y-4">
            {/* Task Description Box */}
            <div className="bg-white rounded-3xl border border-slate-400/60 p-5 shadow-glow-4side flex-1 flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-black text-[#1D4ED8] bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-blue-100">
                    {prompt.task_type === 'WITH_GRAPH' ? 'IELTS Writing Task 1' : 'IELTS Writing Task 2'}
                  </span>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Task Description
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 leading-snug mb-3 tracking-tight">
                  {prompt.title}
                </h2>
                <div
                  ref={taskDescContainerRef}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-sm sm:text-base font-semibold text-slate-800 leading-relaxed font-['Be_Vietnam_Pro'] overflow-y-auto max-h-[500px]"
                >
                  &ldquo;<span dangerouslySetInnerHTML={{ __html: descriptionHtml }} />&rdquo;
                </div>
              </div>
            </div>

            {/* Reference Image Box (For Chart / Graph Tasks ONLY) */}
            {prompt.task_type === 'WITH_GRAPH' && prompt.reference_image_url && (
              <div className="bg-white rounded-3xl border border-slate-400/60 p-4 shadow-glow-4side shrink-0">
                <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer">
                  <img
                    src={prompt.reference_image_url}
                    alt="Reference Chart"
                    className="w-full h-48 sm:h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                    onClick={() => setImageModalOpen(true)}
                  />
                  <button
                    onClick={() => setImageModalOpen(true)}
                    className="absolute bottom-3 right-3 px-3 py-1.5 bg-slate-900/80 text-white rounded-xl hover:bg-slate-900 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-md"
                    title="Phóng to ảnh"
                  >
                    <Maximize2 size={14} />
                    <span>Xem ảnh đề bài</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ================= CENTER COLUMN: Editor & Writing Controls (5 cols) ================= */}
          <div className={`flex flex-col space-y-4 justify-between transition-all duration-300 ${isAiAssistantOpen ? 'lg:col-span-5' : 'lg:col-span-9'}`}>

            {/* Header Toolbar: Back Button + Prompt Title + Timer + Analyze Button */}
            <div className="bg-white rounded-2xl border border-slate-400/60 p-3 sm:p-4 flex items-center justify-between gap-3 shadow-glow-4side shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleRequestExit('/practice-modules')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                  title="Quay lại danh sách bài tập"
                >
                  <ArrowLeft size={14} />
                  <span className="hidden sm:inline">Quay lại</span>
                </button>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* AI Toggle Button */}
                <button
                  onClick={() => setIsAiAssistantOpen((v) => !v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors ${isAiAssistantOpen
                    ? "bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] border border-blue-200"
                    : "bg-[#1D4ED8]/10 hover:bg-[#1D4ED8]/20 text-[#1D4ED8]"
                    }`}
                  title={isAiAssistantOpen ? "Ẩn trợ lý ảo" : "Hiện trợ lý ảo"}
                >
                  <Bot size={14} />
                  <span className="hidden sm:inline">{isAiAssistantOpen ? "Hide AI" : "Show AI"}</span>
                </button>

                {/* Timer Badge */}
                <div
                  onClick={() => setTimerRunning((v) => !v)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Bấm để tạm dừng/tiếp tục đếm giờ"
                >
                  <Clock size={14} className="text-slate-500" />
                  <span>{formatTimer(timeSpentSeconds)}</span>
                </div>

                {/* Analyze / Submit Button */}
                <button
                  onClick={handleSubmitEssay}
                  disabled={submitting}
                  className="px-5 py-2 bg-[#1D4ED8] hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                  <span>Analyze</span>
                </button>
              </div>
            </div>

            {/* Rich Text Editor Container */}
            <div className="bg-white rounded-3xl border border-slate-400/60 shadow-glow-4side overflow-hidden flex flex-col flex-1 min-h-[580px]">

              {/* Formatting Toolbar */}
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-slate-600">
                <button
                  type="button"
                  className={`p-1.5 rounded-lg font-extrabold cursor-pointer transition-colors ${activeFormats.bold ? "bg-blue-100 text-[#1D4ED8] ring-1 ring-blue-300" : "hover:bg-slate-200 hover:text-slate-900"}`}
                  title="In đậm (Bold)"
                  onClick={() => applyFormat('bold')}
                >
                  <Bold size={16} />
                </button>
                <button
                  type="button"
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${activeFormats.italic ? "bg-blue-100 text-[#1D4ED8] ring-1 ring-blue-300" : "hover:bg-slate-200 hover:text-slate-900"}`}
                  title="In nghiêng (Italic)"
                  onClick={() => applyFormat('italic')}
                >
                  <Italic size={16} />
                </button>
                <button
                  type="button"
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${activeFormats.underline ? "bg-blue-100 text-[#1D4ED8] ring-1 ring-blue-300" : "hover:bg-slate-200 hover:text-slate-900"}`}
                  title="Gạch chân (Underline)"
                  onClick={() => applyFormat('underline')}
                >
                  <Underline size={16} />
                </button>
                <div className="h-4 w-px bg-slate-300 mx-1" />
                <button
                  type="button"
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${activeFormats.insertUnorderedList ? "bg-blue-100 text-[#1D4ED8] ring-1 ring-blue-300" : "hover:bg-slate-200 hover:text-slate-900"}`}
                  title="Danh sách dấu chấm (Bullet List)"
                  onClick={() => applyFormat('insertUnorderedList')}
                >
                  <ListIcon size={16} />
                </button>
                <button
                  type="button"
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${activeFormats.insertOrderedList ? "bg-blue-100 text-[#1D4ED8] ring-1 ring-blue-300" : "hover:bg-slate-200 hover:text-slate-900"}`}
                  title="Danh sách số (Numbered List)"
                  onClick={() => applyFormat('insertOrderedList')}
                >
                  <ListOrdered size={16} />
                </button>
              </div>

              {/* True WYSIWYG ContentEditable Input */}
              <div
                ref={editorDivRef}
                contentEditable
                onInput={() => { handleEditorInput(); checkActiveFormats(); }}
                onMouseUp={checkActiveFormats}
                onKeyUp={checkActiveFormats}
                className="w-full flex-1 p-5 text-sm sm:text-base text-slate-800 outline-none leading-relaxed font-['Be_Vietnam_Pro'] min-h-[460px] overflow-y-auto cursor-text select-text [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:my-1"
              />

              {/* Footer Status Bar: Word Count & Save Draft */}
              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs font-extrabold text-slate-600 shrink-0">
                <div className="flex items-center gap-3">
                  <span>
                    WORDS: <strong className={wordCount >= 300 ? "text-red-600 font-black" : wordCount >= 250 ? "text-emerald-600 font-black" : "text-[#1D4ED8]"}>{wordCount}</strong> / 300 (MAX)
                  </span>
                  <div className="w-28 h-2 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${wordCount >= 300 ? "bg-red-500" : wordCount >= 250 ? "bg-emerald-500" : "bg-[#1D4ED8]"}`}
                      style={{
                        width: `${Math.min(100, (wordCount / 300) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveDraft}
                  disabled={savingDraft}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 hover:text-blue-700 font-extrabold cursor-pointer transition-colors"
                >
                  {savingDraft ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Save Draft</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: Writing Assistant Chat Drawer ================= */}
          {isAiAssistantOpen && (
            <div className="lg:col-span-4 flex flex-col">
              <div className="bg-white rounded-3xl border border-slate-400/60 shadow-glow-4side flex flex-col h-full min-h-[660px] overflow-hidden">
                <div className="px-4 py-3 bg-[#1D4ED8] text-white flex items-center justify-between shadow-xs shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black text-xs">
                      <Bot size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs tracking-tight">Writing Assistant</h3>
                      <p className="text-[10px] text-blue-100 font-medium">Trợ lý ảo hỗ trợ viết bài</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 rounded-full text-[9px] font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Active
                  </span>
                </div>

                <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/60">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${msg.sender === 'user' ? 'bg-slate-800 text-white' : 'bg-[#1D4ED8] text-white'
                          }`}
                      >
                        {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                      </div>
                      <div className={`flex flex-col gap-1 max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-xs font-semibold leading-relaxed shadow-3xs ${msg.sender === 'user'
                            ? 'bg-[#1D4ED8] text-white rounded-tr-none'
                            : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                            }`}
                        >
                          {msg.type === 'text' && renderFormattedText(msg.text || '')}

                          {msg.loading && (
                            <div className="flex items-center gap-2 py-1">
                              <Loader2 size={12} className="animate-spin text-slate-400" />
                              <span className="text-[11px] text-slate-400 font-medium font-['Be_Vietnam_Pro']">Assistant is thinking...</span>
                            </div>
                          )}

                          {/* Render Rich outline cards */}
                          {!msg.loading && msg.type === 'outline' && msg.data && (
                            <div className="space-y-3 min-w-[240px] max-w-sm">
                              <h4 className="font-black text-xs text-indigo-900 border-b border-indigo-100 pb-1.5 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                                <Sparkles size={13} className="text-indigo-600" /> AI Suggested Outline
                              </h4>
                              {(msg.data.outline || []).map((sec: any, sIdx: number) => (
                                <div key={sIdx} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5">
                                  <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wide block">{sec.title}</span>
                                  <ul className="space-y-1">
                                    {(sec.sub_points || []).map((pt: string, pIdx: number) => (
                                      <li key={pIdx} className="text-[11px] text-slate-600 font-semibold flex items-start gap-1">
                                        <span className="text-indigo-500 font-bold">•</span>
                                        <span>{pt}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Render Rich Collocations Suggestions */}
                          {!msg.loading && msg.type === 'collocations' && msg.data && (
                            <div className="space-y-3 min-w-[250px] max-w-sm">
                              <h4 className="font-black text-xs text-purple-900 border-b border-purple-100 pb-1.5 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                                <BookOpen size={13} className="text-purple-600" /> Advanced Collocations
                              </h4>
                              {(msg.data.suggestions || []).map((g: any, gIdx: number) => (
                                <div key={gIdx} className="space-y-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                                  <span className="text-[10px] font-black text-purple-700 uppercase tracking-wide block mb-1">{g.category}</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(g.items || []).map((item: any, iIdx: number) => {
                                      const isObj = typeof item === 'object' && item !== null;
                                      const wordStr = isObj ? item.word : String(item);
                                      const tooltipText = isObj
                                        ? `${item.meaning_vi || item.meaning} | Ex: ${item.example}`
                                        : 'Click to insert into your essay';
                                      return (
                                        <button
                                          key={iIdx}
                                          onClick={() => handleInsertWord(wordStr)}
                                          className="px-2.5 py-1 bg-white hover:bg-purple-100 hover:text-purple-800 border border-purple-100 text-purple-700 text-[10px] font-black rounded-lg cursor-pointer transition-colors inline-block"
                                          title={tooltipText}
                                        >
                                          {wordStr}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Render Sample Essay response */}
                          {!msg.loading && msg.type === 'sample' && msg.data && (
                            <div className="space-y-3.5 min-w-[260px] max-w-md">
                              <div className="border-b border-emerald-100 pb-2 mb-2 flex items-center justify-between">
                                <h4 className="font-black text-xs text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                                  <FileText size={13} className="text-emerald-600" /> AI Model Essay ({difficulty === 'easy' ? 'Band 6.0-7.0' : difficulty === 'medium' ? 'Band 7.0-8.0' : 'Band 8.0-9.0'})
                                </h4>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(msg.data.full_text);
                                    showToast('Đã copy bài viết mẫu vào clipboard!', 'success');
                                  }}
                                  className="text-[10px] font-black text-[#1D4ED8] hover:underline flex items-center gap-1 cursor-pointer"
                                  title="Copy toàn bộ bài viết mẫu"
                                >
                                  <Copy size={10} />
                                  <span>Copy</span>
                                </button>
                              </div>
                              <h5 className="text-[11px] font-extrabold text-slate-800 leading-snug">{msg.data.sample_title}</h5>
                              <p className="text-[11px] text-slate-600 leading-relaxed font-semibold whitespace-pre-line bg-slate-50 border border-slate-100 rounded-xl p-3 max-h-48 overflow-y-auto">
                                {msg.data.full_text}
                              </p>
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">Good Practices:</span>
                                <ul className="space-y-1">
                                  {(msg.data.good_practices || []).map((gp: string, gpIdx: number) => (
                                    <li key={gpIdx} className="text-[10.5px] text-slate-600 font-semibold flex items-start gap-1 leading-relaxed">
                                      <span className="text-emerald-500 font-bold">•</span>
                                      <span>{gp}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {msg.isError && msg.tip && (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10.5px] text-amber-800 font-semibold">
                              <strong>💡 AI Tip:</strong> {msg.tip}
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] font-medium text-slate-400 px-1">{msg.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500">Độ khó:</span>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'advanced')}
                      className="text-[10px] px-2 py-1 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1D4ED8]"
                    >
                      <option value="easy">🟢 Dễ (Band 6-7)</option>
                      <option value="medium">🟡 Trung bình (Band 7-8)</option>
                      <option value="advanced">🔴 Nâng cao (Band 8-9)</option>
                    </select>
                  </div>
                </div>

                <div className="px-3 py-2 bg-slate-100/90 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto shrink-0">
                  <button
                    onClick={() => handleTriggerAiAction('OUTLINE')}
                    disabled={aiLoading}
                    className="px-2.5 py-1.5 bg-white hover:bg-blue-50 border border-blue-200 text-[#1D4ED8] rounded-xl font-extrabold text-[10.5px] whitespace-nowrap transition-colors shadow-2xs cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <Sparkles size={12} className="text-amber-500" />
                    <span>Dàn bài AI</span>
                  </button>

                  <button
                    onClick={() => handleTriggerAiAction('COLLOCATIONS')}
                    disabled={aiLoading}
                    className="px-2.5 py-1.5 bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 rounded-xl font-extrabold text-[10.5px] whitespace-nowrap transition-colors shadow-2xs cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <BookOpen size={12} />
                    <span>Collocations</span>
                  </button>

                  <button
                    onClick={() => handleTriggerAiAction('SAMPLE')}
                    disabled={aiLoading}
                    className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-extrabold text-[10.5px] whitespace-nowrap transition-colors shadow-2xs cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <FileText size={12} />
                    <span>Bài mẫu</span>
                  </button>
                </div>

                <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={assistantInput}
                      onChange={(e) => setAssistantInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendCustomMessage();
                        }
                      }}
                      placeholder="Đặt câu hỏi cho AI Assistant..."
                      className="flex-1 px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1D4ED8] focus:bg-white transition-all"
                    />
                    <button
                      onClick={handleSendCustomMessage}
                      disabled={!assistantInput.trim()}
                      className="p-2 bg-[#1D4ED8] hover:bg-blue-800 text-white rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                      title="Gửi tin nhắn"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Zoom Modal */}
      {imageModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <div className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-900/80 text-white rounded-full hover:bg-slate-900 z-10 cursor-pointer"
            >
              <X size={18} />
            </button>
            <img
              src={
                prompt.reference_image_url ||
                'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80'
              }
              alt="Reference Chart Full"
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* AI Assistance Modal (UC-09, UC-10, UC-11) */}
      {aiModalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            <button
              onClick={() => setAiModalType(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
            >
              <X size={20} />
            </button>

            {aiLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#1D4ED8] animate-spin mb-3" />
                <p className="text-xs font-bold text-slate-600">AI Gemini đang tạo gợi ý...</p>
              </div>
            ) : (
              <div>
                {/* UC-09: AI Essay Outline */}
                {aiModalType === 'OUTLINE' && aiOutline && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Sparkles className="text-yellow-500" /> Dàn Bài Gợi Ý AI (AI Essay Outline)
                    </h2>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                      {aiOutline.outline.map((sec, i) => (
                        <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                          <h3 className="font-extrabold text-sm text-[#1D4ED8]">{sec.title}</h3>
                          <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 font-medium">
                            {sec.sub_points.map((pt, j) => (
                              <li key={j}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* UC-10: Collocation Suggestions */}
                {aiModalType === 'COLLOCATIONS' && aiCollocations && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <BookOpen className="text-purple-600" /> Collocations & Từ Vựng Gợi Ý
                    </h2>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      {aiCollocations.suggestions.map((grp, i) => (
                        <div key={i} className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 space-y-2">
                          <h3 className="font-extrabold text-xs text-purple-800 uppercase tracking-wider">
                            {grp.category}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {grp.items.map((item, j) => (
                              <button
                                key={j}
                                onClick={() => handleInsertWord(item.word)}
                                className="px-3 py-1.5 bg-white border border-purple-200 text-slate-800 font-extrabold text-xs rounded-xl hover:bg-purple-100 transition-colors shadow-2xs cursor-pointer"
                              >
                                {item.word}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* UC-11: Sample Essay */}
                {aiModalType === 'SAMPLE' && aiSample && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <FileText className="text-emerald-600" /> Bài Mẫu Band 9.0 (Sample Essay)
                    </h2>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 text-xs">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium leading-relaxed whitespace-pre-line text-slate-800">
                        {aiSample.full_text}
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                        <h3 className="font-extrabold text-xs text-emerald-800 uppercase tracking-wider">
                          Ghi chú cấu trúc & Ưu điểm:
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-slate-700">
                          {aiSample.good_practices.map((practice, idx) => (
                            <li key={idx}>{practice}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}



      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-glow-4side-lg border border-slate-400/60 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center mb-4">
              <Save size={24} />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-2">Lưu bản nháp trước khi thoát?</h3>
            <p className="text-xs font-medium text-slate-600 leading-relaxed mb-6">
              Bạn đang có nội dung bài viết chưa nộp. Bạn có muốn lưu lại bản nháp này trước khi rời khỏi trang không?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 text-xs font-extrabold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmExitWithoutSave}
                className="px-4 py-2 text-xs font-extrabold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                Không lưu
              </button>
              <button
                onClick={handleConfirmSaveAndExit}
                disabled={savingDraft}
                className="px-5 py-2 text-xs font-black bg-[#1D4ED8] hover:bg-blue-800 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {savingDraft ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Lưu & Thoát</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default WritingEditorPage;

