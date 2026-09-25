import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import { api } from "./api";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import MyOrders from "./pages/MyOrders";
import DashboardPage from "./pages/DashboardPage";
import ManageComics from "./pages/ManageComics";
import PendingComics from "./pages/PendingComics";
import ManageUsers from "./pages/ManageUsers";
import PublisherComics from "./pages/PublisherComics";
import ComicForm from "./pages/ComicForm";

type User = {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  is_verified: boolean;
  google_id?: string;
};

type AuthContextType = {
  user: User | null;
  setUser: (u: User | null) => void;
  cartCount: number;
  refreshCart: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  cartCount: 0,
  refreshCart: () => {},
  login: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<User | null>(api.getUser());
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = async () => {
    if (user) {
      try {
        const data = await api.getCartCount();
        setCartCount(data.count);
      } catch {
        setCartCount(0);
      }
    } else {
      setCartCount(0);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [user]);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    api.setAuth(data.token, data.user);
    setUser(data.user);
  };

  const logout = () => {
    api.clearAuth();
    setUser(null);
    setCartCount(0);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, cartCount, refreshCart, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failed" element={<PaymentFailed />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/manage/comics" element={<ManageComics />} />
            <Route path="/manage/pending" element={<PendingComics />} />
            <Route path="/manage/users" element={<ManageUsers />} />
            <Route path="/publisher/comics" element={<PublisherComics />} />
            <Route path="/publisher/comics/new" element={<ComicForm />} />
            <Route path="/publisher/comics/:id/edit" element={<ComicForm />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
