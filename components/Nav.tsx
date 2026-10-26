import { CURRENCIES, useCurrency } from "@/lib/currency";
import s from "./ui.module.css";

export default function Nav() {
  const { currency, setCurrency } = useCurrency();
  return (
    <nav className={`nav ${s.wrap} ${s.nav}`}>
      <div className={`nav-brand ${s.brand}`}>
        <span className={s.logo} />
        <span style={{ marginLeft: 8 }}>Wayfarer</span>
      </div>
      <a href="#plan">Plan</a><a href="#itinerary">Itineraries</a><a href="#transport">Transport</a>
      <select aria-label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ marginLeft: "auto", font: "inherit", fontSize: 13, padding: "4px 8px", borderRadius: 8, border: "1px solid var(--color-neutral-400)", background: "transparent", color: "inherit" }}>
        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </nav>
  );
}
