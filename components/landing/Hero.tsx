export default function Hero() {
  return (
    <section className="px-10 py-16 md:py-20">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        {/* Text */}
        <div>
          <span className="inline-flex rounded-full bg-[#ffc875] px-4 py-1.5 text-xs font-bold tracking-wide text-[#332b1d]">
            GAMIFICÁ TU EVENTO
          </span>

          <h1 className="mt-7 max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight md:text-6xl">
            Escaneá, coleccioná
            <br />
            badges
            <br />
            y subí de nivel en cada
            <br />
            charla
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-[#9ca3af]">
            Convertí la asistencia a charlas y stands en una experiencia de
            juego. Ganá XP, competí en el leaderboard y reclamá tu premio.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/events"
              className="rounded-lg bg-[#a8d889] px-7 py-4 text-sm font-bold text-[#263021] transition hover:bg-[#b8e39a]"
            >
              Ver Eventos →
            </a>

            <a
              href="#como-funciona"
              className="rounded-lg border border-[#394351] px-7 py-4 text-sm font-semibold text-gray-200 transition hover:bg-[#272d36]"
            >
              Cómo funciona
            </a>
          </div>
        </div>

        {/* Mockup */}
        <div className="flex justify-center">
          <div className="relative flex aspect-[1.45] w-full max-w-[440px] items-center justify-center overflow-hidden rounded-xl border border-[#303a47] bg-[#242a33]">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 12px, #3a4350 12px, #3a4350 22px)",
              }}
            />

            <span className="relative font-mono text-sm text-gray-500">
              [ mockup app / evento ]
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
