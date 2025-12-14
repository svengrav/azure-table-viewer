interface TableSelectorProps {
  tables: string[];
  onSelectTable: (tableName: string) => void;
  onDisconnect: () => void;
  isLoading: boolean;
}

export function TableSelector({ tables, onSelectTable, onDisconnect, isLoading }: TableSelectorProps) {
  return (
    <div className="w-full max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800">Tabelle auswählen</h2>
        <button onClick={onDisconnect} className="text-sm text-gray-600 hover:text-gray-800 underline">
          Trennen
        </button>
      </div>
      
      {tables.length === 0 ? (
        <p className="text-gray-500 text-center py-4">Keine Tabellen gefunden.</p>
      ) : (
        <div className="space-y-2">
          {tables.map((table) => (
            <button
              key={table}
              onClick={() => onSelectTable(table)}
              disabled={isLoading}
              className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group"
            >
              <span className="font-medium text-gray-700 group-hover:text-blue-600">{table}</span>
              <span className="text-gray-400 group-hover:text-blue-500">→</span>
            </button>
          ))}
        </div>
      )}
      
      <p className="text-sm text-gray-500 mt-4 text-center">
        {tables.length} Tabelle{tables.length !== 1 ? "n" : ""} gefunden
      </p>
    </div>
  );
}
