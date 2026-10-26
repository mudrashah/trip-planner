import { useCurrency } from "@/lib/currency";
import s from "./ui.module.css";

interface Props { route: string; meta: string; itinName: string; actTotal: number; transName: string; transTotal: number; travelers: number; perPerson: number; booked: boolean; onBook: () => void }

const Row = ({ label, name, amount }: { label: string; name: string; amount: string }) => (
  <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
    <div style={{ minWidth: 0 }}><div className={s.label}>{label}</div><div style={{ fontWeight: 600 }}>{name}</div></div>
    <div style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{amount}</div>
  </div>
);

export default function TripSummary(p: Props) {
  const { money: $, converted, currency, updated } = useCurrency();
  return (
    <aside className={s.aside}>
      <div className={`card elev-lg ${s.summary}`}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span className={s.step} style={{ background: "var(--color-accent-300)", color: "var(--color-text)" }}>3</span>
          <h3 style={{ margin: 0, fontSize: 24, color: "var(--color-bg)" }}>Your trip</h3>
        </div>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, lineHeight: 1.2 }}>{p.route}</div>
        <div style={{ fontSize: 13, color: "var(--color-neutral-400)", marginBottom: 20 }}>{p.meta}</div>
        <div className={s.rule} style={{ display: "flex", flexDirection: "column", gap: 14, padding: "18px 0" }}>
          <Row label="Itinerary" name={p.itinName} amount={$(p.actTotal)} />
          <Row label="Transport" name={p.transName} amount={$(p.transTotal)} />
        </div>
        <div className={s.rule} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingTop: 18 }}>
          <span style={{ fontSize: 14, color: "var(--color-neutral-300)" }}>Total · {p.travelers} {p.travelers > 1 ? "travelers" : "traveler"}</span>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 40, color: "var(--color-accent-300)" }}>{$(p.actTotal + p.transTotal)}</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--color-neutral-400)", textAlign: "right", marginBottom: 18 }}>{$(p.perPerson)} per person</div>
        {converted && <div style={{ fontSize: 11, color: "var(--color-neutral-400)", textAlign: "right", marginTop: -12, marginBottom: 18 }}>Approx. in {currency}{updated ? ` · rates ${updated.slice(5, 16)}` : ""}</div>}
        <button type="button" className="btn btn-primary" onClick={p.onBook} style={{ width: "100%", fontSize: 16, padding: 14 }}>
          {p.booked ? "Saved — we'll hold these prices" : "Book this trip"}
        </button>
      </div>
      <p style={{ fontSize: 12, color: "var(--color-neutral-700)", padding: "0 12px" }}>Prices are estimates for activities and every travel leg, there and back. Stays aren&apos;t included.</p>
    </aside>
  );
}
