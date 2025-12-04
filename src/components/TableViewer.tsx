import { useState } from "react";
import type { TableEntity } from "../types";
import { NON_EDITABLE_COLUMNS } from "../constants";
import { deleteEntity, updateEntity } from "../services/tableStorage";
import { tryParseJson, tryParseCsv, formatValue, isTimestampColumn, tryFormatTimestamp } from "../utils/json.tsx";
import { EditModal } from "./EditModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { ArrowLeftIcon, ChevronUpIcon, ChevronDownIcon, LockClosedIcon, LightBulbIcon, TrashIcon, FunnelIcon, XCircleIcon } from "@heroicons/react/20/solid";

interface TableViewerProps {
  entities: TableEntity[];
  tableName: string;
  connectionString: string;
  onDisconnect: () => void;
  onBackToTables: () => void;
  onEntitiesChange: (entities: TableEntity[]) => void;
  onFilter: (filter: string) => void;
  currentFilter: string;
  isFiltering: boolean;
}

export function TableViewer({
  entities,
  tableName,
  connectionString,
  onDisconnect,
  onBackToTables,
  onEntitiesChange,
  onFilter,
  currentFilter,
  isFiltering,
}: TableViewerProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedCell, setSelectedCell] = useState<{ value: unknown; entity: TableEntity; column: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterInput, setFilterInput] = useState(currentFilter);

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

  // Filter-UI Komponente (wiederverwendbar)
  const FilterSection = () => (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <input
            type="text"
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onFilter(filterInput)}
            placeholder="PartitionKey eq 'wert' and Status eq 'active'"
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            disabled={isFiltering}
          />
          {filterInput && (
            <button
              onClick={() => { setFilterInput(""); onFilter(""); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Filter löschen"
            >
              <XCircleIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        <button
          onClick={() => onFilter(filterInput)}
          disabled={isFiltering}
          className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          <FunnelIcon className="w-4 h-4" />
          {isFiltering ? "Filtern..." : "Filtern"}
        </button>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        <span className="font-medium">OData-Syntax:</span> Spalte <code className="bg-gray-200 px-1 rounded">eq</code>/<code className="bg-gray-200 px-1 rounded">ne</code>/<code className="bg-gray-200 px-1 rounded">gt</code>/<code className="bg-gray-200 px-1 rounded">lt</code> <code className="bg-gray-200 px-1 rounded">'wert'</code> — Strings mit einfachen Anführungszeichen!
      </div>
      {currentFilter && (
        <div className="mt-1 text-xs text-blue-600">
          Aktiver Filter: <code className="bg-blue-100 px-1 rounded">{currentFilter}</code>
        </div>
      )}
    </div>
  );

  if (entities.length === 0) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBackToTables} 
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Tabellen
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              <span className="text-blue-600">{tableName}</span>
            </h2>
          </div>
          <button onClick={onDisconnect} className="text-sm text-gray-600 hover:text-gray-800 underline">
            Trennen
          </button>
        </div>
        <FilterSection />
        <p className="text-gray-500 text-center py-8">
          {currentFilter ? "Keine Einträge für diesen Filter gefunden." : "Keine Einträge gefunden."}
        </p>
      </div>
    );
  }

  const columns = Array.from(new Set(entities.flatMap((entity) => Object.keys(entity))));
  const priorityColumns = ["partitionKey", "rowKey", "timestamp"];
  const sortedColumns = [
    ...priorityColumns.filter((col) => columns.includes(col)),
    ...columns.filter((col) => !priorityColumns.includes(col)).sort(),
  ];

  const renderCell = (value: unknown, column: string) => {
    const { isJson } = tryParseJson(value);
    const { isCsv } = tryParseCsv(value);
    
    // Timestamp-Formatierung für passende Spalten
    if (isTimestampColumn(column) && !isJson) {
      const { isTimestamp, formatted } = tryFormatTimestamp(value);
      if (isTimestamp) {
        return (
          <span className="flex items-center gap-1 text-amber-700" title={String(value)}>
            <span className="text-xs bg-amber-100 px-1 rounded">Zeit</span>
            <span className="truncate">{formatted}</span>
          </span>
        );
      }
    }
    
    const displayValue = formatValue(value);
    
    if (isJson) {
      return (
        <span className="flex items-center gap-1 text-purple-600">
          <span className="text-xs bg-purple-100 px-1 rounded">JSON</span>
          <span className="truncate">{displayValue}</span>
        </span>
      );
    }
    if (isCsv) {
      return (
        <span className="flex items-center gap-1 text-green-600">
          <span className="text-xs bg-green-100 px-1 rounded">CSV</span>
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
            <ArrowLeftIcon className="w-4 h-4" />
            Tabellen
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
              className="px-3 py-1.5 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <TrashIcon className="w-4 h-4" />
              {isDeleting ? "Lösche..." : `${selectedRows.size} löschen`}
            </button>
          )}
          <button onClick={onDisconnect} className="text-sm text-gray-600 hover:text-gray-800 underline">
            Trennen
          </button>
        </div>
      </div>
      
      <FilterSection />

      <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
        <LightBulbIcon className="w-4 h-4 text-yellow-500" />
        Doppelklick auf eine Zelle öffnet das Detail-Popup
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
                    {NON_EDITABLE_COLUMNS.includes(column as any) && <LockClosedIcon className="w-3.5 h-3.5 text-gray-400" />}
                    {sortColumn === column && (
                      sortDirection === "asc" 
                        ? <ChevronUpIcon className="w-4 h-4 text-blue-600" />
                        : <ChevronDownIcon className="w-4 h-4 text-blue-600" />
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
                        {renderCell(value, column)}
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
