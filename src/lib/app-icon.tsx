import { dusk } from "@/lib/theme";

/** Shared icon artwork: Dusk background with a soft amber-ringed circle. */
export function AppIconArt({ size }: { size: number }) {
  const circle = Math.round(size * 0.56);
  const dot = Math.round(size * 0.14);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: dusk.bg,
      }}
    >
      <div
        style={{
          width: circle,
          height: circle,
          borderRadius: "50%",
          background: dusk.fill,
          border: `${Math.max(2, Math.round(size * 0.03))}px solid ${dusk.accent}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: dot, height: dot, borderRadius: "50%", background: dusk.accent }} />
      </div>
    </div>
  );
}
