/**
 * Exportação segura de relatórios corporativos em CSV (UTF-8 com BOM para Excel PT-BR)
 * Proteção contra CSV Formula Injection (=, +, -, @).
 */

function sanitizeCsvCell(value: unknown): string {
  const raw = String(value ?? '');
  const trimmed = raw.replace(/\r?\n/g, ' ').trim();
  const safe = /^[=+\-@\t\r]/.test(trimmed) ? `'${trimmed}` : trimmed;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function exportRowsToCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>
): void {
  const headerLine = headers.map(sanitizeCsvCell).join(';');
  const bodyLines = rows.map((row) => row.map(sanitizeCsvCell).join(';'));
  const csvContent = '\uFEFF' + [headerLine, ...bodyLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
