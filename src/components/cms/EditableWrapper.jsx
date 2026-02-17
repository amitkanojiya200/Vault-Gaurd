// src/components/cms/EditableWrapper.jsx
import { Pencil } from "lucide-react";

export default function EditableWrapper({
    children,
    isAdmin,
    onEdit
}) {
    return (
        <div className="relative group">
            {isAdmin && (
                <button
                    onClick={onEdit}
                    className="absolute -top-2 -right-2 bg-white dark:bg-slate-800 shadow-md rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                >
                    <Pencil size={20} className="text-orange-500 cursor-pointer" />
                </button>
            )}
            {children}
        </div>
    );
}
