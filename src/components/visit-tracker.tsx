import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { logVisit } from "@/lib/visits.functions";

function sessionId(): string {
  try {
    let id = sessionStorage.getItem("ds_sid");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("ds_sid", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/** Fire-and-forget visitor logging on every storefront navigation. */
export function VisitTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const t = setTimeout(() => {
      const data = {
        path: pathname,
        referrer: document.referrer || null,
        language: navigator.language || null,
        sessionId: sessionId(),
      };
      const onCpanel = window.location.hostname === "dreamebeautycosmetics.com" ||
        window.location.hostname === "www.dreamebeautycosmetics.com";
      if (onCpanel) {
        fetch("/api/visits.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          keepalive: true,
        }).catch(() => {});
      } else {
        logVisit({ data }).catch(() => {});
      }
    }, 300);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
