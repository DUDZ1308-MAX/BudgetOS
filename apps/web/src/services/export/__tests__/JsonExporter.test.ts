import { describe, it, expect } from 'vitest';
import { jsonExporter } from '@/services/export/JsonExporter';

describe('JsonExporter', () => {
  it('builds export data with entities', () => {
    const data = jsonExporter.buildExport(
      [{ id: 1, amount: 50 }],
      [{ id: 1, name: 'Test' }],
      [],
      [],
      [],
    );
    expect(data.transactions).toHaveLength(1);
    expect(data.categories).toHaveLength(1);
    expect(data._exportedAt).toBeDefined();
    expect(data._version).toBe('1.0');
  });

  it('generates JSON string', () => {
    const data = jsonExporter.buildExport([], [], [], [], []);
    const { json } = jsonExporter.export(data, 'backup.json', false);
    const parsed = JSON.parse(json);
    expect(parsed._version).toBe('1.0');
  });

  it('pretty-prints JSON by default', () => {
    const data = jsonExporter.buildExport([], [], [], [], []);
    const { json } = jsonExporter.export(data);
    expect(json).toContain('\n');
  });

  it('returns blob with correct MIME type', () => {
    const data = jsonExporter.buildExport([], [], [], [], []);
    const { blob } = jsonExporter.export(data);
    expect(blob.type).toBe('application/json;charset=utf-8;');
  });

  it('generates filename with date if not provided', () => {
    const data = jsonExporter.buildExport([], [], [], [], []);
    const { filename } = jsonExporter.export(data);
    expect(filename).toMatch(/mybudgetos_backup_\d{4}-\d{2}-\d{2}\.json/);
  });

  it('uses provided filename', () => {
    const data = jsonExporter.buildExport([], [], [], [], []);
    const { filename } = jsonExporter.export(data, 'my_data.json');
    expect(filename).toBe('my_data.json');
  });
});
