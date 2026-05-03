/**
 * Safe in-app path from ?redirect= (open-redirect hardening).
 */
export function getSafeRedirectPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return null;
  }
  return raw;
}
