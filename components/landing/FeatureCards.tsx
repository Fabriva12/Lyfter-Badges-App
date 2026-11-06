interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  iconClassName: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
  iconClassName,
}: FeatureCardProps) {
  return (
    <article className="rounded-xl border border-[#39424f] bg-[#252c35] p-7">
      <div
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold ${iconClassName}`}
      >
        {icon}
      </div>

      <h2 className="text-lg font-bold">{title}</h2>

      <p className="mt-4 text-sm leading-6 text-[#9da5b1]">{description}</p>
    </article>
  );
}
