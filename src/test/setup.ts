import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * Cada test arranca con el DOM limpio y sin nada guardado del anterior.
 *
 * El localStorage importa más de lo que parece: `AuthContext` lee la sesión de
 * ahí al montar, así que un test que inicia sesión dejaría autenticado al que
 * corra después.
 */
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

/**
 * jsdom no calcula layout, asi que `offsetParent` es siempre null y cualquier
 * codigo que filtre por "visible" —la trampa de foco del modal, por ejemplo— ve
 * cero elementos y no hace nada. Se define para que lo montado cuente como
 * visible y esos caminos se puedan probar.
 */
Object.defineProperty(HTMLElement.prototype, "offsetParent", {
  configurable: true,
  get(this: HTMLElement) {
    return this.parentElement;
  },
});
