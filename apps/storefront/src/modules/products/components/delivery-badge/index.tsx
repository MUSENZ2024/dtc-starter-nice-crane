export default function DeliveryBadge({ label }: { label: string }) {
  return <span className={`muse-delivery-badge${label === "NZ Stock" ? " muse-delivery-badge-nz" : ""}`}>{label}</span>
}
