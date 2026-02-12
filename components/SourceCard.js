export default function SourceCard({ sourceUrl }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-2xs text-slate-500">
        Source:{" "}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-navy-700 hover:text-navy-900 underline underline-offset-2 decoration-slate-300 hover:decoration-navy-400 transition-colors"
        >
          {sourceUrl.replace("https://", "")}
        </a>
      </p>
      <p className="text-2xs text-slate-400 mt-1">
        Always verify corrections against the original UKHO bulletin.
      </p>
    </div>
  );
}
