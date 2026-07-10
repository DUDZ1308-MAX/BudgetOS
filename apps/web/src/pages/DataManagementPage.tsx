import { useState, useRef, useCallback } from 'react';
import { csvImporter, parseCSV, generateSampleCSV, importValidator, importMapper, defaultMappings } from '@/services/import';
import { excelImporter } from '@/services/import/ExcelImporter';
import { jsonImporter } from '@/services/import/JsonImporter';
import { csvExporter } from '@/services/export/CsvExporter';
import { excelExporter } from '@/services/export/ExcelExporter';
import { pdfExporter } from '@/services/export/PdfExporter';
import { jsonExporter } from '@/services/export/JsonExporter';
import { backupManager } from '@/services/backup/BackupManager';
import { restoreManager } from '@/services/backup/RestoreManager';
import { useAuthStore } from '@/stores/auth';
import type { ImportEntityType, ColumnMapping, ParseResult } from '@/services/import';
import type { BackupData, BackupMetadata } from '@/services/backup';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

type Tab = 'import' | 'export' | 'backup';
type ImportFormat = 'csv' | 'excel' | 'json';

export function DataManagementPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('import');
  const [importFormat, setImportFormat] = useState<ImportFormat>('csv');
  const [importEntity, setImportEntity] = useState<ImportEntityType>('transaction');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [exportEntity, setExportEntity] = useState<ImportEntityType>('transaction');
  const [backupName, setBackupName] = useState('');
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'default';
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', variant: 'default', onConfirm: () => {} });
  const pendingRestoreRef = useRef<BackupData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMessage(null);

    try {
      if (importFormat === 'csv') {
        const text = await file.text();
        const result = parseCSV(text);
        setParseResult(result);
        if (result.rows.length === 0) setStatusMessage('No rows found in CSV');
      } else if (importFormat === 'excel') {
        const result = await excelImporter.preview(file);
        if (result.worksheets.length > 0) {
          const ws = result.worksheets[0]!;
          setParseResult({ headers: ws.headers, rows: ws.rows, errors: result.errors });
        }
      } else {
        const result = await jsonImporter.parse(file);
        const valid = jsonImporter.validateStructure(result.data);
        if (valid.valid) {
          const rows = jsonImporter.toRows(result.data, valid.entities[0]!);
          setParseResult(rows);
        } else {
          setStatusMessage(valid.errors[0] ?? 'Invalid JSON structure');
        }
      }
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Failed to parse file');
    }
  }, [importFormat]);

  const handleImport = useCallback(async () => {
    if (!user || !parseResult || parseResult.rows.length === 0) return;
    setImporting(true);
    setStatusMessage(null);

    const mappings = defaultMappings[importEntity];
    if (!mappings) {
      setStatusMessage('No column mappings for this entity type');
      setImporting(false);
      return;
    }

    const validation = importValidator.validate(parseResult.rows, importEntity, mappings);
    if (!validation.valid) {
      setStatusMessage(`Validation failed: ${validation.errorCount} error(s), ${validation.warningCount} warning(s)`);
      setImporting(false);
      return;
    }

    try {
      const result = await importMapper.importRows(user.id, parseResult.rows, importEntity, mappings);
      setImportResult(`Imported ${result.imported} rows, skipped ${result.skipped}`);
      setParseResult(null);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }, [user, parseResult, importEntity]);

  const handleCsvExport = useCallback(() => {
    const headers = defaultMappings[exportEntity]?.map((m) => m.sourceColumn) ?? [];
    const sample = generateSampleCSV(exportEntity);
    const sampleResult = parseCSV(sample);
    csvExporter.download(headers, sampleResult.rows.map((r) => r.data), `${exportEntity}_template.csv`);
  }, [exportEntity]);

  const handleExcelExport = useCallback(async () => {
    const headers = defaultMappings[exportEntity]?.map((m) => m.sourceColumn) ?? [];
    const sample = generateSampleCSV(exportEntity);
    const sampleResult = parseCSV(sample);
    await excelExporter.download([
      { name: exportEntity, headers, rows: sampleResult.rows.map((r) => r.data) },
    ]);
  }, [exportEntity]);

  const handlePdfExport = useCallback(async () => {
    const headers = ['Setting', 'Value'];
    const rows = [
      { Setting: 'Rate', Value: '6.5%' },
      { Setting: 'Term', Value: '30 years' },
    ];
    await pdfExporter.download({
      title: `${exportEntity} Report`,
      subtitle: `Sample ${exportEntity} data`,
      sections: [{ title: exportEntity, headers, rows }],
    });
  }, [exportEntity]);

  const handleJsonExport = useCallback(() => {
    const data = jsonExporter.buildExport([], [], [], [], [], []);
    jsonExporter.download(data);
  }, []);

  const handleCreateBackup = useCallback(async () => {
    if (!user) return;
    setCreating(true);
    setStatusMessage(null);
    try {
      const name = backupName || `Backup ${new Date().toLocaleDateString()}`;
      await backupManager.createBackup(user.id, name);
      setBackups(backupManager.listLocalBackups());
      setStatusMessage('Backup created successfully');
      setBackupName('');
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Backup failed');
    } finally {
      setCreating(false);
    }
  }, [user, backupName]);

  const handleRestore = useCallback(async (backup: BackupData) => {
    if (!user) return;
    pendingRestoreRef.current = backup;
    setConfirmDialog({
      open: true,
      title: 'Restore Backup',
      message: `This will restore data from "${backup._meta.name}". Existing data may be overwritten. Continue?`,
      variant: 'warning',
      onConfirm: async () => {
        setRestoring(true);
        setStatusMessage(null);
        try {
          const preview = await restoreManager.preview(backup, user.id);
          const result = await restoreManager.restore(backup, user.id, 'merge');
          setStatusMessage(`Restored ${result.restored} records, ${result.skipped} skipped`);
        } catch (err) {
          setStatusMessage(err instanceof Error ? err.message : 'Restore failed');
        } finally {
          setRestoring(false);
          pendingRestoreRef.current = null;
        }
      },
    });
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Data Management</h1>

      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {(['import', 'export', 'backup'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {statusMessage && (
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {statusMessage}
        </div>
      )}

      {importResult && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {importResult}
          <button onClick={() => setImportResult(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            {(['csv', 'excel', 'json'] as ImportFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => { setImportFormat(fmt); setParseResult(null); }}
                className={`rounded-lg px-4 py-2 text-sm font-medium uppercase ${
                  importFormat === fmt
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          <select
            value={importEntity}
            onChange={(e) => setImportEntity(e.target.value as ImportEntityType)}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="transaction">Transactions</option>
            <option value="category">Categories</option>
            <option value="budget">Budgets</option>
            <option value="savings_goal">Savings Goals</option>
            <option value="mortgage">Mortgages</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Select File
            </button>
            <button
              onClick={() => {
                const csv = generateSampleCSV(importEntity);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${importEntity}_sample.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
            >
              Download Sample
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={importFormat === 'csv' ? '.csv' : importFormat === 'excel' ? '.xlsx,.xls' : '.json'}
            onChange={handleFileSelect}
            className="hidden"
          />

          {parseResult && parseResult.rows.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Preview ({parseResult.rows.length} rows)
              </h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      {parseResult.headers.map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {parseResult.rows.slice(0, 10).map((row) => (
                      <tr key={row.rowNumber}>
                        {parseResult.headers.map((h) => (
                          <td key={h} className="px-3 py-2 text-slate-700 dark:text-slate-300">
                            {String(row.data[h] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleImport}
                disabled={importing}
                className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {importing ? 'Importing...' : `Import ${parseResult.rows.length} Rows`}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'export' && (
        <div className="space-y-4">
          <select
            value={exportEntity}
            onChange={(e) => setExportEntity(e.target.value as ImportEntityType)}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="transaction">Transactions</option>
            <option value="category">Categories</option>
            <option value="budget">Budgets</option>
            <option value="savings_goal">Savings Goals</option>
            <option value="mortgage">Mortgages</option>
          </select>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleCsvExport} className="rounded-lg border border-slate-300 p-4 text-left hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800">
              <span className="block text-sm font-medium text-slate-900 dark:text-white">CSV</span>
              <span className="text-xs text-slate-500">Plain text, spreadsheet compatible</span>
            </button>
            <button onClick={handleExcelExport} className="rounded-lg border border-slate-300 p-4 text-left hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800">
              <span className="block text-sm font-medium text-slate-900 dark:text-white">Excel</span>
              <span className="text-xs text-slate-500">Formatted .xlsx workbook</span>
            </button>
            <button onClick={handlePdfExport} className="rounded-lg border border-slate-300 p-4 text-left hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800">
              <span className="block text-sm font-medium text-slate-900 dark:text-white">PDF</span>
              <span className="text-xs text-slate-500">Printable report</span>
            </button>
            <button onClick={handleJsonExport} className="rounded-lg border border-slate-300 p-4 text-left hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800">
              <span className="block text-sm font-medium text-slate-900 dark:text-white">JSON</span>
              <span className="text-xs text-slate-500">Full data export, machine-readable</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Create Backup</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                placeholder="Backup name (optional)"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                onClick={handleCreateBackup}
                disabled={creating}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Backup'}
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Local Backups</h2>
              <button
                onClick={() => setBackups(backupManager.listLocalBackups())}
                className="text-xs text-brand-600 hover:underline"
              >
                Refresh
              </button>
            </div>

            {backups.length === 0 ? (
              <p className="text-sm text-slate-500">No backups yet</p>
            ) : (
              <div className="space-y-2">
                {backups.map((b) => {
                  const backup = backupManager.getLocalBackup(b.id);
                  return (
                    <div key={b.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 dark:border-slate-700">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{b.name}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(b.createdAt).toLocaleString()} &middot; {b.entityCount} records
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => backup && backupManager.downloadBackup(backup)}
                          className="text-xs text-brand-600 hover:underline"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => backup && handleRestore(backup)}
                          disabled={restoring}
                          className="text-xs text-amber-600 hover:underline disabled:opacity-50"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              open: true,
                              title: 'Delete Backup',
                              message: `Are you sure you want to delete "${b.name}"? This cannot be undone.`,
                              variant: 'danger',
                              onConfirm: () => {
                                backupManager.deleteLocalBackup(b.id);
                                setBackups(backupManager.listLocalBackups());
                              },
                            });
                          }}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        loading={restoring}
      />
    </div>
  );
}
