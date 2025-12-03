import React from "react";

export default function DataTable({ columns, rows }) {
  return (
    <div className="overflow-auto bg-white dark:bg-gray-800 rounded-lg border">
      <table className="min-w-full divide-y">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            {columns.map((c) => <th key={c.key} className="px-4 py-3 text-left text-sm font-medium text-gray-600">{c.title}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              {columns.map(c => <td key={c.key} className="px-4 py-3 text-sm">{r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
