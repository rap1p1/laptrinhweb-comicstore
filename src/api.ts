const API_BASE = import.meta.env.VITE_API_URL || "";
const API_URL = `${API_BASE}/api`;

function getToken() {
  return localStorage.getItem("token");
}

function setAuth(token: string, user: any) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Lỗi server");
  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (email: string, name: string, password: string) => request("/auth/register", { method: "POST", body: JSON.stringify({ email, name, password }) }),
  googleLogin: (credential: string) => request("/auth/google", { method: "POST", body: JSON.stringify({ credential }) }),
  me: () => request("/auth/me"),
  updateProfile: (data: { name: string; phone?: string; address?: string; avatar?: string }) =>
    request("/auth/profile", { method: "PATCH", body: JSON.stringify(data) }),
  verifyEmail: (code: string) => request("/auth/verify-email", { method: "POST", body: JSON.stringify({ code }) }),
  forgotPassword: (email: string) => request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (email: string, code: string, newPassword: string) => request("/auth/reset-password", { method: "POST", body: JSON.stringify({ email, code, newPassword }) }),
  changePassword: (currentPassword: string, newPassword: string) => request("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }),
  resendOtp: (type: string) => request("/auth/resend-otp", { method: "POST", body: JSON.stringify({ type }) }),

  // Comics
  getComics: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return request(`/comics${query}`);
  },
  getComic: (id: number) => request(`/comics/${id}`),
  createComic: (data: any) => request("/comics", { method: "POST", body: JSON.stringify(data) }),
  updateComic: (id: number, data: any) => request(`/comics/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteComic: (id: number) => request(`/comics/${id}`, { method: "DELETE" }),
  getPendingComics: () => request("/comics/manage/pending"),
  getMyComics: () => request("/comics/manage/my-comics"),
  getAllComics: () => request("/comics/manage/all"),
  reviewComic: (id: number, status: string, reject_reason?: string) => request(`/comics/${id}/review`, { method: "PATCH", body: JSON.stringify({ status, reject_reason }) }),
  updateStock: (id: number, stock: number) => request(`/comics/${id}/stock`, { method: "PATCH", body: JSON.stringify({ stock }) }),

  // Cart
  getCart: () => request("/cart"),
  addToCart: (comic_id: number, quantity?: number) => request("/cart", { method: "POST", body: JSON.stringify({ comic_id, quantity: quantity || 1 }) }),
  updateCartItem: (id: number, quantity: number) => request(`/cart/${id}`, { method: "PUT", body: JSON.stringify({ quantity }) }),
  removeFromCart: (id: number) => request(`/cart/${id}`, { method: "DELETE" }),
  clearCart: () => request("/cart", { method: "DELETE" }),
  getCartCount: () => request("/cart/count"),

  // Orders
  createOrder: (data: any) => request("/orders", { method: "POST", body: JSON.stringify(data) }),
  getMyOrders: () => request("/orders/my-orders"),
  getAllOrders: () => request("/orders/all"),
  updateOrderStatus: (id: number, status: string) => request(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  customerOrderAction: (id: number, action: string, return_reason?: string) =>
    request(`/orders/${id}/customer-action`, { method: "PATCH", body: JSON.stringify({ action, return_reason }) }),

  // Character Tags
  getTags: (all?: boolean) => request(`/tags${all ? "?all=true" : ""}`),
  createTag: (name: string, wiki_url?: string) => request("/tags", { method: "POST", body: JSON.stringify({ name, wiki_url }) }),
  reviewTag: (id: number, status: string) => request(`/tags/${id}/review`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteTag: (id: number) => request(`/tags/${id}`, { method: "DELETE" }),

  // Payment
  createPayment: (order_id: number) => request("/payment/create", { method: "POST", body: JSON.stringify({ order_id }) }),

  // Users
  getUsers: () => request("/users"),
  updateUserRole: (id: number, role: string) => request(`/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  deleteUser: (id: number) => request(`/users/${id}`, { method: "DELETE" }),
  createUser: (data: any) => request("/users", { method: "POST", body: JSON.stringify(data) }),
  getStats: () => request("/users/stats"),

  // Helpers
  setAuth,
  clearAuth,
  getUser,
  getToken,
};
