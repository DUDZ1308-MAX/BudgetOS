export interface PdfReportSection {
  title: string;
  headers: string[];
  rows: Record<string, unknown>[];
}

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  sections: PdfReportSection[];
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter';
}

export class PdfExporter {
  async generate(options: PdfReportOptions): Promise<Blob> {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF(options.orientation || 'portrait', 'mm', options.pageSize || 'a4');

    this.addHeader(doc, options);

    for (const section of options.sections) {
      if (options.sections.indexOf(section) > 0) doc.addPage();
      this.addSection(doc, section, autoTable);
    }

    this.addFooter(doc);
    return doc.output('blob');
  }

  async download(options: PdfReportOptions, filename?: string): Promise<void> {
    const blob = await this.generate(options);
    const fn = filename || `${options.title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fn;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async print(options: PdfReportOptions, filename?: string): Promise<void> {
    const blob = await this.generate(options);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  private addHeader(doc: import('jspdf').jsPDF, options: PdfReportOptions): void {
    doc.setFontSize(20);
    doc.setTextColor(33, 37, 41);
    doc.text(options.title, 14, 20);

    if (options.subtitle) {
      doc.setFontSize(11);
      doc.setTextColor(108, 117, 125);
      doc.text(options.subtitle, 14, 28);
    }

    doc.setDrawColor(222, 226, 230);
    doc.line(14, 32, doc.internal.pageSize.width - 14, 32);
  }

  private addSection(
    doc: import('jspdf').jsPDF,
    section: PdfReportSection,
    autoTable: Function,
  ): void {
    doc.setFontSize(14);
    doc.setTextColor(33, 37, 41);
    doc.text(section.title, 14, (doc as any).lastAutoTable?.finalY ? ((doc as any).lastAutoTable.finalY as number) + 15 : 42);

    autoTable(doc, {
      head: [section.headers],
      body: section.rows.map((row) => section.headers.map((h) => this.formatValue(row[h]))),
      startY: (doc as any).lastAutoTable?.finalY ? ((doc as any).lastAutoTable.finalY as number) + 20 : 48,
      theme: 'grid',
      headStyles: { fillColor: [73, 80, 87], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      margin: { top: 10 },
    });
  }

  private addFooter(doc: import('jspdf').jsPDF): void {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(173, 181, 189);
      doc.text(
        `BudgetOS Report — Generated ${new Date().toLocaleDateString()} — Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' },
      );
    }
  }

  private formatValue(val: unknown): string {
    if (val === null || val === undefined) return '';
    if (typeof val === 'number') {
      return val % 1 === 0 ? val.toString() : val.toFixed(2);
    }
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (val instanceof Date) return val.toLocaleDateString();
    return String(val);
  }
}

export const pdfExporter = new PdfExporter();
