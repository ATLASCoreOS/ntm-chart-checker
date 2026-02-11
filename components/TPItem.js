export default function TPItem({ tp }) {
  return (
    <div className="border border-orange-200 rounded-lg overflow-hidden">
      <div className="bg-orange-50 px-4 py-2.5">
        <span className="text-sm font-bold text-orange-800">
          {tp.nmNumber}
        </span>
      </div>
      <div className="px-4 py-3 bg-white space-y-1.5">
        {tp.subject && (
          <p className="text-xs text-gray-700">
            <span className="font-medium text-gray-500 mr-1.5">Subject:</span>
            {tp.subject}
          </p>
        )}
        <p className="text-xs text-gray-700">
          <span className="font-medium text-gray-500 mr-1.5">Charts:</span>
          {tp.charts}
        </p>
      </div>
    </div>
  );
}
