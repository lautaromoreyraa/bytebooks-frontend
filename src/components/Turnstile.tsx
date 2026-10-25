import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { CLAVE_DEL_SITIO } from "../lib/turnstile";

/**
 * Desafío de Cloudflare Turnstile para el registro.
 *
 * El widget entrega un token que la API verifica contra Cloudflare. Sin clave
 * de sitio configurada no se muestra nada, y la API decide.
 */
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface ApiTurnstile {
  render(contenedor: HTMLElement, opciones: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: ApiTurnstile;
  }
}

let cargando: Promise<ApiTurnstile> | null = null;

function cargarScript(): Promise<ApiTurnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (cargando) return cargando;

  cargando = new Promise<ApiTurnstile>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile no cargó"));
    script.onerror = () => {
      // Sin esto, un bloqueador que corta el script dejaría la promesa
      // rechazada para siempre y no habría forma de reintentar.
      cargando = null;
      reject(new Error("No se pudo cargar Turnstile"));
    };
    document.head.appendChild(script);
  });
  return cargando;
}

export interface TurnstileHandle {
  /** El token es de un solo uso: después de un envío fallido hace falta otro. */
  reiniciar(): void;
}

interface Props {
  /** Recibe el token cuando se resuelve el desafío, y null cuando vence o falla. */
  onToken: (token: string | null) => void;
}

const Turnstile = forwardRef<TurnstileHandle, Props>(function Turnstile({ onToken }, ref) {
  const contenedor = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  // En un ref para que un onToken nuevo en cada render no vuelva a montar el widget.
  const avisar = useRef(onToken);
  useEffect(() => {
    avisar.current = onToken;
  }, [onToken]);

  useImperativeHandle(ref, () => ({
    reiniciar() {
      if (widgetId.current && window.turnstile) {
        avisar.current(null);
        window.turnstile.reset(widgetId.current);
      }
    },
  }));

  useEffect(() => {
    if (!CLAVE_DEL_SITIO) return;
    let desmontado = false;

    cargarScript()
      .then((turnstile) => {
        if (desmontado || !contenedor.current) return;
        widgetId.current = turnstile.render(contenedor.current, {
          sitekey: CLAVE_DEL_SITIO,
          theme: "dark",
          size: "flexible",
          callback: (token: string) => avisar.current(token),
          "expired-callback": () => avisar.current(null),
          "error-callback": () => avisar.current(null),
        });
      })
      .catch(() => avisar.current(null));

    return () => {
      desmontado = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, []);

  if (!CLAVE_DEL_SITIO) return null;
  return <div ref={contenedor} className="min-h-[65px]" />;
});

export default Turnstile;
