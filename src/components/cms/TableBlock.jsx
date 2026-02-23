import { useEffect, useState } from "react";
import { useCMS } from "@/context/CMSContext";
import EditableWrapper from "./EditableWrapper";
import { Plus, Trash2, Columns } from "lucide-react";

export default function TableBlock({
  tag,
  className = "",
  defaultColumns = ["Column 1", "Column 2"]
}) {
  const { cms, updateTag, isAdmin } = useCMS();
  const existing = cms[tag]?.value;

  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(null);

  /* ---------- INIT ---------- */
  useEffect(() => {
    if (!existing && isAdmin) {
      const initial = {
        columns: defaultColumns,
        rows: []
      };
      updateTag(tag, initial);
      setLocal(initial);
    } else if (existing) {
      setLocal(existing);
    }
  }, [existing]);

  if (!local) return null;

  /* ---------- COLUMN OPS ---------- */
  function addColumn() {
    const newColumns = [...local.columns, `Column ${local.columns.length + 1}`];
    const newRows = local.rows.map(r => [...r, ""]);
    setLocal({ columns: newColumns, rows: newRows });
  }

  function removeColumn(index) {
    const newColumns = local.columns.filter((_, i) => i !== index);
    const newRows = local.rows.map(r => r.filter((_, i) => i !== index));
    setLocal({ columns: newColumns, rows: newRows });
  }

  function updateColumnName(index, value) {
    const newColumns = [...local.columns];
    newColumns[index] = value;
    setLocal({ ...local, columns: newColumns });
  }

  /* ---------- ROW OPS ---------- */
  function addRow() {
    const empty = new Array(local.columns.length).fill("");
    setLocal({ ...local, rows: [...local.rows, empty] });
  }

  function removeRow(index) {
    const updated = local.rows.filter((_, i) => i !== index);
    setLocal({ ...local, rows: updated });
  }

  function updateCell(r, c, value) {
    const updated = [...local.rows];
    updated[r][c] = value;
    setLocal({ ...local, rows: updated });
  }

  function save() {
    updateTag(tag, local);
    setEditing(false);
  }

  const isEmpty = local.rows.length === 0;

  return (
    <EditableWrapper isAdmin={isAdmin} onEdit={() => setEditing(true)}>
      <div
        className={`overflow-x-auto rounded-xl border border-orange-200 dark:border-orange-700 bg-white dark:bg-slate-900 ${className}`}
      >
        <table className="min-w-full text-sm">
          {/* ---------- HEADER ---------- */}
          <thead className="bg-orange-500 dark:bg-orange-600 text-white">
            <tr>
              {local.columns.map((col, i) => (
                <th key={i} className="px-4 py-3 text-xs font-semibold uppercase relative">
                  {editing ? (
                    <input
                      value={col}
                      onChange={(e) => updateColumnName(i, e.target.value)}
                      className="bg-transparent text-white w-full border-b border-white focus:outline-none"
                    />
                  ) : (
                    col
                  )}

                  {editing && (
                    <button
                      onClick={() => removeColumn(i)}
                      className="absolute top-1 right-1 text-white/70 hover:text-red-300"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </th>
              ))}

              {editing && (
                <th className="px-4 py-3 text-xs">
                  <button
                    onClick={addColumn}
                    className="flex items-center gap-1 text-white/80 hover:text-white"
                  >
                    <Columns size={14} />
                    Add
                  </button>
                </th>
              )}
            </tr>
          </thead>

          {/* ---------- BODY ---------- */}
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {local.rows.map((row, rIndex) => (
              <tr
                key={rIndex}
                className="hover:bg-orange-50 dark:hover:bg-orange-900/20"
              >
                {row.map((cell, cIndex) => (
                  <td key={cIndex} className="px-4 py-2 text-center">
                    {editing ? (
                      <input
                        value={cell}
                        onChange={(e) =>
                          updateCell(rIndex, cIndex, e.target.value)
                        }
                        className="w-full bg-transparent border-b border-orange-300 dark:border-orange-500 focus:outline-none text-gray-800 dark:text-gray-100"
                      />
                    ) : (
                      <span className="text-gray-800 dark:text-gray-100">
                        {cell}
                      </span>
                    )}
                  </td>
                ))}

                {editing && (
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => removeRow(rIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {/* Empty state */}
            {isEmpty && !editing && (
              <tr>
                <td
                  colSpan={local.columns.length}
                  className="text-center py-6 text-gray-400 dark:text-gray-500"
                >
                  {isAdmin
                    ? "No table data. Click edit to add rows."
                    : ""}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ---------- FOOTER CONTROLS ---------- */}
        {isAdmin && editing && (
          <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-800 border-t dark:border-slate-700">
            <button
              onClick={addRow}
              className="flex items-center gap-2 bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600"
            >
              <Plus size={16} />
              Add Row
            </button>

            <button
              onClick={save}
              className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </EditableWrapper>
  );
}