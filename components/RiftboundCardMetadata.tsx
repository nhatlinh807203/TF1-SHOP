interface RiftboundMetadata {
  collectorNumber: string;
  setSlug: string;
  rarity: string;
  faction: string;
}

interface RiftboundCardMetadataProps {
  stock: number;
  riftbound?: RiftboundMetadata;
  compact?: boolean;
}

const runeColors: Record<string, string> = {
  body: "#22c55e",
  calm: "#facc15",
  chaos: "#a855f7",
  fury: "#ef4444",
  mind: "#3b82f6",
  order: "#e5e7eb",
};

export default function RiftboundCardMetadata({
  stock,
  riftbound,
  compact = false,
}: RiftboundCardMetadataProps) {
  const runes = riftbound?.faction
    .split(",")
    .map((rune) => rune.trim())
    .filter(Boolean) ?? [];
  const badgeClass = compact
    ? "px-1.5 py-1 text-[9px]"
    : "px-2 py-1.5 text-xs";

  return (
    <div className={`mt-2 flex flex-wrap gap-1.5 ${compact ? "" : "sm:gap-2"}`}>
      {riftbound && (
        <>
          <span
            className={`rounded-md border border-white/[0.08] bg-white/[0.03] text-zinc-300 ${badgeClass}`}
          >
            Số thẻ: {riftbound.collectorNumber} · {riftbound.setSlug}
          </span>
          <span
            className={`rounded-md border border-white/[0.08] bg-white/[0.03] text-zinc-300 ${badgeClass}`}
          >
            Độ hiếm: {riftbound.rarity}
          </span>
          {runes.map((rune) => (
            <span
              key={rune}
              className={`inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] text-zinc-300 ${badgeClass}`}
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    runeColors[rune.toLocaleLowerCase("en")] ?? "#a1a1aa",
                }}
              />
              Rune: {rune}
            </span>
          ))}
        </>
      )}
      <span
        className={`rounded-md border border-white/[0.08] bg-white/[0.03] text-zinc-300 ${badgeClass}`}
      >
        Tồn kho: {stock} lá
      </span>
    </div>
  );
}
