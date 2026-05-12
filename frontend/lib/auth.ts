/**
 * Session helpers (Hades Wave 3).
 *
 * Reads session state from the backend `/api/auth/github/session` introspect
 * endpoint. The session cookie itself is HTTP-only (set by the backend),
 * so the frontend can never read it directly; introspect call hops through
 * the backend which validates the JWT and returns claims.
 *
 * Contracts:
 *   _meta/contracts/hestia-to-hades.md (Section 'Frontend session contract')
 *   _meta/handoff_log/wave1_hestia_to_hades.md
 */

export interface SessionUser {
  authenticated: true;
  githubLogin: string;
  githubId: number;
  avatarUrl: string;
  scopes: string[];
}

export interface SessionAnonymous {
  authenticated: false;
}

export type Session = SessionUser | SessionAnonymous;

const SESSION_ENDPOINT = "/api/auth/github/session";

function backendBase(): string {
  const fromEnv =
    typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL
      : "";
  return fromEnv.replace(/\/$/, "");
}

/**
 * Server Component helper (Next.js App Router).
 *
 * Reads the session cookie from the inbound request via the FastAPI backend
 * introspect endpoint. Same-origin in production via NGINX ingress so cookies
 * forward automatically; for local dev the backend allows
 * credentialed CORS from http://localhost:3000 + 3100.
 */
export async function getSession(): Promise<Session> {
  const base = backendBase();
  const url = `${base}${SESSION_ENDPOINT}`;
  try {
    const resp = await fetch(url, {
      // Cookies forward automatically only when fetch runs with `credentials`
      // in browser. Server Components forwarding cookies require an explicit
      // header via next/headers in the route handler that calls this; the
      // upstream caller is responsible for providing cookie context when
      // executing in Server Component scope.
      credentials: "include",
      cache: "no-store",
    });
    if (resp.status !== 200) {
      return { authenticated: false };
    }
    const data = (await resp.json()) as {
      authenticated: boolean;
      githubLogin?: string;
      githubId?: number;
      avatarUrl?: string;
      scopes?: string[];
    };
    if (!data.authenticated) return { authenticated: false };
    return {
      authenticated: true,
      githubLogin: data.githubLogin ?? "",
      githubId: data.githubId ?? 0,
      avatarUrl: data.avatarUrl ?? "",
      scopes: data.scopes ?? [],
    };
  } catch {
    return { authenticated: false };
  }
}

/**
 * Client hook (no React import; consumers wrap in a state hook if reactivity
 * needed). For Wave 3 hackathon scope the session shape is read-once after
 * mount; reactive updates are not required because the redirect chain on
 * login forces a full page reload to /city.
 */
export async function fetchSession(): Promise<Session> {
  return getSession();
}
