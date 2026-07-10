export type ConflictResolution = 'local_won' | 'remote_won' | 'merged';

export interface ConflictRecord {
  entityType: string;
  entityId: string;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  mergedData: Record<string, unknown>;
  resolution: ConflictResolution;
  resolvedAt: string;
  strategy: string;
}

export interface ConflictStrategy {
  name: string;
  resolve(
    local: Record<string, unknown>,
    remote: Record<string, unknown>,
    entityType: string,
    entityId: string,
  ): { data: Record<string, unknown>; resolution: ConflictResolution };
}

export class VersionStrategy implements ConflictStrategy {
  name = 'version';

  resolve(
    local: Record<string, unknown>,
    remote: Record<string, unknown>,
    _entityType: string,
    _entityId: string,
  ): { data: Record<string, unknown>; resolution: ConflictResolution } {
    const localVersion = (local.version as number) ?? 0;
    const remoteVersion = (remote.version as number) ?? 0;

    if (localVersion > remoteVersion) {
      return { data: local, resolution: 'local_won' };
    }
    if (remoteVersion > localVersion) {
      return { data: remote, resolution: 'remote_won' };
    }
    return { data: local, resolution: 'local_won' };
  }
}

export class TimestampStrategy implements ConflictStrategy {
  name = 'timestamp';

  resolve(
    local: Record<string, unknown>,
    remote: Record<string, unknown>,
    _entityType: string,
    _entityId: string,
  ): { data: Record<string, unknown>; resolution: ConflictResolution } {
    const localUpdated = local.updated_at as string | undefined;
    const remoteUpdated = remote.updated_at as string | undefined;

    if (!localUpdated && !remoteUpdated) {
      return { data: remote, resolution: 'remote_won' };
    }
    if (!localUpdated) {
      return { data: remote, resolution: 'remote_won' };
    }
    if (!remoteUpdated) {
      return { data: local, resolution: 'local_won' };
    }
    if (remoteUpdated > localUpdated) {
      return { data: remote, resolution: 'remote_won' };
    }
    return { data: local, resolution: 'local_won' };
  }
}

export class VersionThenTimestampStrategy implements ConflictStrategy {
  name = 'version-then-timestamp';
  private version = new VersionStrategy();
  private timestamp = new TimestampStrategy();

  resolve(
    local: Record<string, unknown>,
    remote: Record<string, unknown>,
    entityType: string,
    entityId: string,
  ): { data: Record<string, unknown>; resolution: ConflictResolution } {
    const versionResult = this.version.resolve(local, remote, entityType, entityId);
    if (versionResult.resolution !== 'local_won') return versionResult;

    const localVersion = (local.version as number) ?? 0;
    const remoteVersion = (remote.version as number) ?? 0;
    if (localVersion !== remoteVersion) return versionResult;

    return this.timestamp.resolve(local, remote, entityType, entityId);
  }
}

export class ConflictResolver {
  private strategies: ConflictStrategy[] = [];
  private conflicts: ConflictRecord[] = [];
  private activeStrategy: ConflictStrategy;

  constructor() {
    this.activeStrategy = new VersionThenTimestampStrategy();
    this.strategies.push(this.activeStrategy);
  }

  setStrategy(strategy: ConflictStrategy): void {
    this.activeStrategy = strategy;
    if (!this.strategies.find((s) => s.name === strategy.name)) {
      this.strategies.push(strategy);
    }
  }

  registerStrategy(strategy: ConflictStrategy): void {
    this.strategies.push(strategy);
  }

  getStrategies(): ConflictStrategy[] {
    return [...this.strategies];
  }

  getActiveStrategy(): ConflictStrategy {
    return this.activeStrategy;
  }

  resolve(
    local: Record<string, unknown>,
    remote: Record<string, unknown>,
    entityType: string,
    entityId: string,
  ): { data: Record<string, unknown>; resolution: ConflictResolution } {
    const result = this.activeStrategy.resolve(local, remote, entityType, entityId);

    this.conflicts.push({
      entityType,
      entityId,
      localData: local,
      remoteData: remote,
      mergedData: result.data,
      resolution: result.resolution,
      resolvedAt: new Date().toISOString(),
      strategy: this.activeStrategy.name,
    });

    return result;
  }

  mergeArrays(
    local: Record<string, unknown>[],
    remote: Record<string, unknown>[],
    entityType: string,
    idKey: string = 'id',
  ): { merged: Record<string, unknown>[]; conflicts: ConflictRecord[] } {
    const localMap = new Map<string, Record<string, unknown>>();
    for (const item of local) {
      const id = item[idKey] as string;
      if (id) localMap.set(id, item);
    }

    for (const remoteItem of remote) {
      const id = remoteItem[idKey] as string;
      if (!id) continue;

      const localItem = localMap.get(id);
      if (!localItem) {
        localMap.set(id, remoteItem);
      } else {
        const result = this.resolve(localItem, remoteItem, entityType, id);
        localMap.set(id, result.data);
      }
    }

    return { merged: Array.from(localMap.values()), conflicts: this.getConflicts() };
  }

  getConflicts(): ConflictRecord[] {
    return [...this.conflicts];
  }

  clearConflicts(): void {
    this.conflicts = [];
  }
}

export const conflictResolver = new ConflictResolver();
