import type { ContentType } from "../utils/jsonUtils";
import { highlightJson } from "../utils/jsonUtils";

interface ContentModalProps {
  content: unknown;
  type: ContentType;
  onClose: () => void;
}

export function ContentModal({ content, type, onClose }: ContentModalProps) {
  const getTitle = () => {
    switch (type) {
      case "json": return "JSON Preview";
      case "csv": return "CSV Preview";
      case "text": return "Text Preview";
    }
  };

  const getCopyText = (): string => {
    if (type === "json") {
      return JSON.stringify(content, null, 2);
    }
    if (type === "csv" && Array.isArray(content)) {
      return (content as string[][]).map(row => row.join("\t")).join("\n");
    }
    return String(content);
  };

  const renderContent = () => {
    if (type === "json") {
      return (
        <pre className="text-sm font-mono whitespace-pre-wrap break-words">
          {highlightJson(content)}
        </pre>
      );
    }

    if (type === "csv" && Array.isArray(content)) {
      const rows = content as string[][];
      const hasHeader = rows.length > 0;
      
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            {hasHeader && (
              <thead className="bg-gray-100">
                <tr>
                  {rows[0].map((cell, idx) => (
                    <th key={idx} className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-gray-100">
              {rows.slice(1).map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-3 py-2 text-gray-600 whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-2">
            {rows.length - 1} Zeilen, {rows[0]?.length || 0} Spalten
          </p>
        </div>
      );
    }

    // Plain Text
    return (
      <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-700">
        {String(content)}
      </pre>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">{getTitle()}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="overflow-auto p-4 flex-1 bg-gray-50">
          {renderContent()}
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(getCopyText())}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Kopieren
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
