import type { CartItem } from "./cart";

const API_URL = `${import.meta.env.VITE_API_URL || ""}/api`;

function getToken() {
  return localStorage.getItem("token");
}

function setAuth(token: string, user: any) {
  localStorage.setItem("token", token);
  saveUser(user);
}

function saveUser(user: any) {
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

async function request(path: string, method = "GET", body?: object) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Lỗi server");
  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) => request("/auth/login", "POST", { email, password }),
  register: (email: string, name: string, password: string) => request("/auth/register", "POST", { email, name, password }),
  googleLogin: (credential: string) => request("/auth/google", "POST", { credential }),
  me: () => request("/auth/me"),
  updateProfile: (data: { name: string; phone?: string; address?: string; avatar?: string }) =>
    request("/auth/profile", "PATCH", data),
  verifyEmail: (code: string) => request("/auth/verify-email", "POST", { code }),
  forgotPassword: (email: string) => request("/auth/forgot-password", "POST", { email }),
  resetPassword: (email: string, code: string, newPassword: string) => request("/auth/reset-password", "POST", { email, code, newPassword }),
  changePassword: (currentPassword: string, newPassword: string) => request("/auth/change-password", "POST", { currentPassword, newPassword }),
  resendOtp: (type: string) => request("/auth/resend-otp", "POST", { type }),

  // Comics
  getComics: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return request(`/comics${query}`);
  },
  getComic: (id: number) => request(`/comics/${id}`),
  createComic: (data: any) => request("/comics", "POST", data),
  updateComic: (id: number, data: any) => request(`/comics/${id}`, "PUT", data),
  deleteComic: (id: number) => request(`/comics/${id}`, "DELETE"),
  getPendingComics: () => request("/comics/manage/pending"),
  getMyComics: () => request("/comics/manage/my-comics"),
  reviewComic: (id: number, status: string, reject_reason?: string) => request(`/comics/${id}/review`, "PATCH", { status, reject_reason }),
  updateStock: (id: number, stock: number) => request(`/comics/${id}/stock`, "PATCH", { stock }),

  // Cart
  getCart: (): Promise<CartItem[]> => request("/cart"),
  addToCart: (comic_id: number, quantity?: number) => request("/cart", "POST", { comic_id, quantity: quantity || 1 }),
  updateCartItem: (id: number, quantity: number) => request(`/cart/${id}`, "PUT", { quantity }),
  removeFromCart: (id: number) => request(`/cart/${id}`, "DELETE"),
  getCartCount: () => request("/cart/count"),

  // Orders
  createOrder: (data: any) => request("/orders", "POST", data),
  getMyOrders: () => request("/orders/my-orders"),
  getAllOrders: () => request("/orders/all"),
  updateOrderStatus: (id: number, status: string) => request(`/orders/${id}/status`, "PATCH", { status }),
  customerOrderAction: (id: number, action: string, return_reason?: string) =>
    request(`/orders/${id}/customer-action`, "PATCH", { action, return_reason }),

  // Character Tags
  getTags: (all?: boolean) => request(`/tags${all ? "?all=true" : ""}`),
  createTag: (name: string, wiki_url?: string) => request("/tags", "POST", { name, wiki_url }),
  reviewTag: (id: number, status: string) => request(`/tags/${id}/review`, "PATCH", { status }),
  deleteTag: (id: number) => request(`/tags/${id}`, "DELETE"),

  // Payment
  createPayment: (order_id: number) => request("/payment/create", "POST", { order_id }),

  // Users
  getUsers: () => request("/users"),
  updateUser: (id: number, data: any) => request(`/users/${id}`, "PUT", data),
  deleteUser: (id: number) => request(`/users/${id}`, "DELETE"),
  createUser: (data: any) => request("/users", "POST", data),
  getStats: () => request("/users/stats"),

  // Helpers
  setAuth,
  saveUser,
  clearAuth,
  getUser,
};
