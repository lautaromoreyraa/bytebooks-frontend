import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";

describe("Modal", () => {
  it("Escape cierra", async () => {
    const cerrar = vi.fn();
    render(
      <Modal title="Agregar libro" onClose={cerrar}>
        <button>Un boton</button>
      </Modal>
    );

    await userEvent.keyboard("{Escape}");

    expect(cerrar).toHaveBeenCalledOnce();
  });

  it("con una operacion en curso, Escape no cierra", async () => {
    const cerrar = vi.fn();
    render(
      <Modal title="Eliminando" onClose={cerrar} dismissible={false}>
        <button>Un boton</button>
      </Modal>
    );

    await userEvent.keyboard("{Escape}");

    expect(cerrar).not.toHaveBeenCalled();
  });

  it("el foco arranca adentro del panel", () => {
    render(
      <Modal title="Agregar libro" onClose={vi.fn()}>
        <button>Un boton</button>
      </Modal>
    );

    expect(document.activeElement).not.toBe(document.body);
    expect(screen.getByRole("dialog")).toContainElement(
      document.activeElement as HTMLElement
    );
  });

  it("el Tab no se escapa del panel", async () => {
    render(
      <Modal title="Agregar libro" onClose={vi.fn()}>
        <button>Primero</button>
        <button>Ultimo</button>
      </Modal>
    );

    const dialogo = screen.getByRole("dialog");
    for (let i = 0; i < 6; i++) {
      await userEvent.tab();
      expect(dialogo).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("el foco sigue adentro mientras la operacion esta en curso", async () => {
    function Contenedor() {
      const [pendiente, setPendiente] = useState(false);
      return (
        <>
          <button>Boton de la pagina de atras</button>
          <ConfirmDialog
            title="Eliminar libro"
            description="No se puede deshacer."
            confirmLabel="Sí, eliminar"
            pendingLabel="Eliminando…"
            pending={pendiente}
            onConfirm={() => setPendiente(true)}
            onCancel={vi.fn()}
          />
        </>
      );
    }

    render(<Contenedor />);

    await userEvent.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    expect(screen.getByRole("button", { name: "Eliminando…" })).toBeDisabled();

    await userEvent.tab();

    const dialogo = screen.getByRole("dialog");
    const enFoco = document.activeElement as HTMLElement;
    expect(
      dialogo.contains(enFoco) || enFoco === document.body,
      "el foco no puede caer en la pagina de atras"
    ).toBe(true);
    expect(screen.getByRole("button", { name: "Boton de la pagina de atras" }))
      .not.toBe(enFoco);
  });

  it("al cerrar devuelve el foco a donde estaba", async () => {
    function Contenedor() {
      const [abierto, setAbierto] = useState(false);
      return (
        <>
          <button onClick={() => setAbierto(true)}>Abrir</button>
          {abierto && (
            <Modal title="Agregar libro" onClose={() => setAbierto(false)}>
              <button>Un boton</button>
            </Modal>
          )}
        </>
      );
    }

    render(<Contenedor />);
    const abrir = screen.getByRole("button", { name: "Abrir" });

    await userEvent.click(abrir);
    await userEvent.keyboard("{Escape}");

    expect(document.activeElement).toBe(abrir);
  });
});
