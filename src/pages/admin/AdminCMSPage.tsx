import React, { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  MoreVertical,
  Utensils,
  Rocket,
  Plane,
  BriefcaseMedical,
  Languages,
  BookOpen,
  CheckCircle2,
  Clock,
  X,
  Loader2,
  Mic,
  FileText,
  Headphones,
  Upload,
  Trash2,
  Sparkles,
  PenTool
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/common/AppLayout';
import { useToast } from '../../components/common/Toast';
import { adminApi } from '../../services/adminApi';
import CreateCollectionModal from '../../components/vocabulary/modals/CreateCollectionModal';
import AddWordModal from '../../components/vocabulary/modals/AddWordModal';
import { getMyCollections } from '../../services/vocabularyApi';
import { getPassages, getPassageDetail } from '../../services/readingApi';
import { getListeningPassages, getListeningPassageDetail } from '../../services/listeningApi';
import { speakingApi } from '../../services/speakingApi';
import { writingApi } from '../../services/writingApi';
import type { VocabularyCollection } from '../../types/vocabulary';

export interface ContentSet {
  id: string;
  category: string;
  badge: string;
  title: string;
  itemsCount: number;
  itemUnit: 'Words' | 'Phrases' | 'Lessons' | 'Topics';
  status: 'Published' | 'Draft';
  updatedAt: string;
  type: 'vocab' | 'speaking' | 'reading' | 'listening' | 'writing';
}

export interface SpeakingPromptInput {
  id: string;
  part: 'PART_1' | 'PART_2' | 'PART_3';
  sub_topic: string;
  question_text: string;
  examiner_audio_url: string;
  useful_vocabulary: string;
  ielts_tip: string;
}

export interface QuestionInputItem {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export const AdminCMSPage: React.FC = () => {
  const navigate = useNavigate();
  const [sets, setSets] = useState<ContentSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vocab' | 'speaking' | 'reading' | 'listening' | 'writing'>('vocab');
  const [searchQuery] = useState('');
  const { showToast } = useToast();

  // Detail View Modal State
  const [viewDetailSet, setViewDetailSet] = useState<ContentSet | null>(null);

  // Modal Control States
  const [showCreateWritingModal, setShowCreateWritingModal] = useState(false);
  const [showCreateSpeakingModal, setShowCreateSpeakingModal] = useState(false);
  const [showCreateReadingModal, setShowCreateReadingModal] = useState(false);
  const [showCreateListeningModal, setShowCreateListeningModal] = useState(false);
  const [showCreateVocabModal, setShowCreateVocabModal] = useState(false);

  // Add Word Modal State for Vocabulary
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [selectedColIdForAddWord, setSelectedColIdForAddWord] = useState('');
  const [vocabCollections, setVocabCollections] = useState<VocabularyCollection[]>([]);

  // Edit Modal State
  const [editingSet, setEditingSet] = useState<ContentSet | null>(null);

  // ====================================================================
  // 1. ISOLATED CREATION MODAL STATES (NEVER SHARED WITH EDIT/DETAIL)
  // ====================================================================
  // Create Writing
  const [createWTitle, setCreateWTitle] = useState('');
  const [createWTaskType, setCreateWTaskType] = useState<'TASK_1' | 'TASK_2'>('TASK_2');
  const [createWDescription, setCreateWDescription] = useState('');
  const [createWImageUrl, setCreateWImageUrl] = useState('');
  const [createWTargetWords, setCreateWTargetWords] = useState(250);
  const [createWTimeLimit, setCreateWTimeLimit] = useState(40);

  // Create Speaking
  const [createSTitle, setCreateSTitle] = useState('');
  const [createSTags, setCreateSTags] = useState('');
  const [createSIsFullTest, setCreateSIsFullTest] = useState(false);
  const [createSPrompts, setCreateSPrompts] = useState<SpeakingPromptInput[]>([
    {
      id: 'create-prompt-1',
      part: 'PART_1',
      sub_topic: 'Hobbies & Interests',
      question_text: 'Do you have any hobbies or interests?',
      examiner_audio_url: '',
      useful_vocabulary: 'Pastime, Immerse myself in, Fascinated by',
      ielts_tip: 'Give reason and extended examples',
    },
  ]);

  // Create Reading
  const [createRTitle, setCreateRTitle] = useState('');
  const [createRTopic, setCreateRTopic] = useState('ACADEMIC READING');
  const [createRContent, setCreateRContent] = useState('');
  const [createRImageUrl, setCreateRImageUrl] = useState('');
  const [createRQuestions, setCreateRQuestions] = useState<QuestionInputItem[]>([
    {
      id: 'create-rq-1',
      question_text: 'According to paragraph 1, what main factor accelerates innovation?',
      options: ['A. Cost reduction', 'B. Technological breakthrough', 'C. Regulations', 'D. Market demand'],
      correct_answer: 'B. Technological breakthrough',
      explanation: 'Paragraph 1 emphasizes technological breakthroughs as the core driver.',
    },
  ]);

  // Create Listening
  const [createLTitle, setCreateLTitle] = useState('');
  const [createLUnitCode, setCreateLUnitCode] = useState('UNIT01');
  const [createLAudioUrl, setCreateLAudioUrl] = useState('');
  const [createLTranscript, setCreateLTranscript] = useState('');
  const [createLQuestions, setCreateLQuestions] = useState<QuestionInputItem[]>([
    {
      id: 'create-lq-1',
      question_text: 'What time is the main conference scheduled to begin?',
      options: ['A. 8:30 AM', 'B. 9:00 AM', 'C. 10:15 AM', 'D. 1:00 PM'],
      correct_answer: 'B. 9:00 AM',
      explanation: 'The speaker explicitly announces 9:00 AM in the audio intro.',
    },
  ]);

  // ====================================================================
  // 2. DETAIL VIEW & EDITING STATES (POPULATED DYNAMICALLY FROM BACKEND)
  // ====================================================================
  const [sPrompts, setSPrompts] = useState<SpeakingPromptInput[]>([]);
  const [rContent, setRContent] = useState('');
  const [rQuestions, setRQuestions] = useState<QuestionInputItem[]>([]);
  const [lAudioUrl, setLAudioUrl] = useState('');
  const [lQuestions, setLQuestions] = useState<QuestionInputItem[]>([]);
  const [wDescription, setWDescription] = useState('');
  const [wTaskType, setWTaskType] = useState<'TASK_1' | 'TASK_2'>('TASK_2');
  const [wTargetWords, setWTargetWords] = useState(250);
  const [wTimeLimit, setWTimeLimit] = useState(40);

  // Reset & Open Creation Modals
  const openCreateWritingModal = () => {
    setCreateWTitle('');
    setCreateWTaskType('TASK_2');
    setCreateWDescription('');
    setCreateWImageUrl('');
    setCreateWTargetWords(250);
    setCreateWTimeLimit(40);
    setShowCreateWritingModal(true);
  };

  const openCreateSpeakingModal = () => {
    setCreateSTitle('');
    setCreateSTags('');
    setCreateSIsFullTest(false);
    setCreateSPrompts([
      {
        id: `create-prompt-${Date.now()}`,
        part: 'PART_1',
        sub_topic: 'Hobbies & Interests',
        question_text: 'Do you have any hobbies or interests?',
        examiner_audio_url: '',
        useful_vocabulary: 'Pastime, Immerse myself in',
        ielts_tip: 'Give reason and extended examples',
      },
    ]);
    setShowCreateSpeakingModal(true);
  };

  const openCreateReadingModal = () => {
    setCreateRTitle('');
    setCreateRTopic('ACADEMIC READING');
    setCreateRContent('');
    setCreateRImageUrl('');
    setCreateRQuestions([
      {
        id: `create-rq-${Date.now()}`,
        question_text: 'According to paragraph 1, what main factor accelerates innovation?',
        options: ['A. Cost reduction', 'B. Technological breakthrough', 'C. Regulations', 'D. Market demand'],
        correct_answer: 'B. Technological breakthrough',
        explanation: 'Paragraph 1 emphasizes technological breakthroughs as the core driver.',
      },
    ]);
    setShowCreateReadingModal(true);
  };

  const openCreateListeningModal = () => {
    setCreateLTitle('');
    setCreateLUnitCode('UNIT01');
    setCreateLAudioUrl('');
    setCreateLTranscript('');
    setCreateLQuestions([
      {
        id: `create-lq-${Date.now()}`,
        question_text: 'What time is the main conference scheduled to begin?',
        options: ['A. 8:30 AM', 'B. 9:00 AM', 'C. 10:15 AM', 'D. 1:00 PM'],
        correct_answer: 'B. 9:00 AM',
        explanation: 'The speaker explicitly announces 9:00 AM in the audio intro.',
      },
    ]);
    setShowCreateListeningModal(true);
  };

  // Add/Remove Question Items for Creation Forms
  const addCreateSpeakingPromptItem = () => {
    setCreateSPrompts(prev => [
      ...prev,
      {
        id: `create-prompt-${Date.now()}-${prev.length + 1}`,
        part: 'PART_1',
        sub_topic: '',
        question_text: '',
        examiner_audio_url: '',
        useful_vocabulary: '',
        ielts_tip: '',
      },
    ]);
  };

  const removeCreateSpeakingPromptItem = (index: number) => {
    if (createSPrompts.length <= 1) return;
    setCreateSPrompts(prev => prev.filter((_, i) => i !== index));
  };

  const updateCreateSpeakingPromptItem = (index: number, field: keyof SpeakingPromptInput, value: any) => {
    setCreateSPrompts(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addCreateReadingQuestionItem = () => {
    setCreateRQuestions(prev => [
      ...prev,
      {
        id: `create-rq-${Date.now()}-${prev.length + 1}`,
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
      },
    ]);
  };

  const removeCreateReadingQuestionItem = (index: number) => {
    if (createRQuestions.length <= 1) return;
    setCreateRQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const addCreateListeningQuestionItem = () => {
    setCreateLQuestions(prev => [
      ...prev,
      {
        id: `create-lq-${Date.now()}-${prev.length + 1}`,
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
      },
    ]);
  };

  const removeCreateListeningQuestionItem = (index: number) => {
    if (createLQuestions.length <= 1) return;
    setCreateLQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const loadSpeakingPrompts = async (topicId: string) => {
    try {
      const cleanId = topicId.replace(/^s-/, '');
      const promptsData = await speakingApi.getTopicPrompts(cleanId);
      let allPromptsList: SpeakingPromptInput[] = [];

      if (Array.isArray(promptsData)) {
        allPromptsList = promptsData.map((p: any) => ({
          id: p.id || p._id || `prompt-${Date.now()}`,
          part: p.part || 'PART_1',
          sub_topic: p.sub_topic || '',
          question_text: p.question_text || p.title || '',
          examiner_audio_url: p.examiner_audio_url || '',
          useful_vocabulary: p.useful_vocabulary || '',
          ielts_tip: p.ielts_tip || '',
        }));
      } else if (typeof promptsData === 'object' && promptsData !== null) {
        Object.entries(promptsData).forEach(([partKey, promptsArr]) => {
          if (Array.isArray(promptsArr)) {
            promptsArr.forEach((p: any) => {
              allPromptsList.push({
                id: p.id || p._id || `prompt-${Date.now()}`,
                part: (p.part || partKey) as any,
                sub_topic: p.sub_topic || '',
                question_text: p.question_text || p.title || '',
                examiner_audio_url: p.examiner_audio_url || '',
                useful_vocabulary: p.useful_vocabulary || '',
                ielts_tip: p.ielts_tip || '',
              });
            });
          }
        });
      }

      if (allPromptsList.length > 0) {
        setSPrompts(allPromptsList);
      }
    } catch (err) {
      console.warn("Failed to fetch topic prompts from backend:", err);
    }
  };

  // Fetch Real Backend Details for ALL 5 Skill Modules on View/Edit Modal Open
  useEffect(() => {
    const targetSet = viewDetailSet || editingSet;
    if (!targetSet) return;
    const cleanId = targetSet.id.replace(/^[rslowv]-/, '');

    if (targetSet.type === 'speaking') {
      loadSpeakingPrompts(targetSet.id);
    } else if (targetSet.type === 'reading') {
      getPassageDetail(cleanId)
        .then(detail => {
          if (detail?.content) setRContent(detail.content);
        })
        .catch(err => console.warn("Reading passage detail fetch info:", err));
    } else if (targetSet.type === 'listening') {
      getListeningPassageDetail(cleanId)
        .then(detail => {
          if (detail?.audio_url) setLAudioUrl(detail.audio_url);
        })
        .catch(err => console.warn("Listening passage detail fetch info:", err));
    } else if (targetSet.type === 'writing') {
      writingApi.getPromptById(cleanId)
        .then(prompt => {
          if (prompt?.task_description) setWDescription(prompt.task_description);
          if (prompt?.task_type) setWTaskType(prompt.task_type as any);
          if (prompt?.word_count_target) setWTargetWords(prompt.word_count_target);
          if ((prompt as any)?.time_limit) setWTimeLimit((prompt as any).time_limit);
        })
        .catch(err => console.warn("Writing prompt detail fetch info:", err));
    }
  }, [viewDetailSet, editingSet]);

  const addReadingQuestionItem = () => {
    setRQuestions(prev => [
      ...prev,
      {
        id: `rq-${Date.now()}-${prev.length + 1}`,
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
      },
    ]);
  };

  const removeReadingQuestionItem = (index: number) => {
    if (rQuestions.length <= 1) return;
    setRQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const addListeningQuestionItem = () => {
    setLQuestions(prev => [
      ...prev,
      {
        id: `lq-${Date.now()}-${prev.length + 1}`,
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
      },
    ]);
  };

  const removeListeningQuestionItem = (index: number) => {
    if (lQuestions.length <= 1) return;
    setLQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const addSpeakingPromptItem = () => {
    setSPrompts(prev => [
      ...prev,
      {
        id: `prompt-${Date.now()}-${prev.length + 1}`,
        part: 'PART_1',
        sub_topic: '',
        question_text: '',
        examiner_audio_url: '',
        useful_vocabulary: '',
        ielts_tip: '',
      },
    ]);
  };

  const removeSpeakingPromptItem = (index: number) => {
    if (sPrompts.length <= 1) {
      showToast('Cần giữ ít nhất 1 câu hỏi cho bộ Speaking!', 'warning');
      return;
    }
    setSPrompts(prev => prev.filter((_, i) => i !== index));
  };

  const updateSpeakingPromptItem = (index: number, field: keyof SpeakingPromptInput, value: any) => {
    setSPrompts(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const fetchBackendCMSData = async () => {
    setLoading(true);
    try {
      const [dataSets, collections, readingRes, listeningRes, speakingRes, writingRes] = await Promise.allSettled([
        adminApi.getContentSets(),
        getMyCollections(),
        getPassages({ limit: 50 }),
        getListeningPassages({ limit: 50 }),
        speakingApi.getTopics(),
        writingApi.getPrompts(),
      ]);

      const allFetchedSets: ContentSet[] = [];

      // 1. Admin Content Sets from MongoDB
      if (dataSets.status === 'fulfilled' && dataSets.value?.length) {
        dataSets.value.forEach(s => {
          if ((s.type as string) !== 'grammar') {
            allFetchedSets.push(s);
          }
        });
      }

      // 2. Real Vocab collections
      if (collections.status === 'fulfilled' && collections.value?.length) {
        setVocabCollections(collections.value);
        collections.value.forEach((v) => {
          allFetchedSets.push({
            id: `v-${v.id}`,
            title: v.title,
            category: v.topic || "VOCABULARY",
            badge: v.is_official ? "DEFAULT" : "CUSTOM",
            itemsCount: v.total_words || (v as any).word_count || v.words_list?.length || 0,
            itemUnit: "Words",
            status: "Published",
            updatedAt: "Active",
            type: "vocab"
          });
        });
      }

      // 3. Real Reading passages
      if (readingRes.status === 'fulfilled' && readingRes.value?.items?.length) {
        readingRes.value.items.forEach((r) => {
          allFetchedSets.push({
            id: `r-${r.id}`,
            title: r.title,
            category: r.topic || "ACADEMIC READING",
            badge: "READING TEST",
            itemsCount: r.total_questions || 13,
            itemUnit: "Lessons",
            status: "Published",
            updatedAt: "Active",
            type: "reading"
          });
        });
      }

      // 4. Real Listening passages
      if (listeningRes.status === 'fulfilled' && listeningRes.value?.items?.length) {
        listeningRes.value.items.forEach((l) => {
          allFetchedSets.push({
            id: `l-${l.id}`,
            title: l.title,
            category: l.unit_code || "LISTENING LECTURE",
            badge: "LISTENING TEST",
            itemsCount: l.total_questions || 10,
            itemUnit: "Lessons",
            status: "Published",
            updatedAt: "Active",
            type: "listening"
          });
        });
      }

      // 5. Real Speaking topics
      if (speakingRes.status === 'fulfilled' && speakingRes.value?.length) {
        speakingRes.value.forEach((s) => {
          allFetchedSets.push({
            id: `s-${s.id}`,
            title: s.title,
            category: (s as any).topic || "SPEAKING TOPIC",
            badge: "SPEAKING TEST",
            itemsCount: 3,
            itemUnit: "Topics",
            status: "Published",
            updatedAt: "Active",
            type: "speaking"
          });
        });
      }

      // 6. Real Writing prompts
      if (writingRes.status === 'fulfilled' && writingRes.value?.length) {
        writingRes.value.forEach((w) => {
          allFetchedSets.push({
            id: `w-${w.id}`,
            title: w.title,
            category: w.task_type === "WITH_GRAPH" ? "TASK 1" : "TASK 2",
            badge: w.task_type === "WITH_GRAPH" ? "WRITING TASK 1" : "WRITING TASK 2",
            itemsCount: w.word_count_target || 250,
            itemUnit: "Words",
            status: "Published",
            updatedAt: "Active",
            type: "writing"
          });
        });
      }

      // Deduplicate by type + title & filter out grammar
      const uniqueMap = new Map<string, ContentSet>();
      allFetchedSets.forEach(item => {
        if ((item.type as string) !== 'grammar' && !uniqueMap.has(`${item.type}-${item.title}`)) {
          uniqueMap.set(`${item.type}-${item.title}`, item);
        }
      });

      setSets(Array.from(uniqueMap.values()));
    } catch (err) {
      console.warn("Backend admin CMS API fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendCMSData();
  }, []);

  // Simplified Tabs Definition (No Grammar!)
  const tabs = [
    { id: 'vocab', label: 'Từ vựng (Vocabulary)', count: sets.filter(s => s.type === 'vocab').length },
    { id: 'speaking', label: 'Luyện Nói (Speaking)', count: sets.filter(s => s.type === 'speaking').length },
    { id: 'reading', label: 'Luyện Đọc (Reading)', count: sets.filter(s => s.type === 'reading').length },
    { id: 'listening', label: 'Luyện Nghe (Listening)', count: sets.filter(s => s.type === 'listening').length },
    { id: 'writing', label: 'Luyện Viết (Writing)', count: sets.filter(s => s.type === 'writing').length },
  ];

  // Filter sets by activeTab and searchQuery
  const filteredSets = sets.filter(s => {
    if (s.type !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
    }
    return true;
  });

  // Handlers for Writing Creation
  const handleCreateWriting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createWTitle.trim()) {
      showToast('Vui lòng nhập tên bài Writing!', 'error');
      return;
    }
    try {
      const createdBackend = await adminApi.createContentSet({
        title: createWTitle.trim(),
        category: createWTaskType === 'TASK_1' ? 'WRITING TASK 1' : 'WRITING TASK 2',
        itemsCount: createWTargetWords,
        status: 'Published',
        type: 'writing',
        description: createWDescription,
        image_url: createWImageUrl,
      });
      setSets(prev => [createdBackend, ...prev]);
      setActiveTab('writing');
      showToast(`Đã tạo bài Writing "${createdBackend.title}" thành công!`, 'success');
      fetchBackendCMSData();
    } catch (err) {
      console.warn("Writing creation backend fallback:", err);
      const fallback: ContentSet = {
        id: `w-${Date.now()}`,
        category: createWTaskType === 'TASK_1' ? 'WRITING TASK 1' : 'WRITING TASK 2',
        badge: createWTaskType === 'TASK_1' ? 'WRITING TASK 1' : 'WRITING TASK 2',
        title: createWTitle.trim(),
        itemsCount: createWTargetWords,
        itemUnit: 'Words',
        status: 'Published',
        updatedAt: 'Just now',
        type: 'writing',
      };
      setSets(prev => [fallback, ...prev]);
      setActiveTab('writing');
      showToast(`Đã tạo bài Writing "${fallback.title}"!`, 'success');
    } finally {
      setShowCreateWritingModal(false);
      setCreateWTitle('');
      setCreateWDescription('');
    }
  };

  // Handlers for Speaking Creation with Multiple Questions
  const handleCreateSpeaking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createSTitle.trim()) {
      showToast('Vui lòng nhập tên chủ đề Speaking!', 'error');
      return;
    }
    const validPrompts = createSPrompts.filter(p => p.question_text.trim());
    if (validPrompts.length === 0) {
      showToast('Vui lòng thêm ít nhất 1 câu hỏi cho chủ đề Speaking!', 'error');
      return;
    }

    try {
      const createdBackend = await adminApi.createContentSet({
        title: createSTitle.trim(),
        category: `SPEAKING (${validPrompts.length} CÂU HỎI)`,
        itemsCount: validPrompts.length,
        status: 'Published',
        type: 'speaking',
        prompts: validPrompts,
        tags: createSTags,
        is_full_test: createSIsFullTest,
      });
      setSets(prev => [createdBackend, ...prev]);
      setActiveTab('speaking');
      showToast(`Đã tạo chủ đề Speaking "${createdBackend.title}" gồm ${validPrompts.length} câu hỏi thành công!`, 'success');
      fetchBackendCMSData();
    } catch (err) {
      console.warn("Speaking creation backend fallback:", err);
      const fallback: ContentSet = {
        id: `s-${Date.now()}`,
        category: `SPEAKING (${validPrompts.length} CÂU HỎI)`,
        badge: `SPEAKING (${validPrompts.length} Qs)`,
        title: createSTitle.trim(),
        itemsCount: validPrompts.length,
        itemUnit: 'Topics',
        status: 'Published',
        updatedAt: 'Just now',
        type: 'speaking',
      };
      setSets(prev => [fallback, ...prev]);
      setActiveTab('speaking');
      showToast(`Đã tạo chủ đề Speaking "${fallback.title}" gồm ${validPrompts.length} câu hỏi!`, 'success');
    } finally {
      setShowCreateSpeakingModal(false);
      setCreateSTitle('');
      setCreateSPrompts([
        {
          id: `create-prompt-${Date.now()}`,
          part: 'PART_1',
          sub_topic: 'Hobbies & Interests',
          question_text: 'Do you have any hobbies or interests?',
          examiner_audio_url: '',
          useful_vocabulary: 'Pastime, Immerse myself in',
          ielts_tip: 'Give reason and extended examples',
        },
      ]);
    }
  };

  // Handlers for Reading Creation
  const handleCreateReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createRTitle.trim()) {
      showToast('Vui lòng nhập tên bài đọc Reading!', 'error');
      return;
    }
    try {
      const createdBackend = await adminApi.createContentSet({
        title: createRTitle.trim(),
        category: createRTopic.toUpperCase(),
        itemsCount: createRQuestions.length,
        status: 'Published',
        type: 'reading',
        content: createRContent,
        image_url: createRImageUrl,
        questions: createRQuestions,
      });
      setSets(prev => [createdBackend, ...prev]);
      setActiveTab('reading');
      showToast(`Đã tạo bài đọc Reading "${createdBackend.title}" thành công!`, 'success');
      fetchBackendCMSData();
    } catch (err) {
      console.warn("Reading creation backend fallback:", err);
      const fallback: ContentSet = {
        id: `r-${Date.now()}`,
        category: createRTopic.toUpperCase(),
        badge: 'READING TEST',
        title: createRTitle.trim(),
        itemsCount: createRQuestions.length,
        itemUnit: 'Lessons',
        status: 'Published',
        updatedAt: 'Just now',
        type: 'reading',
      };
      setSets(prev => [fallback, ...prev]);
      setActiveTab('reading');
      showToast(`Đã tạo bài Reading "${fallback.title}"!`, 'success');
    } finally {
      setShowCreateReadingModal(false);
      setCreateRTitle('');
      setCreateRContent('');
    }
  };

  // Handlers for Listening Creation
  const handleCreateListening = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createLTitle.trim()) {
      showToast('Vui lòng nhập tên bài nghe Listening!', 'error');
      return;
    }
    try {
      const createdBackend = await adminApi.createContentSet({
        title: createLTitle.trim(),
        category: createLUnitCode.toUpperCase(),
        itemsCount: createLQuestions.length,
        status: 'Published',
        type: 'listening',
        audio_url: createLAudioUrl,
        transcript: createLTranscript,
        questions: createLQuestions,
      });
      setSets(prev => [createdBackend, ...prev]);
      setActiveTab('listening');
      showToast(`Đã tạo bài nghe Listening "${createdBackend.title}" thành công!`, 'success');
      fetchBackendCMSData();
    } catch (err) {
      console.warn("Listening creation backend fallback:", err);
      const fallback: ContentSet = {
        id: `l-${Date.now()}`,
        category: createLUnitCode.toUpperCase(),
        badge: 'LISTENING TEST',
        title: createLTitle.trim(),
        itemsCount: createLQuestions.length,
        itemUnit: 'Lessons',
        status: 'Published',
        updatedAt: 'Just now',
        type: 'listening',
      };
      setSets(prev => [fallback, ...prev]);
      setActiveTab('listening');
      showToast(`Đã tạo bài Listening "${fallback.title}"!`, 'success');
    } finally {
      setShowCreateListeningModal(false);
      setCreateLTitle('');
      setCreateLTranscript('');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSet) return;
    try {
      const updatedBackend = await adminApi.updateContentSet(editingSet.id, {
        title: editingSet.title,
        category: editingSet.category,
        badge: editingSet.badge,
        itemsCount: editingSet.itemsCount,
        status: editingSet.status,
      });
      setSets(prev => prev.map(s => (s.id === editingSet.id ? updatedBackend : s)));
      showToast(`Đã cập nhật bài học "${updatedBackend.title}" trên Backend!`, 'success');
    } catch (err) {
      console.warn("Backend update failed, saving locally:", err);
      setSets(prev => prev.map(s => (s.id === editingSet.id ? editingSet : s)));
      showToast(`Đã cập nhật "${editingSet.title}"!`, 'success');
    } finally {
      setEditingSet(null);
    }
  };

  const toggleStatus = async (id: string) => {
    const target = sets.find(s => s.id === id);
    if (!target) return;
    const nextStatus = target.status === 'Published' ? 'Draft' : 'Published';
    try {
      const updated = await adminApi.updateContentSet(id, { status: nextStatus });
      setSets(prev => prev.map(s => (s.id === id ? updated : s)));
      showToast(`Đã chuyển trạng thái bài "${target.title}" sang ${nextStatus} trên Backend!`, 'info');
    } catch (err) {
      console.warn("Backend toggle status failed, toggling locally:", err);
      setSets(prev =>
        prev.map(s => {
          if (s.id === id) {
            return { ...s, status: nextStatus, updatedAt: 'Just now' };
          }
          return s;
        })
      );
      showToast(`Đã chuyển trạng thái bài sang ${nextStatus}!`, 'info');
    }
  };

  const handleDeleteSet = async (id: string) => {
    try {
      await adminApi.deleteContentSet(id);
      setSets(prev => prev.filter(s => s.id !== id));
      showToast('Đã xóa bộ bài học khỏi Backend!', 'warning');
    } catch (err) {
      console.warn("Backend delete failed, deleting locally:", err);
      setSets(prev => prev.filter(s => s.id !== id));
      showToast('Đã xóa bộ bài học!', 'warning');
    } finally {
      setEditingSet(null);
    }
  };

  const getCardIcon = (title: string, category: string, type: string) => {
    if (type === 'speaking') return <Mic className="w-5 h-5 text-indigo-600" />;
    if (type === 'writing') return <FileText className="w-5 h-5 text-emerald-600" />;
    if (type === 'reading') return <BookOpen className="w-5 h-5 text-amber-600" />;
    if (type === 'listening') return <Headphones className="w-5 h-5 text-blue-600" />;

    const t = title.toLowerCase();
    const c = category.toLowerCase();
    if (t.includes('restaurant') || t.includes('food') || c.includes('daily')) {
      return <Utensils className="w-5 h-5 text-slate-600" />;
    }
    if (t.includes('ai') || t.includes('robot') || c.includes('tech')) {
      return <Rocket className="w-5 h-5 text-blue-600" />;
    }
    if (t.includes('airport') || t.includes('travel') || c.includes('travel')) {
      return <Plane className="w-5 h-5 text-slate-700" />;
    }
    if (t.includes('clinical') || t.includes('medical') || c.includes('medical')) {
      return <BriefcaseMedical className="w-5 h-5 text-blue-600" />;
    }
    return <Languages className="w-5 h-5 text-purple-600" />;
  };

  const triggerActiveModal = () => {
    if (activeTab === 'writing') setShowCreateWritingModal(true);
    else if (activeTab === 'speaking') setShowCreateSpeakingModal(true);
    else if (activeTab === 'reading') setShowCreateReadingModal(true);
    else if (activeTab === 'listening') setShowCreateListeningModal(true);
    else if (activeTab === 'vocab') setShowCreateVocabModal(true);
  };
  const handleNavigateToPractice = (item: ContentSet) => {
    const rawId = item.id.replace(/^[rslowv]-/, '');
    if (item.type === 'vocab') {
      navigate(`/vocabulary/${rawId}`);
    } else if (item.type === 'writing') {
      navigate(`/writing/editor/${rawId}`);
    } else if (item.type === 'reading') {
      navigate(`/reading/practice?passage_id=${rawId}`);
    } else if (item.type === 'listening') {
      navigate(`/listening/practice?passage_id=${rawId}`);
    } else if (item.type === 'speaking') {
      navigate(`/speaking/practice/topic/${rawId}`);
    } else {
      navigate(`/practice-modules/${item.type}`);
    }
  };

  return (
    <AppLayout breadcrumbs={[{ label: 'Quản trị' }, { label: 'Quản lý nội dung' }]}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 select-none font-['Be_Vietnam_Pro'] max-w-7xl mx-auto">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quản Lý Nội Dung Bài Học (CMS)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Quản lý và tạo mới toàn bộ bài học các kỹ năng Speaking, Writing, Reading, Listening & Vocabulary.
          </p>
        </div>

        {/* Dedicated Action Bar Container for Skill Creation Buttons */}
        <div className="bg-slate-100/90 border border-slate-300/80 rounded-2xl p-3 sm:p-4 shadow-inner space-y-3 select-none">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 block px-1">
            Tạo Nhanh Bài Học Mới
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 w-full">
            <button
              onClick={openCreateWritingModal}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-3 bg-white hover:bg-blue-50/60 text-slate-800 hover:text-[#1D4ED8] border border-slate-200/90 hover:border-blue-400 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer shadow-glow-4side hover:shadow-glow-4side-lg active:scale-98"
            >
              <PenTool className="w-4 h-4 text-[#1D4ED8] stroke-[2.5]" />
              <span>Tạo Writing</span>
            </button>

            <button
              onClick={openCreateSpeakingModal}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-3 bg-white hover:bg-blue-50/60 text-slate-800 hover:text-[#1D4ED8] border border-slate-200/90 hover:border-blue-400 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer shadow-glow-4side hover:shadow-glow-4side-lg active:scale-98"
            >
              <Mic className="w-4 h-4 text-[#1D4ED8] stroke-[2.5]" />
              <span>Tạo Speaking</span>
            </button>

            <button
              onClick={openCreateReadingModal}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-3 bg-white hover:bg-blue-50/60 text-slate-800 hover:text-[#1D4ED8] border border-slate-200/90 hover:border-blue-400 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer shadow-glow-4side hover:shadow-glow-4side-lg active:scale-98"
            >
              <BookOpen className="w-4 h-4 text-[#1D4ED8] stroke-[2.5]" />
              <span>Tạo Reading</span>
            </button>

            <button
              onClick={openCreateListeningModal}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-3 bg-white hover:bg-blue-50/60 text-slate-800 hover:text-[#1D4ED8] border border-slate-200/90 hover:border-blue-400 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer shadow-glow-4side hover:shadow-glow-4side-lg active:scale-98"
            >
              <Headphones className="w-4 h-4 text-[#1D4ED8] stroke-[2.5]" />
              <span>Tạo Listening</span>
            </button>

            <button
              onClick={() => setShowCreateVocabModal(true)}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-3 bg-white hover:bg-blue-50/60 text-slate-800 hover:text-[#1D4ED8] border border-slate-200/90 hover:border-blue-400 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer shadow-glow-4side hover:shadow-glow-4side-lg active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-[#1D4ED8] stroke-[2.5]" />
              <span>Tạo Bộ Từ Vựng</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs Bar (Segmented Control Track) */}
        <div className="bg-slate-100/90 border border-slate-300/80 rounded-2xl p-1.5 shadow-inner overflow-x-auto scrollbar-none flex gap-1.5">
          {tabs.map(t => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex-1 min-w-[120px] sm:min-w-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-[#1D4ED8] shadow-glow-4side border border-slate-200/90 scale-[1.01]'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                <span>{t.label}</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full transition-colors ${
                  isActive ? 'bg-blue-50 text-[#1D4ED8]' : 'bg-slate-200/80 text-slate-500'
                }`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          /* Content Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSets.map(item => {
              const isPublished = item.status === 'Published';
              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-400/60 rounded-2xl p-5 shadow-glow-4side hover:shadow-glow-4side-lg hover:border-blue-400/80 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    {/* Top Row: Icon + Edit Actions */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100/90 border border-slate-200/50 flex items-center justify-center shrink-0">
                        {getCardIcon(item.title, item.category, item.type)}
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingSet(item)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa bộ bài & câu hỏi"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSet(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa bộ bài học này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(item.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Đổi trạng thái"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Badge */}
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md inline-block mb-2">
                      {item.badge}
                    </span>

                    {/* Title (Clicking directly opens practice module page!) */}
                    <h3
                      onClick={() => handleNavigateToPractice(item)}
                      className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2 cursor-pointer"
                      title="Nhấp để vào trang làm bài học này"
                    >
                      {item.title}
                    </h3>

                    {/* Metadata: Items & Status */}
                    <div className="mt-4 space-y-1.5 text-xs text-slate-500 font-medium">
                      <div className="flex items-center justify-between">
                        <span>Số phần:</span>
                        <span className="font-bold text-slate-800">
                          {item.itemsCount} {item.itemUnit === 'Words' ? 'Từ' : item.itemUnit === 'Phrases' ? 'Cụm từ' : item.itemUnit === 'Lessons' ? 'Bài học' : item.itemUnit === 'Topics' ? 'Chủ đề' : item.itemUnit}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Trạng thái:</span>
                        <button
                          onClick={() => toggleStatus(item.id)}
                          className="flex items-center gap-1.5 font-bold cursor-pointer hover:underline"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                          />
                          <span className={isPublished ? 'text-slate-800' : 'text-slate-500'}>
                            {item.status === 'Published' ? 'Đã xuất bản' : item.status === 'Draft' ? 'Bản nháp' : item.status}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400 font-medium">
                      <span>{item.updatedAt}</span>
                      <button
                        onClick={() => handleNavigateToPractice(item)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Vào bài học & làm thử</span>
                        <span>→</span>
                      </button>
                    </div>

                    {item.type === 'vocab' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setSelectedColIdForAddWord(item.id.replace('v-', ''));
                            setShowAddWordModal(true);
                          }}
                          className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          title="Thêm từ mới vào bộ này"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm từ</span>
                        </button>

                        <button
                          onClick={() => navigate(`/vocabulary/${item.id.replace('v-', '')}/bulk-add`)}
                          className="flex-1 py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          title="Nhập hàng loạt từ vựng với AI Gemini"
                        >
                          <span>⚡ Nhập AI</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Creation Card Option for Active Tab */}
            <div
              onClick={triggerActiveModal}
              className="border-2 border-dashed border-slate-200/90 hover:border-blue-400 rounded-2xl p-6 bg-slate-50/40 hover:bg-white transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer min-h-[240px] group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-200/70 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-600 flex items-center justify-center mb-3 transition-colors">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>

              <h3 className="text-sm font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">
                Tạo Bài {tabs.find(t => t.id === activeTab)?.label} Mới
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                Nhấp để mở form nhập thông tin tạo nội dung bài học {tabs.find(t => t.id === activeTab)?.label} mới
              </p>
            </div>
          </div>
        )}

        {/* Bottom Summary Stats Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-around gap-6 mt-8">
          {/* Item 1 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block leading-tight">
                TỔNG SỐ BÀI HỌC
              </span>
              <span className="text-lg font-extrabold text-slate-900">
                {sets.length} bài học
              </span>
            </div>
          </div>

          <div className="hidden sm:block h-8 w-px bg-slate-200/70" />

          {/* Item 2 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block leading-tight">
                BÀI ĐÃ XUẤT BẢN
              </span>
              <span className="text-lg font-extrabold text-slate-900">
                {sets.filter(s => s.status === 'Published').length}
              </span>
            </div>
          </div>

          <div className="hidden sm:block h-8 w-px bg-slate-200/70" />

          {/* Item 3 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block leading-tight">
                BÀI BẢN NHÁP
              </span>
              <span className="text-lg font-extrabold text-slate-900">
                {sets.filter(s => s.status === 'Draft').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. CREATE WRITING PROMPT MODAL */}
      {showCreateWritingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-glow-4side-lg space-y-5 border border-slate-400/60 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">Tạo Bài Luyện Writing Mới</h3>
              </div>
              <button
                onClick={() => setShowCreateWritingModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWriting} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                  Dạng Bài Writing
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateWTaskType('TASK_1');
                      setCreateWTargetWords(150);
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${createWTaskType === 'TASK_1'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    Writing Task 1 (Graph/Chart)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateWTaskType('TASK_2');
                      setCreateWTargetWords(250);
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${createWTaskType === 'TASK_2'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    Writing Task 2 (Essay)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                  Tiêu Đề Bài Học
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Impact of Artificial Intelligence on Future Jobs"
                  value={createWTitle}
                  onChange={e => setCreateWTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                  Nội Dung Đề Bài (Task Description)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Nhập mô tả đề bài chi tiết..."
                  value={createWDescription}
                  onChange={e => setCreateWDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                />
              </div>

              {/* Image Input: File Upload or Cloudinary URL */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                  Hình Ảnh Đồ Thị / Minh Họa (File / URL Cloudinary)
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/50 transition-all cursor-pointer">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      <span>Chọn file từ máy</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCreateWImageUrl(URL.createObjectURL(file));
                            showToast(`Đã chọn ảnh "${file.name}"!`, 'info');
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Hoặc dán URL Cloudinary: https://res.cloudinary.com/..."
                    value={createWImageUrl}
                    onChange={e => setCreateWImageUrl(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  {createWImageUrl && (
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
                      <span className="truncate max-w-[280px]">Media: {createWImageUrl}</span>
                      <button type="button" onClick={() => setCreateWImageUrl('')} className="text-red-500 font-bold hover:underline">Xóa</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                    Số Từ Mục Tiêu
                  </label>
                  <input
                    type="number"
                    min={50}
                    value={createWTargetWords}
                    onChange={e => setCreateWTargetWords(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                    Thời Gian (Phút)
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={createWTimeLimit}
                    onChange={e => setCreateWTimeLimit(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateWritingModal(false)}
                  className="border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-emerald-700 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  Tạo Bài Writing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CREATE SPEAKING TOPIC & MULTI-QUESTION PROMPTS MODAL */}
      {showCreateSpeakingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-glow-4side-lg space-y-5 border border-slate-400/60 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Tạo Bộ Bài Luyện Speaking Mới</h3>
                  <p className="text-xs text-slate-500 font-medium">Tạo tên bộ đề và thêm danh sách các câu hỏi chi tiết bên dưới</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateSpeakingModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSpeaking} className="space-y-5">
              {/* SECTION 1: TOPIC METADATA */}
              <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                  <span>📌 Thông Tin Bộ Đề Speaking</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                      Tên Bộ Đề / Chủ Đề Speaking
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: IELTS Speaking Topic 1: Environment & Climate"
                      value={createSTitle}
                      onChange={e => setCreateSTitle(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                      Thẻ Tags (Phân cách bằng dấu phẩy)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Environment, Climate, Daily Life"
                      value={createSTags}
                      onChange={e => setCreateSTags(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="full_test_check"
                      checked={createSIsFullTest}
                      onChange={e => setCreateSIsFullTest(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                    <label htmlFor="full_test_check" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Bộ Đề Thi Thử Full Test (Gồm cả Part 1, Part 2 & Part 3)
                    </label>
                  </div>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-full">
                    {createSPrompts.length} câu hỏi
                  </span>
                </div>
              </div>

              {/* SECTION 2: DYNAMIC QUESTIONS LIST BUILDER */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span>💬 Danh Sách Các Câu Hỏi Trả Lời ({createSPrompts.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={addCreateSpeakingPromptItem}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm câu hỏi mới</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {createSPrompts.map((prompt, idx) => (
                    <div
                      key={prompt.id || idx}
                      className="border border-slate-200/90 rounded-2xl p-4 space-y-3 bg-white hover:border-indigo-300 transition-all shadow-2xs relative group"
                    >
                      {/* Question Card Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            Câu hỏi #{idx + 1}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Part selector */}
                          <div className="flex gap-1">
                            {(['PART_1', 'PART_2', 'PART_3'] as const).map(p => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => updateCreateSpeakingPromptItem(idx, 'part', p)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${prompt.part === p
                                    ? 'bg-indigo-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                  }`}
                              >
                                {p.replace('_', ' ')}
                              </button>
                            ))}
                          </div>

                          {createSPrompts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCreateSpeakingPromptItem(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                              title="Xóa câu hỏi này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Sub-topic & Question Text */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                            Chủ đề nhỏ / Sub-topic
                          </label>
                          <input
                            type="text"
                            placeholder="VD: Hometown, Music, Travel..."
                            value={prompt.sub_topic}
                            onChange={e => updateCreateSpeakingPromptItem(idx, 'sub_topic', e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                            Nội Dung Câu Hỏi / Cue Card <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="VD: What is your hometown like? / Describe a book you read..."
                            value={prompt.question_text}
                            onChange={e => updateCreateSpeakingPromptItem(idx, 'question_text', e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Examiner Audio / Video Selection */}
                      <div>
                        <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                          Audio / Video Giọng Đọc Đề (File từ máy hoặc URL Cloudinary)
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-indigo-500 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 transition-all cursor-pointer shrink-0">
                            <Upload className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Tải File</span>
                            <input
                              type="file"
                              accept="audio/*,video/*"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  updateCreateSpeakingPromptItem(idx, 'examiner_audio_url', URL.createObjectURL(file));
                                  showToast(`Đã chọn file media "${file.name}" cho câu ${idx + 1}!`, 'info');
                                }
                              }}
                              className="hidden"
                            />
                          </label>

                          <input
                            type="text"
                            placeholder="URL Cloudinary: https://res.cloudinary.com/..."
                            value={prompt.examiner_audio_url}
                            onChange={e => updateCreateSpeakingPromptItem(idx, 'examiner_audio_url', e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Vocabulary & Tips */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                            Từ vựng gợi ý (Vocabulary)
                          </label>
                          <input
                            type="text"
                            placeholder="VD: picturesque, serene, vibrant"
                            value={prompt.useful_vocabulary}
                            onChange={e => updateCreateSpeakingPromptItem(idx, 'useful_vocabulary', e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                            Mẹo trả lời (IELTS Tip)
                          </label>
                          <input
                            type="text"
                            placeholder="VD: Give reason and extended examples"
                            value={prompt.ielts_tip}
                            onChange={e => updateCreateSpeakingPromptItem(idx, 'ielts_tip', e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addCreateSpeakingPromptItem}
                  className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-50/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Câu Hỏi Tiếp Theo Cho Bộ Bài Này</span>
                </button>
              </div>

              {/* Bottom Actions */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateSpeakingModal(false)}
                  className="border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-indigo-700 transition-colors cursor-pointer shadow-md shadow-indigo-500/20"
                >
                  Lưu Bộ Đề & Tất Cả {createSPrompts.length} Câu Hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CREATE READING PASSAGE MODAL WITH DYNAMIC QUESTIONS */}
      {showCreateReadingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-glow-4side-lg space-y-5 border border-slate-400/60 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Tạo Bài Đọc Reading Mới</h3>
                  <p className="text-xs text-slate-500 font-medium">Nhập văn bản bài đọc và tạo các câu hỏi trắc nghiệm kèm đáp án bên dưới</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateReadingModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReading} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Tiêu Đề Bài Đọc (Passage Title)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: The Psychology of Decision Making"
                    value={createRTitle}
                    onChange={e => setCreateRTitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Chủ Đề (Topic Category)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Science & Tech, Psychology, Environment"
                    value={createRTopic}
                    onChange={e => setCreateRTopic(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Nội Dung Văn Bản Bài Đọc (Passage Content)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Dán toàn bộ văn bản bài đọc tại đây..."
                  value={createRContent}
                  onChange={e => setCreateRContent(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Passage Image File Upload or Cloudinary URL */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Ảnh Minh Họa Bài Đọc (File Ảnh hoặc URL Cloudinary)
                </label>
                <div className="space-y-2">
                  <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 border-2 border-dashed border-slate-200 hover:border-amber-500 rounded-xl text-xs font-bold text-slate-600 hover:text-amber-700 bg-slate-50 hover:bg-amber-50/50 transition-all cursor-pointer">
                    <Upload className="w-4 h-4 text-amber-600" />
                    <span>Chọn file ảnh từ máy</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCreateRImageUrl(URL.createObjectURL(file));
                          showToast(`Đã chọn ảnh "${file.name}"!`, 'info');
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="Hoặc dán URL Cloudinary / Web Image URL..."
                    value={createRImageUrl}
                    onChange={e => setCreateRImageUrl(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Reading Questions List */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <span>📖 Danh Sách Câu Hỏi Trắc Nghiệm Reading ({createRQuestions.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={addCreateReadingQuestionItem}
                    className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-800 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm câu hỏi Reading</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {createRQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="border border-amber-200/70 rounded-2xl p-4 bg-amber-50/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900">Câu hỏi #{idx + 1}</span>
                        {createRQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCreateReadingQuestionItem(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="VD: According to paragraph 1, what..."
                        value={q.question_text}
                        onChange={e => {
                          const val = e.target.value;
                          setCreateRQuestions(prev => prev.map((item, i) => i === idx ? { ...item, question_text: val } : item));
                        }}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500 bg-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => (
                          <input
                            key={oIdx}
                            type="text"
                            placeholder={`Lựa chọn ${String.fromCharCode(65 + oIdx)}`}
                            value={opt}
                            onChange={e => {
                              const val = e.target.value;
                              setCreateRQuestions(prev => prev.map((item, i) => {
                                if (i === idx) {
                                  const newOpt = [...item.options];
                                  newOpt[oIdx] = val;
                                  return { ...item, options: newOpt };
                                }
                                return item;
                              }));
                            }}
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Đáp án đúng (VD: B. Technological breakthrough)"
                          value={q.correct_answer}
                          onChange={e => {
                            const val = e.target.value;
                            setCreateRQuestions(prev => prev.map((item, i) => i === idx ? { ...item, correct_answer: val } : item));
                          }}
                          className="w-full border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-bold text-emerald-800"
                        />
                        <input
                          type="text"
                          placeholder="Giải thích đáp án"
                          value={q.explanation}
                          onChange={e => {
                            const val = e.target.value;
                            setCreateRQuestions(prev => prev.map((item, i) => i === idx ? { ...item, explanation: val } : item));
                          }}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateReadingModal(false)}
                  className="border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-amber-700 transition-colors cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Lưu Bài Reading & {createRQuestions.length} Câu Hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CREATE LISTENING PASSAGE MODAL WITH DYNAMIC QUESTIONS */}
      {showCreateListeningModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-glow-4side-lg space-y-5 border border-slate-400/60 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Tạo Bài Nghe Listening Mới</h3>
                  <p className="text-xs text-slate-500 font-medium">Tải file audio/video bài nghe và thêm các câu hỏi trắc nghiệm/điền từ bên dưới</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateListeningModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListening} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Tiêu Đề Bài Nghe (Listening Title)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: AI in Modern Healthcare Lecture"
                    value={createLTitle}
                    onChange={e => setCreateLTitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Mã Bài Nghe (Unit Code)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: UNIT04, SECTION4"
                    value={createLUnitCode}
                    onChange={e => setCreateLUnitCode(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Audio / Video File Selection or Cloudinary URL */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  File Âm Thanh / Video Bài Nghe (Upload File từ máy hoặc URL Cloudinary)
                </label>
                <div className="space-y-2">
                  <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl text-xs font-bold text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50/50 transition-all cursor-pointer">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>Chọn file audio / video (.mp3, .wav, .mp4)</span>
                    <input
                      type="file"
                      accept="audio/*,video/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCreateLAudioUrl(URL.createObjectURL(file));
                          showToast(`Đã chọn file audio "${file.name}"!`, 'info');
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Hoặc dán URL file Cloudinary mp3/video..."
                    value={createLAudioUrl}
                    onChange={e => setCreateLAudioUrl(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Nội Dung Kịch Bản Transcript
                </label>
                <textarea
                  rows={3}
                  placeholder="Nhập nội dung transcript bài nghe..."
                  value={createLTranscript}
                  onChange={e => setCreateLTranscript(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Listening Questions List */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                    <span>🎧 Danh Sách Câu Hỏi Trắc Nghiệm Listening ({createLQuestions.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={addCreateListeningQuestionItem}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm câu hỏi Listening</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {createLQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="border border-blue-200/70 rounded-2xl p-4 bg-blue-50/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900">Câu hỏi #{idx + 1}</span>
                        {createLQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCreateListeningQuestionItem(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="VD: What time does the lecture start?"
                        value={q.question_text}
                        onChange={e => {
                          const val = e.target.value;
                          setCreateLQuestions(prev => prev.map((item, i) => i === idx ? { ...item, question_text: val } : item));
                        }}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 bg-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => (
                          <input
                            key={oIdx}
                            type="text"
                            placeholder={`Lựa chọn ${String.fromCharCode(65 + oIdx)}`}
                            value={opt}
                            onChange={e => {
                              const val = e.target.value;
                              setCreateLQuestions(prev => prev.map((item, i) => {
                                if (i === idx) {
                                  const newOpt = [...item.options];
                                  newOpt[oIdx] = val;
                                  return { ...item, options: newOpt };
                                }
                                return item;
                              }));
                            }}
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Đáp án đúng (VD: B. 9:00 AM)"
                          value={q.correct_answer}
                          onChange={e => {
                            const val = e.target.value;
                            setCreateLQuestions(prev => prev.map((item, i) => i === idx ? { ...item, correct_answer: val } : item));
                          }}
                          className="w-full border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-bold text-emerald-800"
                        />
                        <input
                          type="text"
                          placeholder="Giải thích đáp án"
                          value={q.explanation}
                          onChange={e => {
                            const val = e.target.value;
                            setCreateLQuestions(prev => prev.map((item, i) => i === idx ? { ...item, explanation: val } : item));
                          }}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateListeningModal(false)}
                  className="border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-700 transition-colors cursor-pointer shadow-md shadow-blue-500/20"
                >
                  Lưu Bài Listening & {createLQuestions.length} Câu Hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. CREATE VOCAB COLLECTION MODAL */}
      <CreateCollectionModal
        open={showCreateVocabModal}
        onClose={() => setShowCreateVocabModal(false)}
        onCreated={async (newCol) => {
          await fetchBackendCMSData();
          showToast(`Đã tạo bộ từ vựng "${newCol.title}" thành công!`, 'success');
          setSelectedColIdForAddWord(newCol.id);
          setShowAddWordModal(true);
        }}
      />

      <AddWordModal
        open={showAddWordModal}
        onClose={() => setShowAddWordModal(false)}
        collections={vocabCollections}
        preselectedCollectionId={selectedColIdForAddWord}
        onWordAdded={() => {
          fetchBackendCMSData();
          showToast('Đã thêm từ vựng mới vào bộ từ!', 'success');
        }}
      />

      {/* 6. DETAIL VIEW QUESTIONS MODAL (When clicking any skill card) */}
      {viewDetailSet && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-glow-4side-lg space-y-5 border border-slate-400/60 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  {getCardIcon(viewDetailSet.title, viewDetailSet.category, viewDetailSet.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                      {viewDetailSet.badge}
                    </span>
                    <button
                      onClick={() => toggleStatus(viewDetailSet.id)}
                      className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-colors cursor-pointer"
                      title="Nhấp để đổi trạng thái"
                    >
                      ● {viewDetailSet.status}
                    </button>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-snug mt-0.5">
                    {viewDetailSet.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setViewDetailSet(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Detailed Questions & Content per skill type */}
              {viewDetailSet.type === 'speaking' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                    Danh Sách Câu Hỏi Speaking ({viewDetailSet.itemsCount} câu hỏi)
                  </h4>
                  {sPrompts.map((q, idx) => (
                    <div key={idx} className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                          {q.part.replace('_', ' ')}
                        </span>
                        {q.sub_topic && (
                          <span className="text-xs font-bold text-slate-500">Chủ đề: {q.sub_topic}</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        {idx + 1}. {q.question_text}
                      </p>
                      {q.useful_vocabulary && (
                        <div className="text-xs text-slate-600">
                          <span className="font-bold text-slate-700">Gợi ý từ vựng: </span>
                          <span>{q.useful_vocabulary}</span>
                        </div>
                      )}
                      {q.ielts_tip && (
                        <div className="text-xs text-indigo-600 bg-indigo-50/60 p-2 rounded-lg font-medium">
                          💡 <strong>IELTS Tip:</strong> {q.ielts_tip}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {viewDetailSet.type === 'reading' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                    Bài Đọc & Danh Sách Câu Hỏi Reading ({viewDetailSet.itemsCount} câu hỏi)
                  </h4>
                  <div className="p-3 bg-amber-50/50 border border-amber-200/70 rounded-xl text-xs text-slate-700 max-h-40 overflow-y-auto leading-relaxed">
                    <strong>Nội dung đoạn văn: </strong> {rContent || "Bài đọc tổng hợp kiến thức Reading Academic IELTS từ cơ sở dữ liệu backend..."}
                  </div>
                  {rQuestions.map((q, idx) => (
                    <div key={idx} className="border border-slate-200/80 rounded-xl p-4 bg-white space-y-2">
                      <p className="text-sm font-bold text-slate-800">
                        Câu {idx + 1}: {q.question_text}
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-lg font-medium border ${opt === q.correct_answer
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="text-xs text-slate-500 pt-1 font-medium">
                          <strong>Giải thích: </strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {viewDetailSet.type === 'listening' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                    Bài Nghe & Danh Sách Câu Hỏi Listening ({viewDetailSet.itemsCount} câu hỏi)
                  </h4>
                  {lAudioUrl && (
                    <div className="p-3 bg-blue-50/60 border border-blue-200/70 rounded-xl flex items-center gap-3">
                      <Headphones className="w-5 h-5 text-blue-600" />
                      <audio controls src={lAudioUrl} className="w-full h-8" />
                    </div>
                  )}
                  {lQuestions.map((q, idx) => (
                    <div key={idx} className="border border-slate-200/80 rounded-xl p-4 bg-white space-y-2">
                      <p className="text-sm font-bold text-slate-800">
                        Câu {idx + 1}: {q.question_text}
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-lg font-medium border ${opt === q.correct_answer
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {viewDetailSet.type === 'writing' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                    Chi Tiết Đề Bài Writing Task
                  </h4>
                  <div className="p-4 bg-emerald-50/40 border border-emerald-200/70 rounded-xl space-y-2">
                    <span className="text-xs font-extrabold text-emerald-800 uppercase bg-emerald-100 px-2 py-0.5 rounded-md">
                      {wTaskType}
                    </span>
                    <p className="text-sm font-bold text-slate-900">{viewDetailSet.title}</p>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {wDescription || "Nội dung mô tả đề bài essay Writing Task 2..."}
                    </p>
                    <div className="text-xs font-semibold text-slate-500 pt-1">
                      Mục tiêu số từ: <span className="font-bold text-slate-800">{wTargetWords} từ</span> | Thời gian: <span className="font-bold text-slate-800">{wTimeLimit} phút</span>
                    </div>
                  </div>
                </div>
              )}

              {viewDetailSet.type === 'vocab' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                    Bộ Từ Vựng: {viewDetailSet.title}
                  </h4>
                  <div className="p-4 bg-purple-50/40 border border-purple-200/70 rounded-xl text-xs text-slate-700 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{viewDetailSet.title}</span>
                      <span>Chuyên mục: {viewDetailSet.category} ({viewDetailSet.itemsCount} từ)</span>
                    </div>
                    <button
                      onClick={() => {
                        navigate(`/vocabulary/${viewDetailSet.id.replace('v-', '')}`);
                        setViewDetailSet(null);
                      }}
                      className="px-3 py-2 bg-purple-600 text-white font-bold rounded-xl text-xs hover:bg-purple-700 cursor-pointer"
                    >
                      Quản lý từ vựng →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Complete Management Actions (Edit, Delete, Toggle, Practice Navigation, Close) */}
            <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const target = viewDetailSet;
                  setViewDetailSet(null);
                  handleNavigateToPractice(target);
                }}
                className="flex-1 min-w-[180px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <span>🎮 Chuyển Sang Practice Module</span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingSet(viewDetailSet);
                  setViewDetailSet(null);
                }}
                className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Pencil className="w-4 h-4" />
                <span>Chỉnh Sửa</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteSet(viewDetailSet.id)}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa</span>
              </button>

              <button
                type="button"
                onClick={() => setViewDetailSet(null)}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL WITH QUESTION MANAGEMENT */}
      {editingSet && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-glow-4side-lg space-y-5 border border-slate-400/60 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Chỉnh Sửa Bộ Bài Học & Câu Hỏi</h3>
                <p className="text-xs text-slate-500 font-medium">Chỉnh sửa thông tin bộ bài và quản lý/xóa từng câu hỏi chi tiết.</p>
              </div>
              <button
                onClick={() => setEditingSet(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                  Tên Bài Học / Chủ Đề
                </label>
                <input
                  type="text"
                  required
                  value={editingSet.title}
                  onChange={e => setEditingSet({ ...editingSet, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                  Chuyên Mục Badge
                </label>
                <input
                  type="text"
                  required
                  value={editingSet.badge}
                  onChange={e => setEditingSet({ ...editingSet, badge: e.target.value.toUpperCase(), category: e.target.value.toUpperCase() })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                    Số lượng câu hỏi / item
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editingSet.type === 'speaking' ? sPrompts.length : editingSet.itemsCount}
                    onChange={e => setEditingSet({ ...editingSet, itemsCount: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                    Trạng thái
                  </label>
                  <select
                    value={editingSet.status}
                    onChange={e => setEditingSet({ ...editingSet, status: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 cursor-pointer"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Question Management for Speaking Sets */}
              {editingSet.type === 'speaking' && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                      <Mic className="w-4 h-4" />
                      <span>Danh Sách Câu Hỏi Speaking ({sPrompts.length} câu)</span>
                    </h4>
                    <button
                      type="button"
                      onClick={addSpeakingPromptItem}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm Câu Hỏi</span>
                    </button>
                  </div>

                  {sPrompts.map((prompt, idx) => (
                    <div key={idx} className="border border-indigo-200/80 rounded-xl p-4 bg-indigo-50/30 space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-md">
                          Câu {idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          {(['PART_1', 'PART_2', 'PART_3'] as const).map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => updateSpeakingPromptItem(idx, 'part', p)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${
                                prompt.part === p ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {p.replace('_', ' ')}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => removeSpeakingPromptItem(idx)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer ml-1"
                            title="Xóa câu hỏi này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Chủ đề phụ (ví dụ: Hometown, Hobbies...)"
                        value={prompt.sub_topic || ''}
                        onChange={e => updateSpeakingPromptItem(idx, 'sub_topic', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 bg-white"
                      />

                      <textarea
                        rows={2}
                        placeholder="Nội dung câu hỏi Speaking / Cue Card..."
                        value={prompt.question_text}
                        onChange={e => updateSpeakingPromptItem(idx, 'question_text', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:border-indigo-500"
                      />

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>File / URL Audio Video Giọng Đọc</span>
                        </label>
                        <input
                          type="file"
                          accept="audio/*,video/*"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              updateSpeakingPromptItem(idx, 'examiner_audio_url', URL.createObjectURL(file));
                              showToast(`Đã đính kèm file media "${file.name}"!`, 'info');
                            }
                          }}
                          className="w-full text-xs text-slate-500 border border-slate-200 rounded-lg p-1 bg-white cursor-pointer"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Từ vựng gợi ý (phân cách bằng dấu phẩy)..."
                        value={prompt.useful_vocabulary || ''}
                        onChange={e => updateSpeakingPromptItem(idx, 'useful_vocabulary', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 bg-white"
                      />
                    </div>
                  ))}
                </div>
              )}
              {/* Dynamic Question Management for Reading Sets */}
              {editingSet.type === 'reading' && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase text-amber-700 tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      <span>Danh Sách Câu Hỏi Reading ({rQuestions.length} câu)</span>
                    </h4>
                    <button
                      type="button"
                      onClick={addReadingQuestionItem}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm Câu Hỏi</span>
                    </button>
                  </div>

                  {rQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="border border-amber-200/80 rounded-xl p-3 bg-amber-50/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
                          Câu {idx + 1}
                        </span>
                        {rQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeReadingQuestionItem(idx)}
                            className="p-1 text-red-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Nội dung câu hỏi Reading..."
                        value={q.question_text}
                        onChange={e => {
                          const val = e.target.value;
                          setRQuestions(prev => prev.map((item, i) => i === idx ? { ...item, question_text: val } : item));
                        }}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white font-medium"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Dynamic Question Management for Listening Sets */}
              {editingSet.type === 'listening' && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase text-blue-700 tracking-wider flex items-center gap-1.5">
                      <Headphones className="w-4 h-4" />
                      <span>Danh Sách Câu Hỏi Listening ({lQuestions.length} câu)</span>
                    </h4>
                    <button
                      type="button"
                      onClick={addListeningQuestionItem}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm Câu Hỏi</span>
                    </button>
                  </div>

                  {lQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="border border-blue-200/80 rounded-xl p-3 bg-blue-50/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-md">
                          Câu {idx + 1}
                        </span>
                        {lQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeListeningQuestionItem(idx)}
                            className="p-1 text-red-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Nội dung câu hỏi Listening..."
                        value={q.question_text}
                        onChange={e => {
                          const val = e.target.value;
                          setLQuestions(prev => prev.map((item, i) => i === idx ? { ...item, question_text: val } : item));
                        }}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white font-medium"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteSet(editingSet.id)}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa Bộ Này</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#1e50e6] text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-700 transition-colors cursor-pointer shadow-md shadow-blue-500/20"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminCMSPage;
