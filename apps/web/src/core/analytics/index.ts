import { logger } from '@/core/logger';

export type AnalyticEventName =
  | 'page_view'
  | 'signup'
  | 'login'
  | 'logout'
  | 'feature_used'
  | 'ai_request'
  | 'export_download'
  | 'backup_created'
  | 'feedback_submitted'
  | 'demo_entered'
  | 'demo_exited'
  | 'upgrade_started'
  | 'subscription_changed'
  | 'error_occurred';

export interface AnalyticEvent {
  name: AnalyticEventName;
  properties?: Record<string, string | number | boolean | undefined>;
  timestamp: string;
}

export interface AnalyticsProvider {
  identify(userId: string, traits?: Record<string, unknown>): void;
  track(event: AnalyticEvent): void;
  page(name: string, properties?: Record<string, unknown>): void;
  reset(): void;
}

class NoopAnalyticsProvider implements AnalyticsProvider {
  identify(): void {}
  track(): void {}
  page(): void {}
  reset(): void {}
}

class ConsoleAnalyticsProvider implements AnalyticsProvider {
  identify(userId: string, traits?: Record<string, unknown>): void {
    if (import.meta.env.DEV) {
      logger.debug(`[Analytics] Identify: ${userId}`, 'Analytics', traits as Record<string, unknown>);
    }
  }

  track(event: AnalyticEvent): void {
    if (import.meta.env.DEV) {
      logger.debug(`[Analytics] Track: ${event.name}`, 'Analytics', event.properties as Record<string, unknown>);
    }
  }

  page(name: string, properties?: Record<string, unknown>): void {
    if (import.meta.env.DEV) {
      logger.debug(`[Analytics] Page: ${name}`, 'Analytics', properties as Record<string, unknown>);
    }
  }

  reset(): void {
    if (import.meta.env.DEV) {
      logger.debug('[Analytics] Reset', 'Analytics');
    }
  }
}

export class PostHogProvider implements AnalyticsProvider {
  private posthog: { identify: Function; capture: Function; reset: Function } | null = null;

  constructor(apiKey?: string) {
    if (apiKey && typeof window !== 'undefined') {
      try {
        const posthog = (window as any).posthog;
        if (posthog) {
          posthog.init(apiKey, { api_host: 'https://app.posthog.com' });
          this.posthog = posthog;
          logger.info('PostHog analytics initialized', 'Analytics');
        }
      } catch {
        logger.warn('Failed to initialize PostHog', 'Analytics');
      }
    }
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    this.posthog?.identify(userId, traits);
  }

  track(event: AnalyticEvent): void {
    this.posthog?.capture(event.name, { ...event.properties, $timestamp: event.timestamp });
  }

  page(name: string, properties?: Record<string, unknown>): void {
    this.posthog?.capture('$pageview', { $current_url: name, ...properties });
  }

  reset(): void {
    this.posthog?.reset();
  }
}

export class GoogleAnalyticsProvider implements AnalyticsProvider {
  private ga: Function | null = null;

  constructor(measurementId?: string) {
    if (measurementId && typeof window !== 'undefined') {
      try {
        const ga = (window as any).gtag;
        if (ga) {
          ga('config', measurementId);
          this.ga = ga;
          logger.info('Google Analytics initialized', 'Analytics');
        }
      } catch {
        logger.warn('Failed to initialize Google Analytics', 'Analytics');
      }
    }
  }

  identify(userId: string): void {
    this.ga?.('set', 'user_id', userId);
  }

  track(event: AnalyticEvent): void {
    this.ga?.('event', event.name, event.properties);
  }

  page(name: string): void {
    this.ga?.('config', 'G-XXXXXXXXXX', { page_path: name });
  }

  reset(): void {
    this.ga?.('set', 'user_id', null);
  }
}

export class PlausibleProvider implements AnalyticsProvider {
  private plausible: Function | null = null;

  constructor(domain?: string) {
    if (domain && typeof window !== 'undefined') {
      try {
        const plausible = (window as any).plausible;
        if (plausible) {
          this.plausible = plausible;
          logger.info('Plausible analytics initialized', 'Analytics', { domain });
        }
      } catch {
        logger.warn('Failed to initialize Plausible', 'Analytics');
      }
    }
  }

  identify(): void {}

  track(event: AnalyticEvent): void {
    this.plausible?.(event.name, { props: event.properties });
  }

  page(name: string): void {
    this.plausible?.('pageview', { u: name });
  }

  reset(): void {}
}

class Analytics {
  private provider: AnalyticsProvider = ANALYTICS_ENABLED
    ? new ConsoleAnalyticsProvider()
    : new NoopAnalyticsProvider();

  setProvider(provider: AnalyticsProvider): void {
    this.provider = provider;
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    this.provider.identify(userId, traits);
  }

  track(name: AnalyticEventName, properties?: Record<string, string | number | boolean | undefined>): void {
    this.provider.track({ name, properties, timestamp: new Date().toISOString() });
  }

  page(name: string, properties?: Record<string, unknown>): void {
    this.provider.page(name, properties);
  }

  reset(): void {
    this.provider.reset();
  }

  initPostHog(apiKey: string): void {
    this.setProvider(new PostHogProvider(apiKey));
  }

  initGoogleAnalytics(measurementId: string): void {
    this.setProvider(new GoogleAnalyticsProvider(measurementId));
  }

  initPlausible(domain: string): void {
    this.setProvider(new PlausibleProvider(domain));
  }
}

const ANALYTICS_ENABLED = import.meta.env.VITE_ANALYTICS_ENABLED !== 'false';

export const analytics = new Analytics();
