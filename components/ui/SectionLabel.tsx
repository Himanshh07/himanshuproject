export default function SectionLabel({ label }: { label: string }) {
  return (
    <div className="ds-section-label">
      <span />
      <h2>{label}</h2>
      <span />
    </div>
  );
}
