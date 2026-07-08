import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }: { children: ReactNode }) {
  const { sessionExpired, dismissSessionExpired } = useAuth();
  const navigate = useNavigate();

  function handleGoToLogin() {
    dismissSessionExpired();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-zinc-800 py-4 text-center text-zinc-500 text-sm">
        ByteBooks
      </footer>

      {sessionExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative z-10 bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-zinc-100 font-semibold mb-2">Sesión expirada</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Tu sesión ha expirado. Iniciá sesión nuevamente para continuar.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleGoToLogin}
                className="w-full py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
              >
                Iniciar sesión
              </button>
              <button
                onClick={dismissSessionExpired}
                className="w-full py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Continuar sin sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
