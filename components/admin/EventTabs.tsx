import Link from "next/link";

const TABS = [
  { key: "overview", label: "Overview", path: "" },
  { key: "badges", label: "Badges & QR", path: "/badges" },
  { key: "prize", label: "Prize", path: "/prize" },
  { key: "attendees", label: "Participants", path: "/attendees" },
  { key: "scans", label: "Scans", path: "/scans" },
  { key: "metrics", label: "Metrics", path: "/metrics" },
  { key: "audit", label: "Audit", path: "/audit" },
] as const;

export type EventTabKey = (typeof TABS)[number]["key"];

interface EventTabsProps {
  eventId: string;
  active: EventTabKey;
}

export default function EventTabs({ eventId, active }: EventTabsProps) {
  return (
    <nav
      aria-label="Event sections"
      className="flex flex-wrap gap-2 border-b border-[#303743] pb-3"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;

        return (
          <Link
            key={tab.key}
            href={`/admin/events/${eventId}${tab.path}`}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-[#36bde9]/15 text-[#7fd8f5]"
                : "text-[#9ca3af] hover:bg-[#272d36] hover:text-[#f1f1ed]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
