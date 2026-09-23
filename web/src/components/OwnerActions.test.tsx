import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OwnerActions from './OwnerActions';

// No providers needed: this component owns nothing but its own confirm state.
describe('OwnerActions', () => {
    it('does not delete on the first click', async () => {
        const onDelete = vi.fn();
        render(<OwnerActions label="post" onEdit={vi.fn()} onDelete={onDelete} />);

        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

        expect(onDelete).not.toHaveBeenCalled();
        expect(screen.getByText('Delete this post?')).toBeInTheDocument();
    });

    it('deletes on the second click', async () => {
        const onDelete = vi.fn();
        render(<OwnerActions label="post" onEdit={vi.fn()} onDelete={onDelete} />);

        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

        expect(onDelete).toHaveBeenCalledOnce();
    });

    it('backs out of the confirmation without deleting', async () => {
        const onDelete = vi.fn();
        render(<OwnerActions label="comment" onEdit={vi.fn()} onDelete={onDelete} />);

        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onDelete).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });

    it('calls onEdit straight away', async () => {
        const onEdit = vi.fn();
        render(<OwnerActions label="post" onEdit={onEdit} onDelete={vi.fn()} />);

        await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

        expect(onEdit).toHaveBeenCalledOnce();
    });
});
