import FeatureCard from "./FeatureCards";

const features = [
  {
    icon: "↘",
    title: "Escaneá y coleccioná badges",
    description:
      "Apuntá al QR de cada charla o stand y sumá el badge a tu colección al instante.",
    iconClassName: "bg-[#38c6f3] text-[#17313b]",
  },
  {
    icon: "↑",
    title: "Subí de nivel",
    description:
      "Cada badge te da XP. Acumulá experiencia y desbloqueá nuevos niveles durante el evento.",
    iconClassName: "bg-[#d77bdb] text-[#352238]",
  },
  {
    icon: "≡",
    title: "Compará tu posición",
    description:
      "Mirá el leaderboard en vivo y competí con el resto de los asistentes por el podio.",
    iconClassName: "bg-[#f47f8a] text-[#43272b]",
  },
];

export default function Features() {
  return (
    <section id="como-funciona" className="px-10 pb-16">
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}
