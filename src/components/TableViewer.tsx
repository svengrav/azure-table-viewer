import { useState } from "react";
import type { TableEntity } from "../types";
import { NON_EDITABLE_COLUMNS } from "../constants";
import { deleteEntity, updateEntity } from "../services/tableStorage";
import { tryParseJson, formatValue } from "../utils/json.tsx";
import { EditModal } from "./EditModal";
import { ConfirmDialog } from "./ConfirmDialog";

interface TableViewerProps {
  entities: TableEntity[];
  tableName: string;
  connectionString: string;
  onDisconnect: () => void;
  onBackToTables: () => void;
  onEntitiesChange: (entities: TableEntity[]) => void;
}

export function TableViewer({
  entities,
  tableName,
  connectionString,
  onDisconnect,
  onBackToTables,
  onEntitiesChange,
}: TableViewerProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedCell, setSelectedCell] = useState<{ value: unknown; entity: TableEntity; column: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getRowKey = (entity: TableEntity) => `${entity.partitionKey}|${entity.rowKey}`;
  const isColumnEditable = (column: string) => !NON_EDITABLE_COLUMNS.includes(column as any);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleCellDoubleClick = (entity: TableEntity, column: string) => {
    const value = entity[column];
    setSelectedCell({ value, entity, column });
  };

  const handleCellSave = async (newValue: string) => {
    if (!selectedCell) return;
    
    const { entity, column } = selectedCell;
    const updatedEntity = { ...entity, [column]: newValue };
    
    await updateEntity(connectionString, tableName, updatedEntity);
    
    const updatedEntities = entities.map(e => 
      e.partitionKey === entity.partitionKey && e.rowKey === entity.rowKey 
        ? updatedEntity 
        : e
    );
    onEntitiesChange(updatedEntities);
  };

  const handleRowSelect = (entity: TableEntity) => {
    const key = getRowKey(entity);
    const newSelected = new Set(selectedRows);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === entities.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(entities.map(getRowKey)));
    }
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    try {
      const entitiesToDelete = entities.filter(e => selectedRows.has(getRowKey(e)));
      for (const entity of entitiesToDelete) {
        await deleteEntity(connectionString, tableName, entity.partitionKey, entity.rowKey);
      }
      const remainingEntities = entities.filter(e => !selectedRows.has(getRowKey(e)));
      onEntitiesChange(remainingEntities);
      setSelectedRows(new Set());
    } catch (error) {
      alert(`Fehler beim Löschen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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
        <span className="flex items-center gap-1 text-purple-600">
          <span className="text-xs bg-purple-100 px-1 rounded">JSON</span>
          <span className="truncate">{displayValue}</span>
        </span>
      );
    }
    return displayValue;
  };

  const isAllSelected = entities.length > 0 && selectedRows.size === entities.length;
  const hasSelection = selectedRows.size > 0;

  return (
    <div className="w-full">
      {selectedCell !== null && (
        <EditModal 
          value={selectedCell.value}
          columnName={selectedCell.column}
          isEditable={isColumnEditable(selectedCell.column)}
          onClose={() => setSelectedCell(null)}
          onSave={handleCellSave}
        />
      )}
      {showDeleteConfirm && (
        <ConfirmDialog
          message={`Möchten Sie ${selectedRows.size} Einträge wirklich löschen?`}
          onConfirm={handleDeleteSelected}
          onCancel={() => setShowDeleteConfirm(false)}
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
        <div className="flex items-center gap-4">
          {hasSelection && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="px-3 py-1.5 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
            >
              {isDeleting ? "Lösche..." : `${selectedRows.size} löschen`}
            </button>
          )}
          <button onClick={onDisconnect} className="text-sm text-gray-600 hover:text-gray-800 underline">
            Trennen
          </button>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mb-2">
        💡 Doppelklick auf eine Zelle öffnet das Detail-Popup
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              {sortedColumns.map((column) => (
                <th
                  key={column}
                  onClick={() => handleSort(column)}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div className="flex items-center gap-1">
                    {column}
                    {NON_EDITABLE_COLUMNS.includes(column as any) && <span className="text-gray-400">🔒</span>}
                    {sortColumn === column && (
                      <span className="text-blue-600">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedEntities.map((entity, idx) => {
              const rowKey = getRowKey(entity);
              const isSelected = selectedRows.has(rowKey);
              return (
                <tr 
                  key={`${entity.partitionKey}-${entity.rowKey}-${idx}`} 
                  className={`hover:bg-gray-50 ${isSelected ? "bg-blue-50" : ""}`}
                >
                  <td className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleRowSelect(entity)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  {sortedColumns.map((column) => {
                    const value = entity[column];
                    return (
                      <td
                        key={column}
                        className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap max-w-xs truncate cursor-pointer hover:bg-blue-50"
                        title="Doppelklick zum Öffnen"
                        onDoubleClick={() => handleCellDoubleClick(entity, column)}
                      >
                        {renderCell(value)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
