export function MountainScene({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={
        dark
          ? "relative h-full min-h-[280px] overflow-hidden bg-[#10241c]"
          : "relative h-full min-h-[320px] overflow-hidden rounded-[2rem] bg-[#d7c4a4]"
      }
    >
      <div
        className="absolute inset-0"
        style={{
          background: dark
            ? "linear-gradient(180deg, #1a3a4a 0%, #163028 42%, #0d1c16 100%)"
            : "linear-gradient(180deg, #f3d7b0 0%, #e7c89a 38%, #c9b08a 100%)",
        }}
      />
      <div
        className="absolute top-8 right-10 size-16 rounded-full opacity-80"
        style={{ background: dark ? "#f0d7a2" : "#fff4dd", boxShadow: "0 0 40px rgba(255,220,160,0.45)" }}
      />
      <svg viewBox="0 0 640 420" className="absolute inset-x-0 bottom-0 h-[78%] w-full" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <path d="M0 280 L120 170 L210 250 L320 120 L460 240 L560 150 L640 230 L640 420 L0 420 Z" fill={dark ? "#1c3b30" : "#6e8b74"} opacity="0.9" />
        <path d="M0 320 L90 230 L180 300 L280 190 L390 300 L500 210 L640 300 L640 420 L0 420 Z" fill={dark ? "#14281f" : "#2f4a3d"} />
        <path d="M300 250 L318 214 L328 236 L340 198 L352 250 Z" fill={dark ? "#0c1813" : "#1b2e26"} />
        <circle cx="334" cy="188" r="7" fill={dark ? "#d7c4a4" : "#1b2e26"} />
      </svg>
      <p className={`absolute bottom-6 left-6 max-w-[14rem] font-serif text-lg italic leading-snug ${dark ? "text-[#f3eadc]" : "text-[#1d3329]"}`}>
        {dark ? "Progress takes a little time, but it's always worth it." : "A clearer you, a brighter tomorrow."}
      </p>
    </div>
  );
}
