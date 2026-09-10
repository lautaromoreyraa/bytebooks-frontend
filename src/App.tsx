import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import RutaConSesion from "./components/RutaConSesion";
import HomePage from "./pages/HomePage";
import BookDetailPage from "./pages/BookDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FavoritosPage from "./pages/FavoritosPage";
import UserProfilePage from "./pages/UserProfilePage";
import LegalPage from "./pages/LegalPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/libros/:id" element={<BookDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/favoritos"
              element={
                <RutaConSesion>
                  <FavoritosPage />
                </RutaConSesion>
              }
            />
            <Route path="/usuarios/:id" element={<UserProfilePage />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
