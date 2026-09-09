interface Props {
  value: number;
  max?: number;
  size?: "sm" | "md";
}

const STAR_PATH =
  "M8 1.6l1.94 3.93 4.34.63-3.14 3.06.74 4.32L8 11.5l-3.88 2.04.74-4.32L1.72 6.16l4.34-.63z";

export default function StarRating({ value, max = 5, size = "sm" }: Props) {
  const dimension = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`${value} de ${max} estrellas`}
    >
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 16 16"
          className={`${dimension} ${i < value ? "text-brass-400" : "text-ink-700"}`}
          aria-hidden="true"
        >
          <path d={STAR_PATH} fill="currentColor" />
        </svg>
      ))}
    </span>
  );
}
