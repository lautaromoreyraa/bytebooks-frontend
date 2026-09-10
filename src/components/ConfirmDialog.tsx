import Modal from "./Modal";

interface Props {
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
  tone?: "danger" | "neutral";
}

export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  pendingLabel,
  onConfirm,
  onCancel,
  pending = false,
  tone = "danger",
}: Props) {
  return (
    <Modal title={title} onClose={onCancel} size="sm" dismissible={!pending} hideTitle>
      <div className="p-6">
        <h3 className="mb-2 font-display text-lg font-semibold tracking-tight text-ink-50">
          {title}
        </h3>
        <p className="mb-6 text-sm leading-relaxed text-ink-300">{description}</p>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={pending} className="btn-ghost">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={tone === "danger" ? "btn-danger px-5" : "btn-primary px-5"}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
