// Cashier display name helpers — receipts show a person's name, never an email.

const KEY = "pos_cashier_name";

/** Turn an email into a readable name fallback: "veq.kqyre@x.com" -> "Veq Kqyre" */
export function nameFromEmail(email?: string | null) {
  const local = String(email ?? "").split("@")[0];
  if (!local) return "";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\d+/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getCashierName() {
  try {
    return localStorage.getItem(KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function setCashierName(name: string) {
  try {
    if (name.trim()) localStorage.setItem(KEY, name.trim());
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Name to print/show for a cashier. */
export function cashierDisplay(email?: string | null, name?: string | null) {
  return (name ?? "").trim() || nameFromEmail(email) || "—";
}
