/** Which active homepage image the administrator selected as primary.
 * It is a separate preference: choosing a photo never deletes or deactivates the others.
 */
export const HOMEPAGE_PREFERRED_BANNER_KEY = "homepage-preferred-banner";
export const HOMEPAGE_PREFERRED_BANNER_QUERY_KEY = ["homepage-preferred-banner"] as const;

export function readPreferredBannerId(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const id = (value as Record<string, unknown>).slide_id;
  return typeof id === "string" && id.length > 0 && id.length <= 128 ? id : null;
}
