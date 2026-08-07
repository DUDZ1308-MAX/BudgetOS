export interface CheckoutResult {
  success: boolean;
  url?: string;
  /** Present when the server routed an existing subscriber to the portal. */
  portalUrl?: string;
  alreadySubscribed?: boolean;
  sessionId?: string;
  error?: string;
}

export interface PortalResult {
  success: boolean;
  url?: string;
  error?: string;
}
