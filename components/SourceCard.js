export default function SourceCard({ sourceUrl }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 text-center">
      <p className="text-xs text-gray-500">
        Source:{" "}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-navy hover:underline"
        >
          {sourceUrl.replace("https://", "")}
        </a>
      </p>
      <p className="text-xs text-gray-400 mt-1">
        Always verify corrections against the original UKHO bulletin.
      </p>
    </div>
  );
}
