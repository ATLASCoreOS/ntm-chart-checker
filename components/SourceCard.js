export default function SourceCard({ sourceUrl }) {
  return (
    <div className="card-maritime p-4 text-center">
      <p className="text-xs text-sea-slate">
        Source:{" "}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brass hover:text-brass-light transition-colors"
        >
          {sourceUrl.replace("https://", "")}
        </a>
      </p>
      <p className="text-xs text-sea-slate/70 mt-1">
        Always verify corrections against the original UKHO bulletin.
      </p>
    </div>
  );
}
