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

export default function ManageUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", name: "", password: "", role: "BUYER" });
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== "SYSTEM_ADMIN") { navigate("/"); return; }
    loadUsers();
  }, [user]);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateRole = async (id: number, role: string) => {
    try {
      await api.updateUserRole(id, role);
      loadUsers();
    } catch (err: any) { alert(err.message); }
  };

  const deleteUser = async (id: number, name: string) => {
    if (!confirm(`Xóa người dùng "${name}"?`)) return;
    try {
      await api.deleteUser(id);
      loadUsers();
    } catch (err: any) { alert(err.message); }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(newUser);
      setShowCreate(false);
      setNewUser({ email: "", name: "", password: "", role: "BUYER" });
      loadUsers();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="py-20 text-center"><div className="inline-block size-8 border-3 border-black/20 border-t-[#e51c2a] rounded-full animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-12 lg:px-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl font-black tracking-[-.03em] uppercase">Quản lý người dùng</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowCreate(!showCreate)} className="bg-[#e51c2a] text-white px-5 py-2.5 text-xs font-bold uppercase hover:bg-black transition">+ Tạo tài khoản</button>
          <button onClick={() => navigate("/dashboard")} className="text-sm font-bold text-[#e51c2a] hover:underline">← Dashboard</button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={createUser} className="bg-white border border-black/10 p-6 mb-6">
          <h3 className="font-display text-xl font-black mb-4">Tạo tài khoản mới</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Họ tên" required className="border border-black/20 px-4 py-2.5 text-sm outline-none focus:border-[#e51c2a]" />
            <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="Email" required className="border border-black/20 px-4 py-2.5 text-sm outline-none focus:border-[#e51c2a]" />
            <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Mật khẩu" required className="border border-black/20 px-4 py-2.5 text-sm outline-none focus:border-[#e51c2a]" />
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="border border-black/20 px-4 py-2.5 text-sm outline-none focus:border-[#e51c2a]">
              <option value="BUYER">Người mua</option>
              <option value="PUBLISHER">Nhà xuất bản</option>
              <option value="MANAGER">Quản lý</option>
              <option value="SYSTEM_ADMIN">Quản trị viên</option>
            </select>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="bg-green-600 text-white px-5 py-2 text-xs font-bold uppercase hover:bg-green-700 transition">Tạo</button>
            <button type="button" onClick={() => setShowCreate(false)} className="text-xs font-bold text-black/50 hover:text-black">Hủy</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-black/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/5">
                <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider">Tên</th>
                <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider">Vai trò</th>
                <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider">Ngày tạo</th>
                <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-black/5 hover:bg-black/[.02]">
                  <td className="px-4 py-3 text-black/50">#{u.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.avatar ? <img src={u.avatar} className="size-6 rounded-full" /> : <div className="size-6 rounded-full bg-[#e51c2a] grid place-items-center text-white text-[10px] font-bold">{u.name[0]}</div>}
                      <span className="font-bold">{u.name}</span>
                      {u.is_verified && <span className="text-green-500 text-xs">✓</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-black/60">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      disabled={u.id === user?.id}
                      className="border border-black/15 px-2 py-1 text-xs font-bold outline-none disabled:opacity-40"
                    >
                      <option value="BUYER">Người mua</option>
                      <option value="PUBLISHER">Nhà xuất bản</option>
                      <option value="MANAGER">Quản lý</option>
                      <option value="SYSTEM_ADMIN">Quản trị viên</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-black/50">{new Date(u.created_at).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== user?.id && (
                      <button onClick={() => deleteUser(u.id, u.name)} className="text-xs font-bold text-red-500 hover:underline">Xóa</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
