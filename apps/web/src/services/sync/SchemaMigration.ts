const SCHEMA_VERSION_KEY = 'budgetos-schema-version';
const CURRENT_SCHEMA_VERSION = 2;

interface Migration {
  version: number;
  name: string;
  migrate: () => Promise<void>;
}

export class SchemaMigration {
  private migrations: Migration[] = [];
  private currentVersion: number = 0;

  constructor() {
    this.loadVersion();
  }

  register(migration: Migration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }

  async runPending(): Promise<{ applied: number; currentVersion: number }> {
    const pending = this.migrations.filter((m) => m.version > this.currentVersion);
    let applied = 0;

    for (const migration of pending) {
      try {
        if (import.meta.env.DEV) console.debug(`[SchemaMigration] Running v${migration.version}: ${migration.name}`);
        await migration.migrate();
        this.currentVersion = migration.version;
        this.saveVersion();
        applied++;
      } catch (err) {
        console.error(`[SchemaMigration] Failed v${migration.version}: ${migration.name}`, err);
        throw err;
      }
    }

    return { applied, currentVersion: this.currentVersion };
  }

  async ensureUpToDate(): Promise<void> {
    if (this.currentVersion < CURRENT_SCHEMA_VERSION) {
      await this.runPending();
    }
  }

  getCurrentVersion(): number {
    return this.currentVersion;
  }

  getLatestVersion(): number {
    return CURRENT_SCHEMA_VERSION;
  }

  needsMigration(): boolean {
    return this.currentVersion < CURRENT_SCHEMA_VERSION;
  }

  private loadVersion(): void {
    try {
      const raw = localStorage.getItem(SCHEMA_VERSION_KEY);
      this.currentVersion = raw ? parseInt(raw, 10) : 0;
    } catch {
      this.currentVersion = 0;
    }
  }

  private saveVersion(): void {
    try {
      localStorage.setItem(SCHEMA_VERSION_KEY, String(this.currentVersion));
    } catch {
      if (import.meta.env.DEV) console.error('[SchemaMigration] Failed to persist version');
    }
  }

  reset(): void {
    this.currentVersion = 0;
    this.saveVersion();
  }
}

export const schemaMigration = new SchemaMigration();
