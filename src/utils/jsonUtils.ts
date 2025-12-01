import React from "react";

export type ContentType = "json" | "csv" | "text";

export interface ContentAnalysis {
  type: ContentType;
  isClickable: boolean;
  parsed: unknown;
  label: string;
  labelColor: string;
}

const LONG_TEXT_THRESHOLD = 100;

export function tryParseJson(value: unknown): { isJson: boolean; parsed: unknown } {
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

export function tryParseCsv(value: unknown): { isCsv: boolean; parsed: string[][] } {
  if (typeof value !== "string") {
    return { isCsv: false, parsed: [] };
  }
  
  const trimmed = value.trim();
  const lines = trimmed.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  // Mindestens 2 Zeilen und konsistente Spaltenanzahl
  if (lines.length < 2) {
    return { isCsv: false, parsed: [] };
  }
  
  // Erkennung des Trennzeichens (Komma, Semikolon, Tab)
  const delimiters = [",", ";", "\t"];
  let bestDelimiter = ",";
  let maxConsistency = 0;
  
  for (const delimiter of delimiters) {
    const counts = lines.map(line => line.split(delimiter).length);
    const firstCount = counts[0];
    
    // Mindestens 2 Spalten
    if (firstCount < 2) continue;
    
    const consistent = counts.filter(c => c === firstCount).length;
    if (consistent > maxConsistency) {
      maxConsistency = consistent;
      bestDelimiter = delimiter;
    }
  }
  
  // Mindestens 80% der Zeilen sollten konsistent sein
  if (maxConsistency / lines.length < 0.8) {
    return { isCsv: false, parsed: [] };
  }
  
  const parsed = lines.map(line => line.split(bestDelimiter).map(cell => cell.trim()));
  const columnCount = parsed[0].length;
  
  // Alle Zeilen müssen gleiche Spaltenanzahl haben (mit Toleranz)
  const validRows = parsed.filter(row => row.length === columnCount);
  if (validRows.length / parsed.length < 0.8) {
    return { isCsv: false, parsed: [] };
  }
  
  return { isCsv: true, parsed: validRows };
}

export function analyzeContent(value: unknown): ContentAnalysis {
  // JSON prüfen
  const { isJson, parsed: jsonParsed } = tryParseJson(value);
  if (isJson) {
    return {
      type: "json",
      isClickable: true,
      parsed: jsonParsed,
      label: "JSON",
      labelColor: "purple"
    };
  }
  
  // CSV prüfen
  const { isCsv, parsed: csvParsed } = tryParseCsv(value);
  if (isCsv) {
    return {
      type: "csv",
      isClickable: true,
      parsed: csvParsed,
      label: "CSV",
      labelColor: "green"
    };
  }
  
  // Langer Text prüfen
  const strValue = String(value ?? "");
  if (strValue.length > LONG_TEXT_THRESHOLD) {
    return {
      type: "text",
      isClickable: true,
      parsed: strValue,
      label: "TEXT",
      labelColor: "blue"
    };
  }
  
  // Normaler Wert
  return {
    type: "text",
    isClickable: false,
    parsed: value,
    label: "",
    labelColor: ""
  };
}

export function highlightJson(json: unknown): React.ReactNode[] {
  const str = JSON.stringify(json, null, 2);
  const result: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  const styles = {
    string: "text-green-600",
    number: "text-blue-600",
    boolean: "text-orange-500",
    null: "text-red-500",
    key: "text-purple-600",
    bracket: "text-gray-600",
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
      i++;
      const content = str.slice(start, i);
      
      let j = i;
      while (j < str.length && str[j] === ' ') j++;
      const isKey = str[j] === ':';
      
      result.push(
        React.createElement('span', { key: key++, className: isKey ? styles.key : styles.string }, content)
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
        React.createElement('span', { key: key++, className: styles.number }, str.slice(start, i))
      );
      continue;
    }

    // true/false/null
    if (str.slice(i, i + 4) === 'true') {
      result.push(React.createElement('span', { key: key++, className: styles.boolean }, 'true'));
      i += 4;
      continue;
    }
    if (str.slice(i, i + 5) === 'false') {
      result.push(React.createElement('span', { key: key++, className: styles.boolean }, 'false'));
      i += 5;
      continue;
    }
    if (str.slice(i, i + 4) === 'null') {
      result.push(React.createElement('span', { key: key++, className: styles.null }, 'null'));
      i += 4;
      continue;
    }

    // Klammern und Sonderzeichen
    if ('{}[],:'.includes(char)) {
      result.push(React.createElement('span', { key: key++, className: styles.bracket }, char));
      i++;
      continue;
    }

    // Whitespace und Rest
    result.push(React.createElement('span', { key: key++ }, char));
    i++;
  }

  return result;
}
