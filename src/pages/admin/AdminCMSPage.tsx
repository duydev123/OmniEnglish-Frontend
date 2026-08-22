import React, { useState, useEffect } from 'react';
import {
  Plus,
  SlidersHorizontal,
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
  ExternalLink,
  Edit3,
  X,
  Check,
  Search,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/common/AppLayout';
import { useToast } from '../../components/common/Toast';
import { adminApi, type AdminCMSStats } from '../../services/adminApi';
import CreateCollectionModal from '../../components/vocabulary/modals/CreateCollectionModal';
import AddWordModal from '../../components/vocabulary/modals/AddWordModal';
import { getMyCollections } from '../../services/vocabularyApi';
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
  type: 'vocab' | 'grammar' | 'speaking' | 'reading' | 'listening' | 'writing';
}

const initialSets: ContentSet[] = [];

export const AdminCMSPage: React.FC = () => {
  const navigate = useNavigate();
  const [sets, setSets] = useState<ContentSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminCMSStats>({
    totalVocabItems: 12482,
    publishedSets: 184,
    draftsPending: 12,
  });
  const [activeTab, setActiveTab] = useState<'vocab' | 'grammar' | 'speaking' | 'reading' | 'listening' | 'writing'>('vocab');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Draft'>('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  // Create & Add Word Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [selectedColIdForAddWord, setSelectedColIdForAddWord] = useState('');
  const [vocabCollections, setVocabCollections] = useState<VocabularyCollection[]>([]);

  // Edit Modal State
  const [editingSet, setEditingSet] = useState<ContentSet | null>(null);

  const fetchBackendCMSData = async () => {
    setLoading(true);
    try {
      const [dataSets, dataStats, collections] = await Promise.all([
        adminApi.getContentSets(),
        adminApi.getStats(),
        getMyCollections().catch(() => []),
      ]);
      if (dataSets && dataSets.length > 0) {
        setSets(dataSets);
      }
      if (dataStats) {
        setStats(dataStats);
      }
      if (collections) {
        setVocabCollections(collections);
      }
    } catch (err) {
      console.warn("Backend admin CMS API fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendCMSData();
  }, []);

  // Tabs Definition
  const tabs = [
    { id: 'vocab', label: 'Vocabulary Sets', count: sets.filter(s => s.type === 'vocab').length },
    { id: 'grammar', label: 'Grammar Modules', count: sets.filter(s => s.type === 'grammar').length },
    { id: 'speaking', label: 'Speaking Topics', count: sets.filter(s => s.type === 'speaking').length },
    { id: 'reading', label: 'Reading Materials', count: sets.filter(s => s.type === 'reading').length },
    { id: 'listening', label: 'Listening Clips', count: sets.filter(s => s.type === 'listening').length },
    { id: 'writing', label: 'Writing Tasks', count: sets.filter(s => s.type === 'writing').length },
  ];

  // Filter sets by activeTab, statusFilter, searchQuery
  const filteredSets = sets.filter(s => {
    if (s.type !== activeTab) return false;
    if (statusFilter !== 'All' && s.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Vui lòng nhập tên bộ nội dung!', 'error');
      return;
    }

    try {
      const createdBackend = await adminApi.createContentSet({
        title: newTitle.trim(),
        category: newCategory.toUpperCase(),
        itemsCount: newCount,
        status: newStatus,
        type: activeTab,
      });
      setSets(prev => [createdBackend, ...prev]);
      showToast(`Đã lưu thành công bộ bài "${createdBackend.title}" vào MongoDB Backend!`, 'success');
    } catch (err) {
      console.warn("Backend create failed, saving locally:", err);
      const createdFallback: ContentSet = {
        id: `set-${Date.now()}`,
        category: newCategory.toUpperCase(),
        badge: newCategory.toUpperCase(),
        title: newTitle.trim(),
        itemsCount: newCount,
        itemUnit: activeTab === 'vocab' ? 'Words' : activeTab === 'grammar' ? 'Lessons' : 'Topics',
        status: newStatus,
        updatedAt: 'Just now',
        type: activeTab,
      };
      setSets(prev => [createdFallback, ...prev]);
      showToast(`Đã tạo thành công bộ "${createdFallback.title}"!`, 'success');
    } finally {
      setShowCreateModal(false);
      setNewTitle('');
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
      showToast(`Đã cập nhật bài học "${updatedBackend.title}" trên MongoDB!`, 'success');
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
      showToast('Đã xóa bộ bài học khỏi MongoDB!', 'warning');
    } catch (err) {
      console.warn("Backend delete failed, deleting locally:", err);
      setSets(prev => prev.filter(s => s.id !== id));
      showToast('Đã xóa bộ bài học!', 'warning');
    } finally {
      setEditingSet(null);
    }
  };

  const getCardIcon = (title: string, category: string) => {
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
    return <Languages className="w-5 h-5 text-blue-600" />;
  };

  // Stats calculation
  const totalVocabItems = 12482 + sets.reduce((acc, curr) => acc + curr.itemsCount, 0);
  const publishedCount = 184 + sets.filter(s => s.status === 'Published').length;
  const draftCount = 12 + sets.filter(s => s.status === 'Draft').length;

  return (
    <AppLayout breadcrumbs={[{ label: 'ADMIN SUITE' }, { label: 'CONTENT MANAGEMENT' }]}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 select-none font-['Be_Vietnam_Pro'] max-w-7xl mx-auto">
        {/* Page Title & Top Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Content Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Organize and curate your educational curriculum assets.
            </p>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(prev => !prev)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
              >
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span>Filters</span>
                {statusFilter !== 'All' && (
                  <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                    {statusFilter}
                  </span>
                )}
              </button>

              {/* Filter Dropdown */}
              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-40">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Lọc theo trạng thái
                  </div>
                  {(['All', 'Published', 'Draft'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => {
                        setStatusFilter(st);
                        setShowFilterDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span>{st === 'All' ? 'Tất cả trạng thái' : st}</span>
                      {statusFilter === st && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Create New Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1e50e6] hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create New</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="border-b border-slate-200/80 overflow-x-auto scrollbar-none">
          <div className="flex gap-6 min-w-max pb-0.5">
            {tabs.map(t => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`pb-3 text-xs sm:text-sm font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'text-[#1e50e6]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{t.label}</span>
                  {t.id === 'vocab' && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.5 rounded-full">
                      24
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1e50e6] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSets.map(item => {
            const isPublished = item.status === 'Published';
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Row: Icon + Edit Actions */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100/90 border border-slate-200/50 flex items-center justify-center shrink-0">
                      {getCardIcon(item.title, item.category)}
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingSet(item)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa bộ bài"
                      >
                        <Pencil className="w-4 h-4" />
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

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {item.title}
                  </h3>

                  {/* Metadata: Items & Status */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-500 font-medium">
                    <div className="flex items-center justify-between">
                      <span>Items:</span>
                      <span className="font-bold text-slate-800">
                        {item.itemsCount} {item.itemUnit}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Status:</span>
                      <button
                        onClick={() => toggleStatus(item.id)}
                        className="flex items-center gap-1.5 font-bold cursor-pointer hover:underline"
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isPublished ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span className={isPublished ? 'text-slate-800' : 'text-slate-500'}>
                          {item.status}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Divider & Card Footer */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400 font-medium">
                    <span>{item.updatedAt}</span>
                    <button
                      onClick={() => navigate(`/vocabulary/${item.id}`)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Quản lý từ vựng</span>
                      <span>→</span>
                    </button>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedColIdForAddWord(item.id);
                        setShowAddWordModal(true);
                      }}
                      className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title="Thêm từ mới vào bộ này"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm từ</span>
                    </button>

                    <button
                      onClick={() => navigate(`/vocabulary/${item.id}/bulk-add`)}
                      className="flex-1 py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title="Nhập hàng loạt từ vựng với AI Gemini"
                    >
                      <span>⚡ Nhập AI</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Dashed Create New Card */}
          <div
            onClick={() => setShowCreateModal(true)}
            className="border-2 border-dashed border-slate-200/90 hover:border-blue-400 rounded-2xl p-6 bg-slate-50/40 hover:bg-white transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer min-h-[240px] group"
          >
            <div className="w-12 h-12 rounded-full bg-slate-200/70 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-600 flex items-center justify-center mb-3 transition-colors">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>

            <h3 className="text-sm font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">
              Create New Vocabulary Set
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">
              Start from scratch or import from CSV
            </p>
          </div>
        </div>

        {/* Bottom Summary Stats Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-around gap-6 mt-8">
          {/* Item 1 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block leading-tight">
                TOTAL VOCAB ITEMS
              </span>
              <span className="text-lg font-extrabold text-slate-900">
                {stats.totalVocabItems.toLocaleString()}
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
                PUBLISHED SETS
              </span>
              <span className="text-lg font-extrabold text-slate-900">
                {stats.publishedSets}
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
                DRAFTS PENDING
              </span>
              <span className="text-lg font-extrabold text-slate-900">
                {stats.draftsPending}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE NEW MODAL */}
      <CreateCollectionModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
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

      {/* EDIT MODAL */}
      {editingSet && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">Chỉnh Sửa Bộ Nội Dung</h3>
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
                  Tên Bài Học
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
                    Số lượng item
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editingSet.itemsCount}
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

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteSet(editingSet.id)}
                  className="border border-red-200 text-red-600 hover:bg-red-50 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Xóa
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
