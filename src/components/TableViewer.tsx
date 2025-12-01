export interface TableEntity {
  partitionKey: string;
  rowKey: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface TableViewerProps {
  entities: TableEntity[];
  tableName: string;
  onDisconnect: () => void;
}

export function TableViewer({ entities, tableName, onDisconnect }: TableViewerProps) {
  if (entities.length === 0) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Tabelle: <span className="text-blue-600">{tableName}</span>
          </h2>
          <button
            onClick={onDisconnect}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Trennen
          </button>
        </div>
        <p className="text-gray-500 text-center py-8">Keine Einträge gefunden.</p>
      </div>
    );
  }

  // Alle einzigartigen Spalten aus allen Entities extrahieren
  const columns = Array.from(
    new Set(entities.flatMap((entity) => Object.keys(entity)))
  );

  // Wichtige Spalten zuerst
  const priorityColumns = ["partitionKey", "rowKey", "timestamp"];
  const sortedColumns = [
    ...priorityColumns.filter((col) => columns.includes(col)),
    ...columns.filter((col) => !priorityColumns.includes(col)).sort(),
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Tabelle: <span className="text-blue-600">{tableName}</span>
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({entities.length} Einträge)
          </span>
        </h2>
        <button
          onClick={onDisconnect}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Trennen
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {sortedColumns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entities.map((entity, idx) => (
              <tr key={`${entity.partitionKey}-${entity.rowKey}-${idx}`} className="hover:bg-gray-50">
                {sortedColumns.map((column) => (
                  <td
                    key={column}
                    className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap max-w-xs truncate"
                    title={formatValue(entity[column])}
                  >
                    {formatValue(entity[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}
