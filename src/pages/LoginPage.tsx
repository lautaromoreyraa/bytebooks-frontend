import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/";
  const { login: saveAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  function validar() {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "Escribí tu email.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Ese email no tiene un formato válido.";
    if (!password) next.password = "Escribí tu contraseña.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validar()) return;

    setLoading(true);
    try {
      const response = await login(email.trim(), password);
      saveAuth(response);
      navigate(returnTo);
    } catch {
      setError("Email o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm py-6 sm:py-12">
      <header className="mb-8">
        <p className="mb-3 text-xs uppercase tracking-[0.22em] text-brass-500">Tu cuenta</p>
        <h1 className="font-display text-3xl font-semibold tracking-tightest text-ink-50">
          Iniciar sesión
        </h1>
        <p className="mt-2.5 text-sm text-ink-400">
          Para guardar favoritos y publicar reseñas.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
            }}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            className={`field ${fieldErrors.email ? "field-invalid" : ""}`}
          />
          {fieldErrors.email && (
            <p id="email-error" className="mt-1.5 text-xs text-ember-400">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="label">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
            }}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
            className={`field ${fieldErrors.password ? "field-invalid" : ""}`}
          />
          {fieldErrors.password && (
            <p id="password-error" className="mt-1.5 text-xs text-ember-400">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-ember-500/25 bg-ember-500/10 px-3.5 py-2.5 text-sm text-ember-400"
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-400">
        ¿No tenés cuenta?{" "}
        <Link
          to="/register"
          className="rounded text-brass-400 underline decoration-brass-500/40 underline-offset-4 transition-colors duration-200 hover:text-brass-300 hover:decoration-brass-400"
        >
          Creá una
        </Link>
      </p>
    </div>
  );
}
