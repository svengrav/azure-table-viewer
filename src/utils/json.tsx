import type { ReactNode } from "react";

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

export function highlightJson(json: unknown): ReactNode[] {
  const str = JSON.stringify(json, null, 2);
  const result: ReactNode[] = [];
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
      
      const className = isKey ? styles.key : styles.string;
      result.push(
        <span key={key++} className={className}>
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

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
