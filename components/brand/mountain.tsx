import { cn } from "@/lib/utils";

export function MountainScene({
  dark = false,
  caption,
  className,
}: {
  dark?: boolean;
  /** Pass `null` to hide the caption. */
  caption?: string | null;
  className?: string;
}) {
  const text =
    caption === undefined
      ? dark
        ? "Progress takes a little time, but it's always worth it."
        : "A clearer you, a brighter tomorrow."
      : caption;
  return (
    <div
      className={cn(
        "relative h-full overflow-hidden",
        dark ? "min-h-[280px] bg-night" : "min-h-[320px] rounded-panel bg-sand",
        className,
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          background: dark
            ? "linear-gradient(180deg, oklch(0.34 0.04 220) 0%, var(--forest) 42%, var(--night) 100%)"
            : "linear-gradient(180deg, oklch(0.9 0.06 75) 0%, oklch(0.85 0.07 78) 38%, oklch(0.76 0.055 80) 100%)",
        }}
      />
      <div
        className="absolute top-8 right-10 size-16 rounded-full opacity-80"
        style={{ background: dark ? "var(--sand-soft)" : "oklch(0.97 0.03 85)", boxShadow: "0 0 40px oklch(0.9 0.08 80 / 0.45)" }}
      />
      <svg viewBox="0 0 640 420" className="absolute inset-x-0 bottom-0 h-[78%] w-full" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <path d="M0 280 L120 170 L210 250 L320 120 L460 240 L560 150 L640 230 L640 420 L0 420 Z" fill={dark ? "oklch(0.32 0.04 160)" : "oklch(0.6 0.045 150)"} opacity="0.9" />
        <path d="M0 320 L90 230 L180 300 L280 190 L390 300 L500 210 L640 300 L640 420 L0 420 Z" fill={dark ? "var(--night)" : "oklch(0.37 0.04 158)"} />
        <path d="M300 250 L318 214 L328 236 L340 198 L352 250 Z" fill={dark ? "oklch(0.17 0.02 160)" : "var(--forest)"} />
        <circle cx="334" cy="188" r="7" fill={dark ? "var(--sand)" : "var(--forest)"} />
      </svg>
      {text ? (
        <p
          className={cn(
            "absolute bottom-5 left-5 max-w-[16rem] rounded-xl px-3 py-2 font-serif text-lg leading-snug",
            dark ? "bg-night/70 text-sand-soft backdrop-blur-sm" : "bg-forest/80 text-sand-soft backdrop-blur-sm",
          )}
        >
          {text}
        </p>
      ) : null}
    </div>
  );
}
