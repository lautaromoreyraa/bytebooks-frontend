import { useEffect, useId, useRef, type ReactNode } from "react";

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
} as const;

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Encabezado extra bajo el título (tabs, subtítulo). */
  header?: ReactNode;
  size?: keyof typeof SIZES;
  /** En false, el fondo y Escape no cierran (operación en curso). */
  dismissible?: boolean;
  /** El título se lee para lectores de pantalla pero no se dibuja. */
  hideTitle?: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  title,
  onClose,
  children,
  header,
  size = "md",
  dismissible = true,
  hideTitle = false,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  /*
   * `onClose` y `dismissible` se leen de refs para que el efecto de abajo corra
   * una sola vez, al montar.
   *
   * Cuando estaban en las dependencias, cualquier cambio los volvía a armar: la
   * limpieza devolvía el foco al elemento anterior —a esa altura desmontado, o
   * sea al body— y el efecto nuevo no encontraba dónde ponerlo, porque durante
   * una operación en curso los dos botones del diálogo están `disabled` y el
   * selector los excluye. Resultado: mientras se guardaba, el Tab recorría la
   * página de atrás. `ConfirmDialog` cambia `dismissible` en cada confirmación y
   * casi todos los llamadores pasan un `onClose` en línea, que es una función
   * distinta en cada render.
   */
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);

  useEffect(() => {
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
  });

  // Escape para cerrar y Tab confinado al panel: sin esto el foco del teclado
  // se escapa al contenido de atrás mientras el modal tapa la pantalla.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && dismissibleRef.current) {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key !== "Tab" || !panelRef.current) return;

      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null);

      // Mientras hay una operación en curso los botones del diálogo están
      // `disabled` y el selector los excluye: sin esta rama no queda nada
      // adentro a donde ir y el Tab se escapa a la página de atrás, que es lo
      // que el modal tapa. El panel se queda con el foco hasta que termine.
      if (focusables.length === 0) {
        e.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const primero = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (primero ?? panelRef.current)?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-ink-950/80 backdrop-blur-sm"
        onClick={dismissible ? onClose : undefined}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        // Para poder recibir el foco cuando no hay nada focusable adentro. En
        // -1 no entra en el orden de tabulación: sólo se enfoca por código.
        tabIndex={-1}
        className={`relative z-raised max-h-[90dvh] w-full ${SIZES[size]} animate-scale-in
                    overflow-y-auto overscroll-contain rounded-2xl border border-ink-700/70
                    bg-ink-900 shadow-panel ring-1 ring-inset ring-ink-50/[0.04]`}
      >
        <div
          className={
            header || !hideTitle
              ? "sticky top-0 z-raised border-b border-ink-800 bg-ink-900/95 backdrop-blur-sm"
              : ""
          }
        >
          {!hideTitle && (
            <div className="flex items-center justify-between gap-4 px-6 pb-4 pt-5">
              <h2
                id={titleId}
                className="font-display text-lg font-semibold tracking-tight text-ink-50"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="-mr-1.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg
                           text-ink-400 transition-colors duration-200 hover:bg-ink-800 hover:text-ink-100"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          )}
          {header}
        </div>

        {hideTitle && (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        )}

        {children}
      </div>
    </div>
  );
}
