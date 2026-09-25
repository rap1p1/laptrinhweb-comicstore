import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../App";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [searchParams] = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "true";
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccessMsg, setPwSuccessMsg] = useState("");
  const [pwErrorMsg, setPwErrorMsg] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const data = await api.me();
      setName(data.name || "");
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setAvatar(data.avatar || "");
    } catch (err: any) {
      console.error("Load profile failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!name.trim()) {
      setErrorMsg("Họ và tên không được để trống");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        avatar: avatar.trim() || undefined,
      });
      api.setAuth(api.getToken() || "", updated);
      setUser(updated);
      setSuccessMsg("Cập nhật thông tin thành công!");
      if (isOnboarding) {
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi cập nhật thông tin");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErrorMsg("");
    setPwSuccessMsg("");
    if (!currentPassword || !newPassword) {
      setPwErrorMsg("Vui lòng nhập đầy đủ mật khẩu");
      return;
    }
    if (newPassword.length < 6) {
      setPwErrorMsg("Mật khẩu mới tối thiểu 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErrorMsg("Mật khẩu xác nhận không khớp");
      return;
    }

    setPwSaving(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPwSuccessMsg("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwErrorMsg(err.message || "Đổi mật khẩu thất bại");
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block size-9 border-3 border-black/20 border-t-[#e51c2a] rounded-full animate-spin" />
      </div>
    );
  }

  const roleText: Record<string, string> = {
    SYSTEM_ADMIN: "Quản trị viên",
    MANAGER: "Quản lý cửa hàng",
    PUBLISHER: "Nhà xuất bản",
    BUYER: "Khách mua hàng",
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 lg:px-12">
      {/* Onboarding Welcome Banner */}
      {isOnboarding && (
        <div className="mb-8 bg-amber-50 border-2 border-amber-300 p-6 rounded-xs shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🎉</span>
            <h2 className="font-display text-xl font-black text-amber-900 uppercase">
              Chào mừng bạn đến với PANEL Comic Store!
            </h2>
          </div>
          <p className="text-xs text-amber-800">
            Bạn vừa đăng nhập thành công qua tài khoản Google. Hãy cập nhật <strong>Số điện thoại</strong> và <strong>Địa chỉ giao hàng</strong> bên dưới để hoàn tất thông tin nhận đơn hàng truyện tranh.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-black/10">
        <div>
          <h1 className="font-display text-4xl font-black tracking-[-.03em] uppercase">Hồ sơ & Cài đặt</h1>
          <p className="text-black/50 text-sm mt-1">Quản lý thông tin cá nhân và địa chỉ nhận hàng của bạn</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-black text-white rounded-full">
            {roleText[user?.role] || user?.role}
          </span>
          {user?.google_id && (
            <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full flex items-center gap-1">
              Google Account
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        {/* Main Info Form */}
        <div className="bg-white border border-black/10 p-6 shadow-xs">
          <h2 className="font-display text-xl font-black uppercase mb-6 pb-2 border-b border-black/10">
            Thông tin cá nhân
          </h2>

          {successMsg && (
            <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 font-semibold rounded">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 font-semibold rounded">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-black/60 block mb-2">
                Email đăng ký
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full border border-black/15 bg-neutral-100 px-4 py-2.5 text-sm text-black/60 outline-none cursor-not-allowed"
              />
              <span className="text-[11px] text-black/40 mt-1 block">Email dùng để đăng nhập và không thể thay đổi</span>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-black/60 block mb-2">
                Họ và tên *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập họ và tên..."
                className="w-full border border-black/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#e51c2a] transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-black/60 block mb-2">
                Số điện thoại liên hệ *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ví dụ: 0912345678"
                className="w-full border border-black/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#e51c2a] transition"
              />
              <span className="text-[11px] text-black/40 mt-1 block">Dùng để shipper liên hệ giao truyện cho bạn</span>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-black/60 block mb-2">
                Địa chỉ nhận hàng mặc định *
              </label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                className="w-full border border-black/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#e51c2a] resize-none transition"
              />
              <span className="text-[11px] text-black/40 mt-1 block">Tự động điền vào trang Thanh toán khi bạn mua hàng</span>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-black/60 block mb-2">
                Đường dẫn ảnh đại diện (Avatar URL)
              </label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full border border-black/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#e51c2a] transition"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-[#e51c2a] hover:bg-black text-white px-6 py-3 text-xs font-black uppercase tracking-wider transition disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </div>

        {/* Sidebar: Avatar Preview & Password Change */}
        <div className="space-y-6">
          {/* Avatar Preview Card */}
          <div className="bg-white border border-black/10 p-6 text-center shadow-xs">
            <div className="relative mx-auto size-24 mb-4">
              {avatar || user?.avatar ? (
                <img
                  src={avatar || user?.avatar}
                  alt={name}
                  className="size-24 rounded-full object-cover border-2 border-black/10 shadow-xs"
                />
              ) : (
                <div className="size-24 rounded-full bg-[#e51c2a] grid place-items-center text-white text-3xl font-black">
                  {name ? name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </div>
            <p className="font-display text-lg font-black">{name || "Chưa đặt tên"}</p>
            <p className="text-xs text-black/50 mb-3">{user?.email}</p>
            <div className="pt-3 border-t border-black/10 text-xs text-black/60 flex justify-between">
              <span>Vai trò:</span>
              <strong className="text-black">{roleText[user?.role] || user?.role}</strong>
            </div>
          </div>

          {/* Change Password Card (Only if user has password) */}
          {!user?.google_id && (
            <div className="bg-white border border-black/10 p-6 shadow-xs">
              <h3 className="font-display text-sm font-black uppercase mb-4 pb-2 border-b border-black/10">
                Đổi mật khẩu
              </h3>

              {pwSuccessMsg && (
                <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-2.5 rounded">
                  {pwSuccessMsg}
                </div>
              )}
              {pwErrorMsg && (
                <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded">
                  {pwErrorMsg}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-black/60 block mb-1">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full border border-black/20 px-3 py-2 text-xs outline-none focus:border-[#e51c2a]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-black/60 block mb-1">Mật khẩu mới</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-black/20 px-3 py-2 text-xs outline-none focus:border-[#e51c2a]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-black/60 block mb-1">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-black/20 px-3 py-2 text-xs outline-none focus:border-[#e51c2a]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="w-full mt-2 border border-black text-black hover:bg-black hover:text-white py-2 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                >
                  {pwSaving ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
