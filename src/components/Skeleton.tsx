/**
 * Placeholders con la forma real del contenido que va a llegar. Reemplazan al
 * spinner genérico: la página no cambia de alto cuando terminan de cargar.
 */

export function BookGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 xl:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 45}ms` }}>
          <div className="skeleton aspect-[2/3] w-full rounded-lg" />
          <div className="skeleton mt-3 h-3 w-1/3 rounded-full" />
          <div className="skeleton mt-2.5 h-3.5 w-5/6 rounded-full" />
          <div className="skeleton mt-2 h-3 w-2/3 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function BookDetailSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(240px,300px)_1fr]" aria-hidden="true">
      <div className="skeleton aspect-[2/3] w-full max-w-xs rounded-xl" />
      <div className="space-y-4 pt-2">
        <div className="skeleton h-3 w-32 rounded-full" />
        <div className="skeleton h-9 w-4/5 rounded-lg" />
        <div className="skeleton h-5 w-1/3 rounded-full" />
        <div className="flex gap-2 pt-2">
          <div className="skeleton h-8 w-28 rounded-full" />
          <div className="skeleton h-8 w-24 rounded-full" />
          <div className="skeleton h-8 w-36 rounded-full" />
        </div>
        <div className="skeleton h-28 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex items-center gap-4">
        <div className="skeleton h-16 w-16 rounded-2xl" />
        <div className="space-y-2.5">
          <div className="skeleton h-6 w-48 rounded-lg" />
          <div className="skeleton h-3 w-32 rounded-full" />
        </div>
      </div>
      <div className="skeleton mt-6 h-4 w-full max-w-lg rounded-full" />
    </div>
  );
}
