import { useState } from "react";
import { TableClient, TableServiceClient } from "@azure/data-tables";

// ============ Types ============
interface TableEntity {
  partitionKey: string;
  rowKey: string;
  timestamp?: string;
  [key: string]: unknown;
}

type AppState =
  | { status: "disconnected" }
  | { status: "loading-tables" }
  | { status: "tables-loaded"; connectionString: string; tables: string[] }
  | { status: "loading-data"; connectionString: string; tables: string[]; selectedTable: string }
  | { status: "connected"; connectionString: string; tables: string[]; tableName: string; entities: TableEntity[] }
  | { status: "error"; message: string; connectionString?: string };

// ============ Service ============
async function fetchTableEntities(
  connectionString: string,
  tableName: string
): Promise<TableEntity[]> {
  const client = TableClient.fromConnectionString(connectionString, tableName);
  
  const entities: TableEntity[] = [];
  const iterator = client.listEntities();
  
  for await (const entity of iterator) {
    const { partitionKey, rowKey, timestamp, ...rest } = entity as Record<string, unknown>;
    entities.push({
      partitionKey: partitionKey as string,
      rowKey: rowKey as string,
      timestamp: timestamp instanceof Date ? timestamp.toISOString() : undefined,
      ...rest,
    });
  }
  
  return entities;
}

async function listTables(connectionString: string): Promise<string[]> {
  const serviceClient = TableServiceClient.fromConnectionString(connectionString);
  const tables: string[] = [];
  for await (const table of serviceClient.listTables()) {
    if (table.name) {
      tables.push(table.name);
    }
  }
  return tables;
}

// ============ Storage Keys ============
const STORAGE_KEY_CONNECTION = "atv_connectionString";

// ============ ConnectionForm ============
function ConnectionForm({ onConnect, isLoading, initialValue }: { onConnect: (connectionString: string) => void; isLoading: boolean; initialValue?: string }) {
  const [connectionString, setConnectionString] = useState(() => 
    initialValue || localStorage.getItem(STORAGE_KEY_CONNECTION) || ""
  );
  const [rememberCredentials, setRememberCredentials] = useState(() => 
    !!localStorage.getItem(STORAGE_KEY_CONNECTION)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (connectionString.trim()) {
      if (rememberCredentials) {
        localStorage.setItem(STORAGE_KEY_CONNECTION, connectionString.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_CONNECTION);
      }
      onConnect(connectionString.trim());
    }
  };

  const handleClearStorage = () => {
    localStorage.removeItem(STORAGE_KEY_CONNECTION);
    setConnectionString("");
    setRememberCredentials(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
      <div>
        <label htmlFor="connectionString" className="block text-sm font-medium text-gray-700 mb-1">
          Connection String
        </label>
        <textarea
          id="connectionString"
          value={connectionString}
          onChange={(e) => setConnectionString(e.target.value)}
          placeholder="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          rows={3}
          required
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberCredentials}
            onChange={(e) => setRememberCredentials(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">Connection String merken</span>
        </label>
        {localStorage.getItem(STORAGE_KEY_CONNECTION) && (
          <button
            type="button"
            onClick={handleClearStorage}
            className="text-sm text-red-600 hover:text-red-800 underline"
          >
            Gespeicherte Daten löschen
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading || !connectionString.trim()}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Lade Tabellen..." : "Verbinden"}
      </button>
    </form>
  );
}

// ============ TableSelector ============
function TableSelector({ 
  tables, 
  onSelectTable, 
  onDisconnect,
  isLoading 
}: { 
  tables: string[]; 
  onSelectTable: (tableName: string) => void; 
  onDisconnect: () => void;
  isLoading: boolean;
}) {
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

// ============ Helpers ============
function tryParseJson(value: unknown): { isJson: boolean; parsed: unknown } {
  if (typeof value !== "string") {
    if (typeof value === "object" && value !== null) {
      return { isJson: true, parsed: value };
    }
    return { isJson: false, parsed: null };
  }
  const trimmed = value.trim();
  if ((!trimmed.startsWith("{") && !trimmed.startsWith("[")) || 
      (!trimmed.endsWith("}") && !trimmed.endsWith("]"))) {
    return { isJson: false, parsed: null };
  }
  try {
    const parsed = JSON.parse(trimmed);
    return { isJson: true, parsed };
  } catch {
    return { isJson: false, parsed: null };
  }
}

// ============ JSON Syntax Highlighter ============
function highlightJson(json: unknown): React.ReactNode[] {
  const str = JSON.stringify(json, null, 2);
  const result: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  const styles = {
    string: "text-green-600",      // Strings: grün
    number: "text-blue-600",       // Zahlen: blau
    boolean: "text-orange-500",    // Boolean: orange
    null: "text-red-500",          // null: rot
    key: "text-purple-600",        // Keys: lila
    bracket: "text-gray-600",      // Klammern: grau
  };

  while (i < str.length) {
    const char = str[i];

    // Strings (Keys oder Values)
    if (char === '"') {
      const start = i;
      i++;
      while (i < str.length && (str[i] !== '"' || str[i - 1] === '\\')) {
        i++;
      }
      i++; // Schließendes "
      const content = str.slice(start, i);
      
      // Prüfe ob es ein Key ist (gefolgt von :)
      let j = i;
      while (j < str.length && str[j] === ' ') j++;
      const isKey = str[j] === ':';
      
      result.push(
        <span key={key++} className={isKey ? styles.key : styles.string}>
          {content}
        </span>
      );
      continue;
    }

    // Zahlen
    if (char === '-' || (char >= '0' && char <= '9')) {
      const start = i;
      while (i < str.length && /[\d.eE+-]/.test(str[i])) {
        i++;
      }
      result.push(
        <span key={key++} className={styles.number}>
          {str.slice(start, i)}
        </span>
      );
      continue;
    }

    // true/false/null
    if (str.slice(i, i + 4) === 'true') {
      result.push(<span key={key++} className={styles.boolean}>true</span>);
      i += 4;
      continue;
    }
    if (str.slice(i, i + 5) === 'false') {
      result.push(<span key={key++} className={styles.boolean}>false</span>);
      i += 5;
      continue;
    }
    if (str.slice(i, i + 4) === 'null') {
      result.push(<span key={key++} className={styles.null}>null</span>);
      i += 4;
      continue;
    }

    // Klammern und Sonderzeichen
    if ('{}[],:'.includes(char)) {
      result.push(<span key={key++} className={styles.bracket}>{char}</span>);
      i++;
      continue;
    }

    // Whitespace und Rest
    result.push(<span key={key++}>{char}</span>);
    i++;
  }

  return result;
}

// ============ JsonModal ============
function JsonModal({ json, onClose }: { json: unknown; onClose: () => void }) {
  const formatted = JSON.stringify(json, null, 2);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">JSON Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="overflow-auto p-4 flex-1 bg-gray-50">
          <pre className="text-sm font-mono whitespace-pre-wrap wrap-break-word">
            {highlightJson(json)}
          </pre>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(formatted)}
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

// ============ TableViewer ============
function TableViewer({ entities, tableName, onDisconnect, onBackToTables }: { entities: TableEntity[]; tableName: string; onDisconnect: () => void; onBackToTables: () => void }) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedJson, setSelectedJson] = useState<unknown | null>(null);

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleCellClick = (value: unknown) => {
    const { isJson, parsed } = tryParseJson(value);
    if (isJson) {
      setSelectedJson(parsed);
    }
  };

  const sortedEntities = [...entities].sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    const aStr = String(aVal);
    const bStr = String(bVal);
    
    const comparison = aStr.localeCompare(bStr, undefined, { numeric: true });
    return sortDirection === "asc" ? comparison : -comparison;
  });

  if (entities.length === 0) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBackToTables} 
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              ← Tabellen
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              <span className="text-blue-600">{tableName}</span>
            </h2>
          </div>
          <button onClick={onDisconnect} className="text-sm text-gray-600 hover:text-gray-800 underline">
            Trennen
          </button>
        </div>
        <p className="text-gray-500 text-center py-8">Keine Einträge gefunden.</p>
      </div>
    );
  }

  const columns = Array.from(new Set(entities.flatMap((entity) => Object.keys(entity))));
  const priorityColumns = ["partitionKey", "rowKey", "timestamp"];
  const sortedColumns = [
    ...priorityColumns.filter((col) => columns.includes(col)),
    ...columns.filter((col) => !priorityColumns.includes(col)).sort(),
  ];

  const renderCell = (value: unknown) => {
    const { isJson } = tryParseJson(value);
    const displayValue = formatValue(value);
    
    if (isJson) {
      return (
        <span className="flex items-center gap-1 text-purple-600 cursor-pointer hover:text-purple-800">
          <span className="text-xs bg-purple-100 px-1 rounded">JSON</span>
          <span className="truncate">{displayValue}</span>
        </span>
      );
    }
    return displayValue;
  };

  return (
    <div className="w-full">
      {selectedJson !== null && (
        <JsonModal json={selectedJson} onClose={() => setSelectedJson(null)} />
      )}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBackToTables} 
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            ← Tabellen
          </button>
          <h2 className="text-xl font-semibold text-gray-800">
            <span className="text-blue-600">{tableName}</span>
            <span className="text-sm font-normal text-gray-500 ml-2">({entities.length} Einträge)</span>
          </h2>
        </div>
        <button onClick={onDisconnect} className="text-sm text-gray-600 hover:text-gray-800 underline">
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
                  onClick={() => handleSort(column)}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div className="flex items-center gap-1">
                    {column}
                    {sortColumn === column && (
                      <span className="text-blue-600">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedEntities.map((entity, idx) => (
              <tr key={`${entity.partitionKey}-${entity.rowKey}-${idx}`} className="hover:bg-gray-50">
                {sortedColumns.map((column) => {
                  const value = entity[column];
                  const { isJson } = tryParseJson(value);
                  return (
                    <td
                      key={column}
                      className={`px-4 py-3 text-sm text-gray-700 whitespace-nowrap max-w-xs truncate ${isJson ? "cursor-pointer" : ""}`}
                      title={formatValue(value)}
                      onClick={() => isJson && handleCellClick(value)}
                    >
                      {renderCell(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ App ============
function App() {
  const [state, setState] = useState<AppState>({ status: "disconnected" });

  const handleConnect = async (connectionString: string) => {
    setState({ status: "loading-tables" });
    try {
      const tables = await listTables(connectionString);
      setState({ status: "tables-loaded", connectionString, tables });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      setState({ status: "error", message, connectionString });
    }
  };

  const handleSelectTable = async (tableName: string) => {
    if (state.status !== "tables-loaded" && state.status !== "connected") return;
    
    const { connectionString, tables } = state;
    setState({ status: "loading-data", connectionString, tables, selectedTable: tableName });
    
    try {
      const entities = await fetchTableEntities(connectionString, tableName);
      setState({ status: "connected", connectionString, tables, tableName, entities });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      setState({ status: "error", message, connectionString });
    }
  };

  const handleBackToTables = () => {
    if (state.status === "connected") {
      setState({ status: "tables-loaded", connectionString: state.connectionString, tables: state.tables });
    }
  };

  const handleDisconnect = () => {
    setState({ status: "disconnected" });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <h1 className="text-2xl font-bold text-gray-900">Azure Table Viewer</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4">
        {state.status === "disconnected" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-lg font-medium text-gray-800 mb-6 text-center">Mit Azure Table Storage verbinden</h2>
              <ConnectionForm onConnect={handleConnect} isLoading={false} />
            </div>
          </div>
        )}
        
        {state.status === "loading-tables" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-lg font-medium text-gray-800 mb-6 text-center">Mit Azure Table Storage verbinden</h2>
              <ConnectionForm onConnect={handleConnect} isLoading={true} />
            </div>
          </div>
        )}
        
        {state.status === "tables-loaded" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <TableSelector 
                tables={state.tables} 
                onSelectTable={handleSelectTable} 
                onDisconnect={handleDisconnect}
                isLoading={false}
              />
            </div>
          </div>
        )}
        
        {state.status === "loading-data" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-center">
                <p className="text-gray-600 mb-2">Lade Daten aus Tabelle...</p>
                <p className="text-blue-600 font-medium">{state.selectedTable}</p>
              </div>
            </div>
          </div>
        )}
        
        {state.status === "error" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                <strong className="font-medium">Fehler:</strong> {state.message}
              </div>
              <ConnectionForm onConnect={handleConnect} isLoading={false} initialValue={state.connectionString} />
            </div>
          </div>
        )}
        
        {state.status === "connected" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <TableViewer 
              entities={state.entities} 
              tableName={state.tableName} 
              onDisconnect={handleDisconnect}
              onBackToTables={handleBackToTables}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
