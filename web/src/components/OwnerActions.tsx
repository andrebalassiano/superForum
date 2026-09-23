import { useState } from 'react';
import Button from './Button';

interface OwnerActionsProps {
    onEdit: () => void;
    onDelete: () => void;
    isDeleting?: boolean;
    /** What's being removed, for the confirmation line: "Delete this post?" */
    label: string;
}

// The edit/delete pair shown on something you wrote — a post or a comment. Rendering it is purely a
// UI decision; the API checks ownership on every PATCH and DELETE regardless, so hiding these
// buttons is a convenience, never the control.
//
// Deleting asks first, inline rather than through window.confirm: a browser dialog can't be styled,
// can't be themed, and pulls focus out of the page. The confirmation replaces the buttons in place,
// so the destructive action always takes two deliberate clicks.
function OwnerActions({ onEdit, onDelete, isDeleting = false, label }: OwnerActionsProps) {
    const [confirming, setConfirming] = useState(false);

    if (confirming) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted">Delete this {label}?</span>
                <Button
                    type="button"
                    variant="secondary"
                    className="border-danger-line px-3 py-1 text-danger"
                    onClick={onDelete}
                    disabled={isDeleting}
                >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    className="px-2 py-1"
                    onClick={() => setConfirming(false)}
                    disabled={isDeleting}
                >
                    Cancel
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" className="px-2 py-1" onClick={onEdit}>
                Edit
            </Button>
            <Button
                type="button"
                variant="ghost"
                className="px-2 py-1"
                onClick={() => setConfirming(true)}
            >
                Delete
            </Button>
        </div>
    );
}

export default OwnerActions;
