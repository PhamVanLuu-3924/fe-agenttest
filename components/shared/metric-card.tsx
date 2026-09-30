export function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: "warning" | "good" }) {
  return <div className={`metric-card ${tone ? `metric-card--${tone}` : ""}`}><small>{label}</small><strong>{value}</strong><span>{detail}</span></div>;
}
