import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../App";

const roleLabels: Record<string, string> = {
  SYSTEM_ADMIN: "Quản trị viên",
  MANAGER: "Quản lý",
  PUBLISHER: "Nhà xuất bản",
  BUYER: "Người mua",
};

const roleBadgeColors: Record<string, string> = {
  SYSTEM_ADMIN: "bg-red-50 text-red-700 border-red-200",
  MANAGER: "bg-purple-50 text-purple-700 border-purple-200",
  PUBLISHER: "bg-blue-50 text-blue-700 border-blue-200",
  BUYER: "bg-neutral-100 text-neutral-700 border-neutral-200",
};

export default function ManageUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");

  // Create form modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    password: "",
    role: "BUYER",
    phone: "",
    address: "",
  });
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit form modal state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "BUYER",
    password: "",
    is_verified: true,
  });
  const [editError, setEditError] = useState("");
  const [editing, setEditing] = useState(false);

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== "SYSTEM_ADMIN") {
      navigate("/");
      return;
    }
    loadUsers();
  }, [user]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      showToast(err.message || "Không thể tải danh sách tài khoản", "error");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (u: any) => {
    setEditingUser(u);
    setEditForm({
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      address: u.address || "",
      role: u.role || "BUYER",
      password: "",
      is_verified: u.is_verified ?? true,
    });
    setEditError("");
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError("");
    setEditing(true);
    try {
      await api.updateUser(editingUser.id, editForm);
      showToast(`Đã cập nhật tài khoản "${editForm.name}" thành công!`);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      setEditError(err.message || "Cập nhật tài khoản thất bại");
    } finally {
      setEditing(false);
    }
  };

  const deleteUser = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}"? Hành động này không thể hoàn tác.`)) return;
    try {
      const res = await api.deleteUser(id);
      showToast(res.message || `Đã xóa tài khoản "${name}"`);
      loadUsers();
    } catch (err: any) {
      showToast(err.message || "Xóa tài khoản thất bại", "error");
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      await api.createUser(newUser);
      showToast(`Đã tạo tài khoản "${newUser.name}" thành công!`);
      setShowCreate(false);
      setNewUser({ email: "", name: "", password: "", role: "BUYER", phone: "", address: "" });
      loadUsers();
    } catch (err: any) {
      setCreateError(err.message || "Tạo tài khoản thất bại");
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    const matchesRole = selectedRole === "ALL" || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block size-8 border-3 border-black/20 border-t-[#e51c2a] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-12 lg:px-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded shadow-xl border text-sm font-bold animate-bounce ${
            notification.type === "success"
              ? "bg-emerald-600 text-white border-emerald-700"
              : "bg-rose-600 text-white border-rose-700"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-black/10">
        <div>
          <h1 className="font-display text-4xl font-black tracking-[-.03em] uppercase">Quản lý tài khoản</h1>
          <p className="text-black/50 text-sm mt-1">
            Tổng cộng: <strong>{users.length}</strong> tài khoản trong hệ thống
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="bg-[#e51c2a] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-black transition flex items-center gap-1.5"
          >
            <span>+</span> Thêm tài khoản
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="border border-black px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition"
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-black/20 bg-white px-4 py-2 text-sm outline-none focus:border-[#e51c2a] transition"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
          {["ALL", "SYSTEM_ADMIN", "MANAGER", "PUBLISHER", "BUYER"].map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition rounded-xs shrink-0 ${
                selectedRole === role
                  ? "bg-black text-white"
                  : "bg-white border border-black/15 text-black/70 hover:border-black"
              }`}
            >
              {role === "ALL" ? "Tất cả" : roleLabels[role]}
            </button>
          ))}
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white border border-black/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/5 border-b border-black/10">
                <th className="text-left px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-black/70">ID</th>
                <th className="text-left px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-black/70">Người dùng</th>
                <th className="text-left px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-black/70">Email</th>
                <th className="text-left px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-black/70">Điện thoại / Địa chỉ</th>
                <th className="text-left px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-black/70">Vai trò</th>
                <th className="text-left px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-black/70">Ngày tạo</th>
                <th className="text-right px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-black/70">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-black/40 text-sm">
                    Không tìm thấy tài khoản nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-black/[.02] transition">
                    <td className="px-4 py-3.5 text-black/40 font-mono text-xs">#{u.id}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="size-8 rounded-full object-cover border border-black/10" />
                        ) : (
                          <div className="size-8 rounded-full bg-[#e51c2a] grid place-items-center text-white text-xs font-bold">
                            {u.name ? u.name[0].toUpperCase() : "U"}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-black flex items-center gap-1.5">
                            {u.name}
                            {u.id === user?.id && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-black text-white rounded">Bạn</span>
                            )}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {u.google_id && (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                Google
                              </span>
                            )}
                            {u.is_verified ? (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                ✓ Đã xác thực
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                Chưa xác thực
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-black/70 text-xs font-mono">{u.email}</td>
                    <td className="px-4 py-3.5 text-xs text-black/60 max-w-[200px]">
                      {u.phone ? <p className="font-medium text-black">{u.phone}</p> : <p className="text-black/30">Chưa có SĐT</p>}
                      {u.address && <p className="truncate text-[11px] text-black/50" title={u.address}>{u.address}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded border inline-block ${
                          roleBadgeColors[u.role] || "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {roleLabels[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-black/50 text-xs whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(u)}
                          className="px-3 py-1 bg-neutral-100 hover:bg-black hover:text-white border border-black/15 text-xs font-bold uppercase transition"
                        >
                          Sửa
                        </button>
                        {u.id !== user?.id && (
                          <button
                            onClick={() => deleteUser(u.id, u.name)}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 text-rose-700 text-xs font-bold uppercase transition"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white max-w-lg w-full p-6 shadow-2xl border border-black/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/10">
              <h3 className="font-display text-xl font-black uppercase">
                Chỉnh sửa tài khoản #{editingUser.id}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-black/40 hover:text-black font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-black/60 block mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#e51c2a]"
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-black/60 block mb-1">
                  Địa chỉ Email *
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#e51c2a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase tracking-wider text-black/60 block mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="09..."
                    className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#e51c2a]"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-black/60 block mb-1">
                    Vai trò hệ thống
                  </label>
                  <select
                    value={editForm.role}
                    disabled={editingUser.id === user?.id}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#e51c2a] disabled:opacity-50"
                  >
                    <option value="BUYER">Người mua (BUYER)</option>
                    <option value="PUBLISHER">Nhà xuất bản (PUBLISHER)</option>
                    <option value="MANAGER">Quản lý (MANAGER)</option>
                    <option value="SYSTEM_ADMIN">Quản trị viên (SYSTEM_ADMIN)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-black/60 block mb-1">
                  Địa chỉ nhận hàng
                </label>
                <textarea
                  rows={2}
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
                  className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#e51c2a]"
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-black/60 block mb-1">
                  Đặt lại mật khẩu mới (Bỏ trống nếu không đổi)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự..."
                  className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#e51c2a]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="edit_verified"
                  checked={editForm.is_verified}
                  onChange={(e) => setEditForm({ ...editForm, is_verified: e.target.checked })}
                  className="size-4 accent-[#e51c2a]"
                />
                <label htmlFor="edit_verified" className="font-bold text-black/70 cursor-pointer">
                  Đã xác thực email tài khoản này
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-black/20 text-xs font-bold uppercase hover:bg-neutral-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="bg-[#e51c2a] text-white px-5 py-2 text-xs font-bold uppercase hover:bg-black transition disabled:opacity-50"
                >
                  {editing ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white max-w-lg w-full p-6 shadow-2xl border border-black/20">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/10">
              <h3 className="font-display text-xl font-black uppercase">Thêm tài khoản mới</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-black/40 hover:text-black font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded font-medium">
                {createError}
              </div>
            )}

            <form onSubmit={createUser} className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-black/60 block mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#e51c2a]"
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-black/60 block mb-1">
                  Địa chỉ Email *
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#e51c2a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase tracking-wider text-black/60 block mb-1">
                    Mật khẩu *
                  </label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#e51c2a]"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-black/60 block mb-1">
                    Vai trò
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#e51c2a]"
                  >
                    <option value="BUYER">Người mua (BUYER)</option>
                    <option value="PUBLISHER">Nhà xuất bản (PUBLISHER)</option>
                    <option value="MANAGER">Quản lý (MANAGER)</option>
                    <option value="SYSTEM_ADMIN">Quản trị viên (SYSTEM_ADMIN)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-black/60 block mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="09..."
                  className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#e51c2a]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border border-black/20 text-xs font-bold uppercase hover:bg-neutral-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-emerald-600 text-white px-5 py-2 text-xs font-bold uppercase hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {creating ? "Đang tạo..." : "Tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
