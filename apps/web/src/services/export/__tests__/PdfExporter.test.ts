import { describe, it, expect, vi } from 'vitest';
import { PdfExporter, pdfExporter } from '@/services/export/PdfExporter';

const mockDoc = {
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  setDrawColor: vi.fn(),
  text: vi.fn(),
  line: vi.fn(),
  addPage: vi.fn(),
  internal: {
    pageSize: { width: 210, height: 297 },
    getNumberOfPages: vi.fn(() => 1),
  },
  setPage: vi.fn(),
  lastAutoTable: { finalY: 50 },
  output: vi.fn(() => new Blob(['pdf'], { type: 'application/pdf' })),
};

vi.mock('jspdf', () => ({
  default: vi.fn(() => mockDoc),
}));

vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}));

describe('PdfExporter', () => {
  it('generates a PDF blob', async () => {
    const blob = await pdfExporter.generate({
      title: 'Test Report',
      sections: [
        {
          title: 'Transactions',
          headers: ['Date', 'Amount'],
          rows: [{ Date: '2025-01-01', Amount: 100 }],
        },
      ],
    });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
  });

  it('handles multiple sections', async () => {
    const blob = await pdfExporter.generate({
      title: 'Multi-Section Report',
      sections: [
        { title: 'Section 1', headers: ['A'], rows: [{ A: 1 }] },
        { title: 'Section 2', headers: ['B'], rows: [{ B: 2 }] },
      ],
    });
    expect(blob).toBeInstanceOf(Blob);
  });

  it('includes subtitle when provided', async () => {
    await pdfExporter.generate({
      title: 'Test',
      subtitle: 'Generated report',
      sections: [],
    });
    expect(mockDoc.text).toHaveBeenCalledWith('Generated report', 14, 28);
  });
});
