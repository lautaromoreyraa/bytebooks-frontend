import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import { useAuth } from "../context/AuthContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const REGLAS_PASSWORD = [
  { id: "largo", label: "8 caracteres o más", test: (v: string) => v.length >= 8 },
  { id: "mayus", label: "Una mayúscula", test: (v: string) => /[A-ZÁÉÍÓÚÑ]/.test(v) },
  { id: "minus", label: "Una minúscula", test: (v: string) => /[a-záéíóúñ]/.test(v) },
  { id: "num", label: "Un número", test: (v: string) => /\d/.test(v) },
] as const;

type Campo = "nombre" | "apellido" | "email" | "password";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login: saveAuth } = useAuth();

  const [form, setForm] = useState({ nombre: "", apellido: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Campo, string>>>({});
  const [passwordTocada, setPasswordTocada] = useState(false);

  const reglasCumplidas = useMemo(
    () => REGLAS_PASSWORD.map((r) => ({ ...r, ok: r.test(form.password) })),
    [form.password]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.name as Campo;
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validar() {
    const next: Partial<Record<Campo, string>> = {};
    if (!form.nombre.trim()) next.nombre = "Falta tu nombre.";
    if (!form.apellido.trim()) next.apellido = "Falta tu apellido.";
    if (!form.email.trim()) next.email = "Escribí tu email.";
    else if (!EMAIL_RE.test(form.email.trim())) next.email = "Ese email no tiene un formato válido.";
    if (reglasCumplidas.some((r) => !r.ok)) {
      next.password = "La contraseña no cumple todos los requisitos.";
      setPasswordTocada(true);
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validar()) return;

    setLoading(true);
    try {
      const response = await register({
        ...form,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
      });
      saveAuth(response);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  function fieldProps(name: Campo) {
    return {
      name,
      value: form[name],
      onChange: handleChange,
      "aria-invalid": Boolean(fieldErrors[name]),
      "aria-describedby": fieldErrors[name] ? `${name}-error` : undefined,
      className: `field ${fieldErrors[name] ? "field-invalid" : ""}`,
    };
  }

  function renderError(name: Campo) {
    if (!fieldErrors[name]) return null;
    return (
      <p id={`${name}-error`} className="mt-1.5 text-xs text-ember-400">
        {fieldErrors[name]}
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm py-6 sm:py-12">
      <header className="mb-8">
        <p className="mb-3 text-xs uppercase tracking-[0.22em] text-brass-500">Tu cuenta</p>
        <h1 className="font-display text-3xl font-semibold tracking-tightest text-ink-50">
          Crear cuenta
        </h1>
        <p className="mt-2.5 text-sm text-ink-400">Tarda menos de un minuto.</p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="nombre" className="label">
              Nombre
            </label>
            <input id="nombre" autoComplete="given-name" maxLength={50} {...fieldProps("nombre")} />
            {renderError("nombre")}
          </div>
          <div>
            <label htmlFor="apellido" className="label">
              Apellido
            </label>
            <input
              id="apellido"
              autoComplete="family-name"
              maxLength={50}
              {...fieldProps("apellido")}
            />
            {renderError("apellido")}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            maxLength={150}
            {...fieldProps("email")}
          />
          {renderError("email")}
        </div>

        <div>
          <label htmlFor="password" className="label">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            maxLength={100}
            onBlur={() => setPasswordTocada(true)}
            {...fieldProps("password")}
          />

          {/* Los requisitos se marcan a medida que se escriben, en lugar de
              aparecer como un reproche recién al enviar el formulario. */}
          <ul className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {reglasCumplidas.map((regla) => {
              const falla = passwordTocada && !regla.ok;
              return (
                <li
                  key={regla.id}
                  className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                    regla.ok ? "text-sage-400" : falla ? "text-ember-400" : "text-ink-500"
                  }`}
                >
                  <svg viewBox="0 0 12 12" className="h-3 w-3 flex-shrink-0" aria-hidden="true">
                    {regla.ok ? (
                      <path
                        d="M2.5 6.2l2.3 2.3 4.7-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : (
                      <circle cx="6" cy="6" r="1.6" fill="currentColor" />
                    )}
                  </svg>
                  {regla.label}
                </li>
              );
            })}
          </ul>
          {renderError("password")}
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
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-400">
        ¿Ya tenés cuenta?{" "}
        <Link
          to="/login"
          className="rounded text-brass-400 underline decoration-brass-500/40 underline-offset-4 transition-colors duration-200 hover:text-brass-300 hover:decoration-brass-400"
        >
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
