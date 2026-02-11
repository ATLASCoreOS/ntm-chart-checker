export default function Footer() {
  return (
    <footer className="text-center py-8 space-y-2">
      <div className="gold-line max-w-xs mx-auto mb-4" />
      <p className="text-xs text-sea-slate font-heading">
        NtM Chart Correction Checker
      </p>
      <p className="text-xs text-sea-slate/70">
        Data sourced from UKHO Maritime Safety Information
      </p>
      <p className="text-xs text-sea-slate/70">
        Crown Copyright applies to all Admiralty NtM content
      </p>
    </footer>
  );
}
