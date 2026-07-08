import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/";
  const { login: saveAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await login(email, password);
      saveAuth(response);
      navigate(returnTo);
    } catch {
      setError("Email o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-12">
      <h1 className="text-xl font-semibold text-zinc-100 mb-6">Iniciar sesión</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm py-2 rounded transition-colors"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="text-zinc-500 text-sm mt-4">
        ¿No tenés cuenta?{" "}
        <Link to="/register" className="text-violet-500 hover:text-violet-400">
          Registrate
        </Link>
      </p>
    </div>
  );
}
