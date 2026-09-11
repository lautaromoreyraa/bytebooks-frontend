import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import RutaConSesion from "../../components/RutaConSesion";
import { renderConRutas, iniciarSesion } from "../fixture/render";

const RUTAS = (
  <Routes>
    <Route
      path="/favoritos"
      element={
        <RutaConSesion>
          <p>Mis favoritos</p>
        </RutaConSesion>
      }
    />
    <Route path="/login" element={<p>Formulario de ingreso</p>} />
  </Routes>
);

describe("RutaConSesion", () => {
  it("sin sesion manda al login y se acuerda de adonde iba", () => {
    // Sin el guard, la peticion salia igual, la API respondia 401 y el cliente
    // mostraba "Tu sesion expiro" a alguien que nunca habia entrado.
    renderConRutas(RUTAS, { ruta: "/favoritos" });

    expect(screen.getByText("Formulario de ingreso")).toBeInTheDocument();
    expect(screen.getByTestId("ubicacion")).toHaveTextContent(
      "/login?returnTo=%2Ffavoritos"
    );
    expect(screen.queryByText("Mis favoritos")).not.toBeInTheDocument();
  });

  it("con sesion deja pasar", () => {
    iniciarSesion();

    renderConRutas(RUTAS, { ruta: "/favoritos" });

    expect(screen.getByText("Mis favoritos")).toBeInTheDocument();
  });
});
