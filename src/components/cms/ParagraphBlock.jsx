// src/components/cms/ParagraphBlock.jsx
import { useState } from "react";
import { useCMS } from "@/context/CMSContext";
import EditableWrapper from "./EditableWrapper";
import CMSModal from "./CMSModal";

export default function ParagraphBlock({ tag, clasName }) {
    const { cms, updateTag, isAdmin } = useCMS();
    const [open, setOpen] = useState(false);

    // Get the value, or fallback to a placeholder if it doesn't exist
    const item = cms[tag];
    const value = item?.value || (isAdmin ? `[Click to edit ${tag}]` : "");

    // If not admin and no value, show nothing
    if (!value && !isAdmin) return null;

    return (
        <>
            <EditableWrapper isAdmin={isAdmin} onEdit={() => setOpen(true)}>
                <p
                    className={`text-justify leading-relaxed break-words ${clasName || ''}
                        }`}
                    dangerouslySetInnerHTML={{ __html: value }}
                />
            </EditableWrapper>

            <CMSModal
                open={open}
                onClose={() => setOpen(false)}
                initialValue={item?.value || ""}
                onSave={(val) => updateTag(tag, val)}
            />
        </>
    );
}
