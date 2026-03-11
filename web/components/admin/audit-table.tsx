import type { AuditLogEntry } from "@/lib/mock-data";

type AuditTableProps = {
  entries: AuditLogEntry[];
};

export function AuditTable({ entries }: AuditTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e5e7eb]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Actor</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Target</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-gray-100">
              <td className="px-4 py-3 text-gray-500">{entry.createdAt}</td>
              <td className="px-4 py-3 font-medium text-gray-900">
                {entry.actor}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-600">
                {entry.action}
              </td>
              <td className="px-4 py-3 text-gray-700">{entry.target}</td>
            </tr>
          ))}
          {entries.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                No audit entries
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
