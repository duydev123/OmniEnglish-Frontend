import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2
} from 'lucide-react';
import { AppLayout } from '../../components/common/AppLayout';
import { useToast } from '../../components/common/Toast';
import { adminApi } from '../../services/adminApi';
import { useUserStore } from '../../stores/user/useUserStore';

export interface UserRow {
  id: string;
  username: string;
  email: string;
  role: 'Student' | 'Admin';
  avatar?: string;
  proficiency_level: string; // e.g. B2, C2, A1
  proficiency_label: string; // e.g. Upper Int., Mastery, Beginner
  status: 'Active' | 'Suspended';
  joined_date: string;
}

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { showToast } = useToast();
  const { user: currentUser, setUser: setCurrentUser } = useUserStore();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'All Roles' | 'Student' | 'Admin'>('All Roles');
  const [selectedStatus, setSelectedStatus] = useState<'All Statuses' | 'Active' | 'Suspended'>('All Statuses');
  const [selectedProficiency, setSelectedProficiency] = useState<string>('All Levels');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  // Fetch Users from Backend
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers({
        search: searchQuery,
        role: selectedRole,
        status: selectedStatus,
        proficiency: selectedProficiency,
      });
      if (data && Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.warn('Backend getUsers fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, selectedRole, selectedStatus, selectedProficiency]);

  // Handle select all
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(users.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Update User
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const updated = await adminApi.updateUser(editingUser.id, {
        username: editingUser.username,
        email: editingUser.email,
        role: editingUser.role,
        proficiency_level: editingUser.proficiency_level,
        status: editingUser.status,
      });
      setUsers(prev => prev.map(u => (u.id === editingUser.id ? (updated.id ? updated : { ...editingUser, ...updated }) : u)));
      
      // If updating currently logged in user, update local store state
      if (currentUser && (currentUser.id === editingUser.id || currentUser.email === editingUser.email)) {
        setCurrentUser({
          ...currentUser,
          role: editingUser.role === 'Admin' ? 'admin' : 'user',
          username: editingUser.username,
          email: editingUser.email,
        });
      }

      showToast(`✅ Đã cập nhật tài khoản "${editingUser.username}" sang vai trò ${editingUser.role}!`, 'success');
      fetchUsers();
    } catch (err: any) {
      console.error('Update user error:', err);
      showToast(`Lỗi khi cập nhật tài khoản: ${err?.response?.data?.detail || err.message}`, 'error');
    } finally {
      setEditingUser(null);
    }
  };

  // Toggle Suspend Status
  const toggleUserStatus = async (id: string) => {
    const target = users.find(u => u.id === id);
    if (!target) return;
    const nextStatus = target.status === 'Active' ? 'Suspended' : 'Active';
    try {
      const updated = await adminApi.updateUser(id, { status: nextStatus });
      setUsers(prev => prev.map(u => (u.id === id ? (updated.id ? updated : { ...u, status: nextStatus }) : u)));
      showToast(`🔒 Đã chuyển trạng thái tài khoản "${target.username}" sang ${nextStatus}!`, 'success');
      fetchUsers();
    } catch (err: any) {
      console.error('Toggle status error:', err);
      showToast(`Lỗi khi chuyển trạng thái: ${err?.response?.data?.detail || err.message}`, 'error');
    }
  };

  // Delete User
  const handleDeleteUser = async (id: string) => {
    const target = users.find(u => u.id === id);
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${target?.username || id}" khỏi CSDL MongoDB không?`)) {
      return;
    }
    try {
      await adminApi.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast(`🗑️ Đã xóa vĩnh viễn tài khoản "${target?.username || ''}" khỏi MongoDB!`, 'warning');
      fetchUsers();
    } catch (err: any) {
      console.error('Delete user error:', err);
      showToast(`Lỗi khi xóa tài khoản: ${err?.response?.data?.detail || err.message}`, 'error');
    } finally {
      setEditingUser(null);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} tài khoản đã chọn khỏi MongoDB không?`)) {
      return;
    }
    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id => adminApi.deleteUser(id)));
      showToast(`🗑️ Đã xóa thành công ${selectedIds.length} tài khoản khỏi MongoDB!`, 'success');
      setSelectedIds([]);
      fetchUsers();
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      showToast('Lỗi khi xóa hàng loạt tài khoản!', 'error');
      fetchUsers();
    }
  };

  // Bulk Status Change
  const handleBulkStatusChange = async (nextStatus: 'Active' | 'Suspended') => {
    if (selectedIds.length === 0) return;
    const actionName = nextStatus === 'Active' ? 'mở khóa' : 'tạm khóa';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} ${selectedIds.length} tài khoản đã chọn không?`)) {
      return;
    }
    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id => adminApi.updateUser(id, { status: nextStatus })));
      showToast(`🔒 Đã ${actionName} thành công ${selectedIds.length} tài khoản!`, 'success');
      setSelectedIds([]);
      fetchUsers();
    } catch (err: any) {
      console.error('Bulk status change error:', err);
      showToast(`Lỗi khi ${actionName} hàng loạt tài khoản!`, 'error');
      fetchUsers();
    }
  };

  const totalUsersCount = users.length;

  return (
    <AppLayout breadcrumbs={[{ label: 'Quản trị' }, { label: 'Quản lý người dùng' }]}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 select-none font-['Be_Vietnam_Pro'] max-w-7xl mx-auto">
        {/* Header Row: Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quản Lý Người Dùng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Quản lý danh sách học viên và ban quản trị trên hệ thống.
          </p>
        </div>

        {/* Bulk Actions Toolbar Banner */}
        {selectedIds.length > 0 && (
          <div className="bg-white border border-blue-200/80 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-800">
              <span className="bg-[#1D4ED8] text-white px-2.5 py-0.5 rounded-full text-xs font-black">
                {selectedIds.length}
              </span>
              <span>người dùng đã được chọn</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleBulkStatusChange('Active')}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Unlock size={14} />
                <span>Mở khóa hàng loạt</span>
              </button>

              <button
                onClick={() => handleBulkStatusChange('Suspended')}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Lock size={14} />
                <span>Khóa hàng loạt</span>
              </button>

              <button
                onClick={handleBulkDelete}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Trash2 size={14} />
                <span>Xóa hàng loạt</span>
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}

        {/* Filter Bar Box */}
        <div className="bg-white border border-slate-400/60 rounded-2xl p-4 sm:p-5 shadow-glow-4side hover:shadow-glow-4side-lg transition-all duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                Tìm kiếm
              </label>
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tên hoặc email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50/60 hover:bg-slate-100 focus:bg-white text-slate-800 text-xs sm:text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all font-medium"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                Vai trò
              </label>
              <div className="relative">
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value as any)}
                  className="w-full appearance-none bg-slate-50/60 hover:bg-slate-100 focus:bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all font-medium cursor-pointer"
                >
                  <option value="All Roles">Tất cả vai trò</option>
                  <option value="Student">Học viên</option>
                  <option value="Admin">Quản trị viên</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                Trạng thái
              </label>
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value as any)}
                  className="w-full appearance-none bg-slate-50/60 hover:bg-slate-100 focus:bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all font-medium cursor-pointer"
                >
                  <option value="All Statuses">Tất cả trạng thái</option>
                  <option value="Active">Hoạt động</option>
                  <option value="Suspended">Tạm khóa</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Proficiency Filter */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                Trình độ tiếng Anh
              </label>
              <div className="relative">
                <select
                  value={selectedProficiency}
                  onChange={e => setSelectedProficiency(e.target.value)}
                  className="w-full appearance-none bg-slate-50/60 hover:bg-slate-100 focus:bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all font-medium cursor-pointer"
                >
                  <option value="All Levels">Tất cả trình độ</option>
                  <option value="A1">A1 - Sơ cấp</option>
                  <option value="A2">A2 - Cơ bản</option>
                  <option value="B1">B1 - Trung cấp</option>
                  <option value="B2">B2 - Trung cao cấp</option>
                  <option value="C1">C1 - Cao cấp</option>
                  <option value="C2">C2 - Thành thục</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* User Table Container */}
        <div className="bg-white border border-slate-400/60 rounded-2xl shadow-glow-4side hover:shadow-glow-4side-lg transition-all duration-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-4 sm:px-6 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === users.length && users.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-4 px-4 sm:px-6">NGƯỜI DÙNG</th>
                  <th className="py-4 px-4 sm:px-6">VAI TRÒ</th>
                  <th className="py-4 px-4 sm:px-6">TRÌNH ĐỘ</th>
                  <th className="py-4 px-4 sm:px-6">TRẠNG THÁI</th>
                  <th className="py-4 px-4 sm:px-6">NGÀY THAM GIA</th>
                  <th className="py-4 px-4 sm:px-6 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2 font-medium">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span>Đang tải danh sách người dùng từ MongoDB...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1 font-medium">
                        <span>Không tìm thấy người dùng phù hợp.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map(u => {
                    const isSelected = selectedIds.includes(u.id);
                    const isAdmin = u.role === 'Admin';
                  const isActive = u.status === 'Active';

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(u.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* User Avatar + Name + Email */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-600">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                            ) : (
                              <span>{u.username.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 leading-snug truncate">
                              {u.username}
                            </p>
                            <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4 sm:px-6">
                        <span
                          className={`text-[11px] font-bold px-3 py-1 rounded-full inline-block ${
                            isAdmin
                              ? 'bg-indigo-100 text-indigo-700 border border-indigo-200/60'
                              : 'bg-slate-100 text-slate-600 border border-slate-200/50'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Proficiency Badge */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200/80">
                            {u.proficiency_level}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">
                            {u.proficiency_label}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 sm:px-6">
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          className="flex items-center gap-1.5 font-bold cursor-pointer hover:underline"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          <span className={isActive ? 'text-emerald-700' : 'text-red-600'}>
                            {u.status}
                          </span>
                        </button>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-4 sm:px-6 text-slate-500 font-medium">
                        {u.joined_date}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingUser(u)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa tài khoản"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleUserStatus(u.id)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title={isActive ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                          >
                            {isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="p-4 sm:px-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
            <div>
              Hiển thị 1–{users.length} trong tổng số {totalUsersCount.toLocaleString()} người dùng
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button className="w-8 h-8 rounded-lg bg-[#1e50e6] text-white flex items-center justify-center font-bold cursor-pointer">
                1
              </button>
              <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer">
                2
              </button>
              <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer">
                3
              </button>
              <span className="px-1 text-slate-400">...</span>
              <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer">
                125
              </button>

              <button
                onClick={() => setCurrentPage(p => p + 1)}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-glow-4side-lg space-y-5 border border-slate-400/60 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">Chỉnh Sửa Người Dùng</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                  Tên Người Dùng
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.username}
                  onChange={e => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                    Vai trò
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 cursor-pointer"
                  >
                    <option value="Student">Học viên</option>
                    <option value="Admin">Quản trị viên</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                    Trạng thái
                  </label>
                  <select
                    value={editingUser.status}
                    onChange={e => setEditingUser({ ...editingUser, status: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 cursor-pointer"
                  >
                    <option value="Active">Hoạt động</option>
                    <option value="Suspended">Tạm khóa</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteUser(editingUser.id)}
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

export default AdminUsersPage;
