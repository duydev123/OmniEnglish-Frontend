import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/common/AppLayout';
import { writingApi } from '../../services/writingApi';
import { useToast } from '../../components/common/Toast';
import { getApiErrorMessage } from '../../utils/error';
import { cleanHtmlToText } from '../../utils/text';
import type {
  WritingSubmitResponse,
  ImprovedEssaySampleResponse,
  DetailedFeedback,
} from '../../types/writing';
import {
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Loader2,
  X,
  Copy,
} from 'lucide-react';

export const WritingReviewPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [reviewData, setReviewData] = useState<WritingSubmitResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedError, setSelectedError] = useState<DetailedFeedback | null>(null);

  const [improvedModalOpen, setImprovedModalOpen] = useState<boolean>(false);
  const [improvedData, setImprovedData] = useState<ImprovedEssaySampleResponse | null>(null);
  const [loadingImproved, setLoadingImproved] = useState<boolean>(false);
  const [applyingRevision, setApplyingRevision] = useState<boolean>(false);

  useEffect(() => {
    const fetchReview = async () => {
      if (!sessionId) return;
      setLoading(true);
      try {
        const data = await writingApi.getSubmissionById(sessionId);
        setReviewData(data);
      } catch (err) {
        showToast(getApiErrorMessage(err, 'Lỗi khi tải kết quả chấm bài'), 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [sessionId, showToast]);

  const handleFetchImprovedSample = async () => {
    if (!sessionId) return;
    setImprovedModalOpen(true);
    if (improvedData) {
      return; // Already cached
    }
    setLoadingImproved(true);
    try {
      const res = await writingApi.getImprovedEssaySample(sessionId);
      setImprovedData(res);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Lỗi khi tải bài viết nâng cấp'), 'error');
    } finally {
      setLoadingImproved(false);
    }
  };

  const handleCopyImprovedEssay = () => {
    if (!improvedData?.improved_essay) return;
    navigator.clipboard.writeText(improvedData.improved_essay);
    showToast('Đã sao chép bài viết nâng cấp vào clipboard!', 'success');
  };

  const handleUseAiRevision = async () => {
    if (!improvedData?.improved_essay || !reviewData?.prompt_id) return;
    setApplyingRevision(true);
    try {
      await writingApi.saveDraft({
        prompt_id: reviewData.prompt_id,
        essay_content: improvedData.improved_essay,
        word_count: improvedData.improved_essay.trim().split(/\s+/).length,
        time_spent_seconds: 0,
      });
      showToast('Đã áp dụng bản nâng cấp AI làm bài nháp mới!', 'success');
      navigate(`/writing/editor/${reviewData.prompt_id}`);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Lỗi khi áp dụng bài viết nâng cấp'), 'error');
    } finally {
      setApplyingRevision(false);
    }
  };

  if (loading || !reviewData) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Luyện tập', href: '/practice-modules' }, { label: 'Luyện viết', href: '/practice-modules/writing' }, { label: 'Kết quả đánh giá AI' }]}>
        <div className="flex flex-col items-center justify-center min-h-[600px]">
          <Loader2 className="w-10 h-10 text-[#1D4ED8] animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-600">Đang chấm điểm & phân tích bài viết bằng AI...</p>
        </div>
      </AppLayout>
    );
  }

  // Render Highlighted Essay Text dynamically matching reviewData.highlight_spans
  const renderHighlightedEssay = () => {
    const rawContent = reviewData.essay_content || '';
    const content = cleanHtmlToText(rawContent);
    const spans = reviewData.highlight_spans || [];

    if (!spans || spans.length === 0) {
      return <p className="leading-relaxed whitespace-pre-line text-slate-800 font-medium text-xs sm:text-sm">{content}</p>;
    }

    const sortedSpans = [...spans].sort((a, b) => b.text.length - a.text.length);
    const escapedTexts = sortedSpans
      .map((s) => s.text.trim())
      .filter(Boolean)
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (escapedTexts.length === 0) {
      return <p className="leading-relaxed whitespace-pre-line text-slate-800 font-medium text-xs sm:text-sm">{content}</p>;
    }

    const regex = new RegExp(`(${escapedTexts.join('|')})`, 'gi');
    const parts = content.split(regex);

    return (
      <p className="leading-relaxed whitespace-pre-line text-slate-800 font-medium text-xs sm:text-sm">
        {parts.map((part, index) => {
          const matchedSpan = spans.find((s) => s.text.toLowerCase().trim() === part.toLowerCase().trim());
          if (!matchedSpan) {
            return <React.Fragment key={index}>{part}</React.Fragment>;
          }

          const detail = reviewData.detailed_feedbacks?.[matchedSpan.feedback_index] || reviewData.detailed_feedbacks?.[0];
          const spanType = matchedSpan.type ? matchedSpan.type.toUpperCase() : 'GRAMMAR';

          let styleClasses =
            'border-b-2 border-red-500 bg-red-50 text-slate-900 font-bold cursor-pointer hover:bg-red-100 transition-colors px-1 py-0.5 rounded';
          if (spanType.includes('WORD') || spanType.includes('LEXIS') || spanType.includes('VOCAB')) {
            styleClasses =
              'bg-blue-50 text-slate-900 font-bold border-b-2 border-blue-500 cursor-pointer hover:bg-blue-100 transition-colors px-1 py-0.5 rounded';
          } else if (spanType.includes('COHERENCE') || spanType.includes('STRUCTURE')) {
            styleClasses =
              'bg-amber-100 text-slate-900 font-bold border-b-2 border-amber-400 cursor-pointer hover:bg-amber-200 transition-colors px-1 py-0.5 rounded';
          }

          return (
            <span
              key={index}
              onClick={() => setSelectedError(detail || null)}
              className={styleClasses}
              title={`Click to view ${detail?.category || spanType} feedback`}
            >
              {part}
            </span>
          );
        })}
      </p>
    );
  };

  return (
    <AppLayout breadcrumbs={[{ label: 'Luyện tập', href: '/practice-modules' }, { label: 'Luyện viết', href: '/practice-modules/writing' }, { label: 'Kết quả đánh giá AI' }]}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] mx-auto space-y-7 font-['Be_Vietnam_Pro']">

        {/* ================= TOP HEADER CARD: Writing Review Summary (Screenshot 2 Top) ================= */}
        <div className="bg-white rounded-3xl border border-slate-400/60 p-6 sm:p-8 shadow-glow-4side flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">

            {/* CURRENT Score Badge */}
            <div className="flex items-center gap-3">
              <div className="text-center">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  CURRENT
                </span>
                <div className="w-16 h-16 rounded-full border-2 border-slate-200 flex items-center justify-center font-black text-xl text-slate-800 shadow-xs">
                  {reviewData.overall_score.toFixed(1)}
                </div>
              </div>

              <span className="text-slate-300 font-black text-xl">→</span>

              {/* POTENTIAL Score Badge */}
              <div className="text-center">
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider block mb-1">
                  POTENTIAL
                </span>
                <div className="w-16 h-16 rounded-full border-2 border-blue-600 flex items-center justify-center font-black text-xl text-blue-700 bg-blue-50/50 shadow-xs">
                  {reviewData.potential_score.toFixed(1)}
                </div>
              </div>
            </div>

            {/* General Summary Text */}
            <div className="space-y-1 max-w-xl">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Writing Review Summary
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                {reviewData.general_summary}
              </p>
            </div>
          </div>

          {/* Action Buttons Header */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => handleFetchImprovedSample()}
              className="px-5 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles size={16} />
              <span>Xem Bài Viết Nâng Cấp</span>
            </button>

            <button
              onClick={() => navigate(`/writing/editor/${reviewData.prompt_id}`)}
              className="px-5 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw size={16} />
              <span>Viết lại</span>
            </button>
          </div>
        </div>

        {/* ================= MAIN CONTENT GRID (Screenshot 2 Bottom) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">

          {/* ================= LEFT/CENTER COLUMN: Key Improvements (6 cols) ================= */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Key Improvements
              </h2>

              {/* Color Category Indicators */}
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Grammar
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Vocabulary
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Advanced
                </span>
              </div>
            </div>

            {/* Improvement Comparison Cards matching Screenshot 2 */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {(reviewData.improvements_comparison || []).map((imp, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white rounded-3xl border border-slate-400/60 p-4 sm:p-5 shadow-glow-4side">
                  {/* Original Side */}
                  <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-black text-red-600 uppercase tracking-wider">
                      <X size={14} /> ORIGINAL
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      {imp.original}
                    </p>
                  </div>

                  {/* AI Improved Side */}
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px] font-black text-emerald-700 uppercase tracking-wider">
                        <CheckCircle2 size={14} /> {imp.category === 'Grammar' ? 'AI IMPROVED' : imp.category.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-bold leading-relaxed">
                      {imp.improved}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actionable Next Steps */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 space-y-3">
              <h3 className="text-sm font-black text-blue-900 flex items-center gap-2">
                <Sparkles className="text-blue-600" /> Actionable Next Steps
              </h3>
              <ul className="space-y-2">
                {(reviewData.actionable_next_steps || []).map((step, i) => (
                  <li key={i} className="text-xs font-semibold text-slate-700 flex items-start gap-2">
                    <span className="text-[#1D4ED8] font-black">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: Full Essay & IELTS Scoring Breakdown (6 cols) ================= */}
          <div className="lg:col-span-6 space-y-6">

            {/* Full Essay Box with Interactive Error Highlights */}
            <div className="bg-white rounded-3xl border border-slate-400/60 p-6 shadow-glow-4side space-y-4 flex flex-col max-h-[600px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <h2 className="text-base font-black text-slate-900">Full Essay</h2>
                <span className="text-xs font-bold text-slate-400">Original Draft</span>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                {renderHighlightedEssay()}
              </div>

              {/* Floating Error Details Modal on Click */}
              {selectedError && (
                <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 shadow-xl animate-[fadeIn_0.2s_ease] shrink-0">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-amber-400 uppercase tracking-wider">{selectedError.category} Error Detail</span>
                    <button onClick={() => setSelectedError(null)} className="text-slate-400 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="text-xs space-y-1">
                    <p><span className="text-slate-400">Original:</span> <span className="line-through text-red-300">{selectedError.original}</span></p>
                    <p><span className="text-slate-400">Correction:</span> <strong className="text-emerald-400">{selectedError.correction}</strong></p>
                    <p><span className="text-slate-400">Rule:</span> {selectedError.explanation}</p>
                  </div>
                </div>
              )}
            </div>

            {/* IELTS Scoring Breakdown Card matching Screenshot 2 Right Bottom */}
            <div className="bg-white rounded-3xl border border-slate-400/60 p-6 shadow-glow-4side space-y-5">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                IELTS Scoring Breakdown
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* 1. Task Achievement / Response */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-slate-500 uppercase tracking-wider">TASK RESPONSE</span>
                    <span className="text-blue-700 text-sm">{reviewData.task_achievement_score.toFixed(1)}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1D4ED8] rounded-full"
                      style={{ width: `${(reviewData.task_achievement_score / 9) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    {reviewData.task_achievement_score >= 8.0
                      ? 'Fully & persuasively addresses all parts of the prompt with well-developed ideas.'
                      : reviewData.task_achievement_score >= 7.0
                      ? 'Addresses all parts of the task with clear main ideas and relevant supporting points.'
                      : reviewData.task_achievement_score >= 6.0
                      ? 'Addresses the main requirements of the task, though some points could be expanded.'
                      : 'Presents a limited response to the prompt; needs deeper explanation and main idea focus.'}
                  </p>
                </div>

                {/* 2. Coherence & Cohesion */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-slate-500 uppercase tracking-wider">COHERENCE & COHESION</span>
                    <span className="text-blue-700 text-sm">{reviewData.coherence_cohesion_score.toFixed(1)}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1D4ED8] rounded-full"
                      style={{ width: `${(reviewData.coherence_cohesion_score / 9) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    {reviewData.coherence_cohesion_score >= 8.0
                      ? 'Sequences information and ideas logically with seamless paragraph cohesion.'
                      : reviewData.coherence_cohesion_score >= 7.0
                      ? 'Organizes information and ideas logically with clear progression throughout.'
                      : reviewData.coherence_cohesion_score >= 6.0
                      ? 'Arranges ideas coherently with effective paragraphing and basic cohesive devices.'
                      : 'Cohesion between sentences and paragraphs may be mechanical or inconsistent.'}
                  </p>
                </div>

                {/* 3. Lexical Resources */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-slate-500 uppercase tracking-wider">LEXICAL RESOURCE</span>
                    <span className="text-blue-700 text-sm">{reviewData.lexical_resource_score.toFixed(1)}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1D4ED8] rounded-full"
                      style={{ width: `${(reviewData.lexical_resource_score / 9) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    {reviewData.lexical_resource_score >= 8.0
                      ? 'Uses a wide range of vocabulary fluently and flexibly with sophisticated collocations.'
                      : reviewData.lexical_resource_score >= 7.0
                      ? 'Uses a sufficient range of vocabulary with flexibility and awareness of collocation.'
                      : reviewData.lexical_resource_score >= 6.0
                      ? 'Uses an adequate range of vocabulary for the task with general clarity.'
                      : 'Uses a limited range of vocabulary; contains noticeable errors in word choice or spelling.'}
                  </p>
                </div>

                {/* 4. Grammar Range & Accuracy */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-slate-500 uppercase tracking-wider">GRAMMAR RANGE & ACCURACY</span>
                    <span className="text-blue-700 text-sm">{reviewData.grammar_accuracy_score.toFixed(1)}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1D4ED8] rounded-full"
                      style={{ width: `${(reviewData.grammar_accuracy_score / 9) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    {reviewData.grammar_accuracy_score >= 8.0
                      ? 'Uses a wide range of structures with full flexibility and high accuracy.'
                      : reviewData.grammar_accuracy_score >= 7.0
                      ? 'Uses a variety of complex structures with frequent error-free sentences.'
                      : reviewData.grammar_accuracy_score >= 6.0
                      ? 'Uses a mix of simple and complex sentence forms with good overall control.'
                      : 'Attempts complex sentences but contains frequent grammatical errors and punctuation slips.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UC-15 Improved Essay Sample Modal */}
      {improvedModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 flex flex-col max-h-[90vh] shadow-2xl relative my-8">
            <button
              onClick={() => setImprovedModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer z-10"
            >
              <X size={20} />
            </button>

            <div className="space-y-2 pb-4 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="text-indigo-600" /> AI Improved Essay Sample
              </h2>
              <p className="text-xs text-slate-500 font-medium font-['Be_Vietnam_Pro']">
                Phiên bản essay nâng cấp từ AI bảo lưu hoàn toàn ý tưởng của bạn nhưng được tối ưu hóa từ vựng và ngữ pháp.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto py-5 pr-1 space-y-5">
              {loadingImproved ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-[#1D4ED8] animate-spin mb-3" />
                  <p className="text-xs font-bold text-slate-600">AI đang viết lại bài essay hoàn chỉnh...</p>
                </div>
              ) : improvedData ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                      <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Bài viết gốc của bạn</h3>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-semibold">
                        {cleanHtmlToText(improvedData.original_essay)}
                      </p>
                    </div>

                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2">
                      <h3 className="font-extrabold text-xs text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Phiên bản AI nâng cấp
                      </h3>
                      <p className="text-xs text-slate-900 font-bold leading-relaxed whitespace-pre-line">
                        {cleanHtmlToText(improvedData.improved_essay)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-2">
                    <h3 className="font-extrabold text-xs text-indigo-900 uppercase tracking-wider">
                      Các điểm đã được cải thiện:
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 font-semibold">
                      {improvedData.improvements_explanation.map((exp, idx) => (
                        <li key={idx}>{exp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>

            {!loadingImproved && improvedData && (
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                <button
                  onClick={handleCopyImprovedEssay}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs w-full sm:w-auto justify-center"
                >
                  <Copy size={14} />
                  <span>Sao chép bài viết</span>
                </button>
                <button
                  onClick={handleUseAiRevision}
                  disabled={applyingRevision}
                  className="px-5 py-2.5 bg-[#1D4ED8] hover:bg-blue-800 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-500/10 w-full sm:w-auto justify-center disabled:opacity-50"
                >
                  {applyingRevision ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>Sử dụng bản sửa đổi này để viết tiếp</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default WritingReviewPage;

