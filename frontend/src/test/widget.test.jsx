import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WidgetPreview from '../components/WidgetPreview';

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
    },
});

describe('WidgetPreview', () => {
    const mockAddress = 'SP2J9GQYYCH8B2XZE7Y7DB7D99R6Z7G9S9SZVQD40';

    it('renders the correct embed code with the provided address', () => {
        render(<WidgetPreview address={mockAddress} />);

        expect(screen.getByText(/Embeddable Widget/i)).toBeInTheDocument();

        const pre = screen.getByText((content, element) => {
            return element.tagName.toLowerCase() === 'pre' && content.includes(mockAddress);
        });
        expect(pre).toBeInTheDocument();
        expect(pre.textContent).toContain(`data-address="${mockAddress}"`);
    });

    it('copies the embed code to clipboard when requested', async () => {
        render(<WidgetPreview address={mockAddress} />);

        // The CopyButton component probably has text "Copy Code" or an icon
        const copyButton = screen.getByText(/Copy Code/i);
        await fireEvent.click(copyButton);

        expect(navigator.clipboard.writeText).toHaveBeenCalled();
        const copiedText = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
        expect(copiedText).toContain(mockAddress);
    });
});
