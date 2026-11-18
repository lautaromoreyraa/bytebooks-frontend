import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { borrarSesion } from "../api/sesion";

afterEach(() => {
  cleanup();
  borrarSesion();
  localStorage.clear();
  sessionStorage.clear();
});

Object.defineProperty(HTMLElement.prototype, "offsetParent", {
  configurable: true,
  get(this: HTMLElement) {
    return this.parentElement;
  },
});
