export default function SourceCard({ sourceUrl }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm text-center">
      <p className="text-xs text-slate-500">
        Source:{" "}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {sourceUrl.replace("https://", "")}
        </a>
      </p>
      <p className="text-xs text-slate-400 mt-1">
        Always verify corrections against the original UKHO bulletin.
      </p>
    </div>
  );
}
