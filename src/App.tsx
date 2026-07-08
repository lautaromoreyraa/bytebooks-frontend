import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import BookDetailPage from "./pages/BookDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FavoritosPage from "./pages/FavoritosPage";
import UserProfilePage from "./pages/UserProfilePage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/libros/:id" element={<BookDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/favoritos" element={<FavoritosPage />} />
            <Route path="/usuarios/:id" element={<UserProfilePage />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
