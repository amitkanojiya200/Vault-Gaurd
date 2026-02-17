import { useState } from "react";
import { useCMS } from "@/context/CMSContext";
import EditableWrapper from "./EditableWrapper";

export default function TableBlock({ tag }) {
    const { cms, updateTag, isAdmin } = useCMS();
    const table = cms[tag]?.value;

    const [editing, setEditing] = useState(false);
    const [local, setLocal] = useState(table);

    if (!table) return null;

    function save() {
        updateTag(tag, local);
        setEditing(false);
    }

    return (
        <EditableWrapper isAdmin={isAdmin} onEdit={() => setEditing(true)}>
            <div className="overflow-x-auto rounded-xl border border-orange-200 dark:border-orange-700">
                <table className="min-w-full">
                    <thead className="bg-orange-500 text-white">
                        <tr>
                            {table.columns.map((col, i) => (
                                <th key={i} className="px-4 py-2 text-xs font-semibold">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {local.rows.map((row, i) => (
                            <tr key={i}>
                                {row.map((cell, j) => (
                                    <td key={j} className="px-4 py-2 border">
                                        {editing ? (
                                            <input
                                                value={cell}
                                                onChange={(e) => {
                                                    const updated = [...local.rows];
                                                    updated[i][j] = e.target.value;
                                                    setLocal({ ...local, rows: updated });
                                                }}
                                                className="w-full bg-transparent"
                                            />
                                        ) : (
                                            cell
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {editing && (
                    <div className="flex justify-end p-3">
                        <button
                            onClick={save}
                            className="bg-orange-500 text-white px-4 py-1 rounded"
                        >
                            Save
                        </button>
                    </div>
                )}
            </div>
        </EditableWrapper>
    );
}
