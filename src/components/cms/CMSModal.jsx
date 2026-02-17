// src/components/cms/CMSModal.jsx
import { useEffect, useState } from "react";

export default function CMSModal({
    open,
    onClose,
    initialValue,
    onSave
}) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl w-full max-w-3xl shadow-xl">
                <h2 className="text-lg font-semibold mb-4">Edit Content</h2>

                <textarea
                    className="w-full border rounded-lg p-3 dark:bg-slate-800 min-h-[200px]"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />

                <div className="flex justify-end gap-3 mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded-lg"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={() => {
                            onSave(value);
                            onClose();
                        }}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
