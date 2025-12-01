import { useState } from "react";
import type { TableEntity } from "../types";
import { analyzeContent, type ContentType } from "../utils/jsonUtils";
import { ContentModal } from "./ContentModal";

interface TableViewerProps {
  entities: TableEntity[];
  tableName: string;
  onDisconnect: () => void;
  onBackToTables: () => void;
}

interface ModalState {
  content: unknown;
  type: ContentType;
}

export function TableViewer({ entities, tableName, onDisconnect, onBackToTables }: TableViewerProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [modalState, setModalState] = useState<ModalState | null>(null);

  const formatTimestamp = (value: string): string => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleString("de-DE", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }) + " UTC";
  };

  const formatValue = (value: unknown, column?: string): string => {
    if (value === null || value === undefined) return "-";
    if (column === "timestamp" && typeof value === "string") {
      return formatTimestamp(value);
    }
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
    const analysis = analyzeContent(value);
    if (analysis.isClickable) {
      setModalState({ content: analysis.parsed, type: analysis.type });
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

  const getLabelStyle = (color: string) => {
    const styles: Record<string, string> = {
      purple: "bg-purple-100 text-purple-600",
      green: "bg-green-100 text-green-600", 
      blue: "bg-blue-100 text-blue-600"
    };
    return styles[color] || "bg-gray-100 text-gray-600";
  };

  const renderCell = (value: unknown, column: string) => {
    const analysis = analyzeContent(value);
    const displayValue = formatValue(value, column);
    
    if (analysis.isClickable) {
      const textColorClass = analysis.type === "json" ? "text-purple-600 hover:text-purple-800" 
        : analysis.type === "csv" ? "text-green-600 hover:text-green-800"
        : "text-blue-600 hover:text-blue-800";
      
      return (
        <span className={`flex items-center gap-1 cursor-pointer ${textColorClass}`}>
          <span className={`text-xs px-1 rounded ${getLabelStyle(analysis.labelColor)}`}>
            {analysis.label}
          </span>
          <span className="truncate">{displayValue}</span>
        </span>
      );
    }
    return displayValue;
  };

  return (
    <div className="w-full">
      {modalState !== null && (
        <ContentModal 
          content={modalState.content} 
          type={modalState.type} 
          onClose={() => setModalState(null)} 
        />
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
                  const analysis = analyzeContent(value);
                  return (
                    <td
                      key={column}
                      className={`px-4 py-3 text-sm text-gray-700 whitespace-nowrap max-w-xs truncate ${analysis.isClickable ? "cursor-pointer" : ""}`}
                      title={formatValue(value, column)}
                      onClick={() => analysis.isClickable && handleCellClick(value)}
                    >
                      {renderCell(value, column)}
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
