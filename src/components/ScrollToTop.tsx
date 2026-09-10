import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Al navegar entre rutas el scroll queda donde estaba: entrar a la ficha de un
 * libro desde el medio de la grilla te dejaba a mitad de página. Los enlaces
 * con hash los resuelve la propia página destino.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);

  return null;
}
