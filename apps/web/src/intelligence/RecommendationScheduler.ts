import type { ProactiveAlert, Recommendation, IntelligenceInput } from './types';
import { generateAlerts } from './AlertEngine';
import { generateRecommendations } from './RecommendationEngine';

const STORAGE_KEY_ALERTS = 'budgetos_alerts';
const STORAGE_KEY_RECS = 'budgetos_recommendations';
const STORAGE_KEY_LAST_GEN = 'budgetos_last_intelligence_gen';

export function generateIntelligence(input: IntelligenceInput): {
  alerts: ProactiveAlert[];
  recommendations: Recommendation[];
} {
  const alerts = generateAlerts(input);
  const recommendations = generateRecommendations(input);

  const mergedAlerts = mergeWithStored(alerts, loadStoredAlerts());
  const mergedRecs = mergeWithStoredRecs(recommendations, loadStoredRecs());

  saveAlerts(mergedAlerts);
  saveRecs(mergedRecs);
  saveLastGenerated();

  return { alerts: mergedAlerts, recommendations: mergedRecs };
}

export function loadStoredAlerts(): ProactiveAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALERTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAlerts(alerts: ProactiveAlert[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts));
  } catch { /* ignore */ }
}

export function loadStoredRecs(): Recommendation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecs(recs: Recommendation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_RECS, JSON.stringify(recs));
  } catch { /* ignore */ }
}

export function shouldRegenerate(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_GEN);
    if (!raw) return true;
    const lastGen = parseInt(raw, 10);
    return Date.now() - lastGen > 30 * 60 * 1000;
  } catch {
    return true;
  }
}

export function getLastGeneratedTime(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_GEN);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

function mergeWithStored(
  fresh: ProactiveAlert[],
  stored: ProactiveAlert[],
): ProactiveAlert[] {
  const storedMap = new Map(stored.map((a) => [a.id, a]));
  for (const alert of fresh) {
    const existing = storedMap.get(alert.id);
    if (existing) {
      alert.read = existing.read;
      alert.dismissed = existing.dismissed;
    }
    storedMap.set(alert.id, alert);
  }
  return Array.from(storedMap.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

function mergeWithStoredRecs(
  fresh: Recommendation[],
  stored: Recommendation[],
): Recommendation[] {
  const storedMap = new Map(stored.map((r) => [r.id, r]));
  for (const rec of fresh) {
    const existing = storedMap.get(rec.id);
    if (existing) {
      rec.dismissed = existing.dismissed;
      rec.applied = existing.applied;
    }
    storedMap.set(rec.id, rec);
  }
  return Array.from(storedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function saveLastGenerated(): void {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_GEN, String(Date.now()));
  } catch { /* ignore */ }
}
