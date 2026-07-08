interface Props {
  value: number;
  max?: number;
}

export default function StarRating({ value, max = 5 }: Props) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? "text-violet-400" : "text-zinc-600"}>
          ★
        </span>
      ))}
    </span>
  );
}
