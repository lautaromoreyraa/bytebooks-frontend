import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login: saveAuth } = useAuth();

  const [form, setForm] = useState({ nombre: "", apellido: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await register(form);
      saveAuth(response);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-12">
      <h1 className="text-xl font-semibold text-zinc-100 mb-6">Crear cuenta</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm text-zinc-400 mb-1">Nombre</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              maxLength={50}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-zinc-400 mb-1">Apellido</label>
            <input
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              required
              maxLength={50}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            maxLength={150}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Contraseña</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
            maxLength={100}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />
          <p className="text-xs text-zinc-600 mt-1">
            Mínimo 8 caracteres, una mayúscula, una minúscula y un número.
          </p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm py-2 rounded transition-colors"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="text-zinc-500 text-sm mt-4">
        ¿Ya tenés cuenta?{" "}
        <Link to="/login" className="text-violet-500 hover:text-violet-400">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
