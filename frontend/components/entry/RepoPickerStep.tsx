"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";

// Hestia Wave-Fixing cycle 1 (E-3 HIGH rescue):
//
// Repository picker UI rendered at /start/pick-repo after OAuth completes.
// Three navigation outcomes from this screen:
//
//   1. Pick from user's GitHub repos.
//      Fetches GET /api/repos/list (Hestia E-3 endpoint, reads encrypted
//      OAuth token from oauth_access_token_enc cookie set by callback).
//      Selecting a row navigates to /city?repo=<full_name>.
//
//   2. Paste a repository URL or owner/name.
//      Free-text input that validates owner/name and navigates to
//      /city?repo=<full_name>.
//
//   3. Use a demo dataset.
//      Two curated repos (NodeGoat fork + fastapi-template) for panitia
//      to explore without needing GitHub data. Navigates to
//      /city?demo=<key>.
//
// Lock 5 (honest claim): when the /api/repos/list endpoint returns 401 or 502,
// the UI surfaces an explicit fallback state pointing the user at demo
// datasets rather than silently masking the failure.

interface RepoSummary {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string | null;
}

type FetchState =
  | { kind: "loading" }
  | { kind: "ready"; repos: RepoSummary[] }
  | { kind: "unauthenticated" }
  | { kind: "error"; message: string };

const DEMO_DATASETS = [
  {
    key: "nodegoat",
    label: "OWASP NodeGoat",
    description:
      "Insecure Node.js training app. Used by Argus for the security demo.",
  },
  {
    key: "fastapi-template",
    label: "fastapi/full-stack-fastapi-template",
    description:
      "Reference FastAPI + React full-stack project. Used by Apollo for the health demo.",
  },
] as const;

const REPO_NAME_RE = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;

function parseRepoInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Accept full GitHub URL or owner/name shorthand.
  if (trimmed.startsWith("https://github.com/")) {
    const rest = trimmed
      .replace(/^https:\/\/github\.com\//, "")
      .replace(/\.git$/, "")
      .replace(/\/$/, "");
    return REPO_NAME_RE.test(rest) ? rest : null;
  }
  return REPO_NAME_RE.test(trimmed) ? trimmed : null;
}

export function RepoPickerStep() {
  const [state, setState] = useState<FetchState>({ kind: "loading" });
  const [search, setSearch] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
    const url = `${apiBase}/api/repos/list`;

    void (async () => {
      try {
        const resp = await fetch(url, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (cancelled) return;
        if (resp.status === 401) {
          setState({ kind: "unauthenticated" });
          return;
        }
        if (!resp.ok) {
          setState({
            kind: "error",
            message: `repo list failed: status ${resp.status}`,
          });
          return;
        }
        const data = (await resp.json()) as RepoSummary[];
        setState({ kind: "ready", repos: data });
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "unknown network error";
        setState({ kind: "error", message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRepos = useMemo(() => {
    if (state.kind !== "ready") return [];
    const q = search.trim().toLowerCase();
    if (!q) return state.repos;
    return state.repos.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q) ||
        (r.language ?? "").toLowerCase().includes(q),
    );
  }, [state, search]);

  const navigateToCity = useCallback((repoFullName: string) => {
    window.location.href = `/city?repo=${encodeURIComponent(repoFullName)}`;
  }, []);

  const navigateToDemo = useCallback((key: string) => {
    window.location.href = `/city?demo=${encodeURIComponent(key)}&mock_auth=true`;
  }, []);

  const onManualSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const parsed = parseRepoInput(manualInput);
      if (!parsed) {
        setManualError(
          "expected owner/name or https://github.com/owner/name URL",
        );
        return;
      }
      setManualError(null);
      navigateToCity(parsed);
    },
    [manualInput, navigateToCity],
  );

  return (
    <main
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "48px 24px 80px",
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}
    >
      <header style={{ textAlign: "center" }}>
        <div
          style={{
            font: "500 11px/1 'JetBrains Mono', monospace",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "oklch(0.78 0.14 55)",
            marginBottom: 14,
          }}
        >
          oauth complete . pick a repository
        </div>
        <h1
          style={{
            font: "400 clamp(28px, 4.2vw, 48px)/1.12 'Space Grotesk', sans-serif",
            letterSpacing: "-0.02em",
            margin: 0,
            color: "oklch(0.96 0.015 80)",
          }}
        >
          Which codebase{" "}
          <span style={{ color: "oklch(0.78 0.14 55)" }}>becomes a city</span>?
        </h1>
        <p
          style={{
            font: "400 14px/1.55 'JetBrains Mono', monospace",
            color: "oklch(0.7 0.03 75)",
            margin: "16px auto 0",
            maxWidth: 560,
          }}
        >
          We render every module as a building, every commit as a footprint.
          Pick a repository you own or collaborate on, paste a URL, or fall
          back to a demo dataset.
        </p>
      </header>

      {state.kind === "loading" && (
        <PickerStatus message="loading your repositories from GitHub . ." />
      )}

      {state.kind === "unauthenticated" && (
        <PickerStatus
          message="oauth session not detected. The OAuth flow may have expired or the cookie was cleared. Return to /start and reconnect, or jump straight into a demo dataset below."
          variant="warn"
        />
      )}

      {state.kind === "error" && (
        <PickerStatus
          message={`could not reach /api/repos/list (${state.message}). Use a demo dataset or paste a repository URL manually.`}
          variant="warn"
        />
      )}

      {state.kind === "ready" && (
        <section
          style={{
            background: "oklch(0.16 0.02 60 / 0.6)",
            border: "1px solid oklch(0.3 0.04 60 / 0.5)",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <h2
              style={{
                margin: 0,
                font: "500 18px/1.2 'Space Grotesk', sans-serif",
                color: "oklch(0.92 0.04 80)",
              }}
            >
              Your repositories
              <span
                style={{
                  marginLeft: 10,
                  font: "400 12px/1 'JetBrains Mono', monospace",
                  color: "oklch(0.65 0.03 75)",
                }}
              >
                {state.repos.length} found
              </span>
            </h2>
            <input
              type="search"
              placeholder="filter by name or language . ."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                ...inputStyle,
                width: 280,
              }}
            />
          </div>

          {filteredRepos.length === 0 ? (
            <p
              style={{
                font: "400 13px/1.5 'JetBrains Mono', monospace",
                color: "oklch(0.65 0.03 75)",
                margin: 0,
              }}
            >
              no repositories match "{search}". Clear the filter to see all
              {" "}
              {state.repos.length} repos.
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                maxHeight: 420,
                overflowY: "auto",
              }}
            >
              {filteredRepos.map((repo) => (
                <li key={repo.id}>
                  <button
                    type="button"
                    onClick={() => navigateToCity(repo.full_name)}
                    style={repoRowButtonStyle}
                    aria-label={`Render city for ${repo.full_name}`}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            font: "600 14px/1.2 'Space Grotesk', sans-serif",
                            color: "oklch(0.96 0.015 80)",
                          }}
                        >
                          {repo.full_name}
                        </span>
                        {repo.private && (
                          <span style={badgeStyle("priv")}>private</span>
                        )}
                        {repo.language && (
                          <span style={badgeStyle("lang")}>{repo.language}</span>
                        )}
                      </div>
                      {repo.description && (
                        <span
                          style={{
                            font: "400 12px/1.45 'JetBrains Mono', monospace",
                            color: "oklch(0.7 0.03 75)",
                          }}
                        >
                          {repo.description}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        font: "500 12px/1 'Space Grotesk', sans-serif",
                        color: "oklch(0.78 0.14 55)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      render city {"→"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section
        style={{
          background: "oklch(0.16 0.02 60 / 0.4)",
          border: "1px solid oklch(0.3 0.04 60 / 0.4)",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2
          style={{
            margin: "0 0 12px 0",
            font: "500 16px/1.2 'Space Grotesk', sans-serif",
            color: "oklch(0.92 0.04 80)",
          }}
        >
          Or paste a repository URL
        </h2>
        <form
          onSubmit={onManualSubmit}
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="owner/name or https://github.com/owner/name"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            style={{ ...inputStyle, flex: "1 1 360px", minWidth: 0 }}
            aria-label="repository owner/name or URL"
          />
          <button type="submit" style={primaryButtonStyle}>
            Render this repo {"→"}
          </button>
        </form>
        {manualError && (
          <p
            style={{
              margin: "10px 0 0",
              font: "400 12px/1.45 'JetBrains Mono', monospace",
              color: "oklch(0.7 0.16 30)",
            }}
          >
            {manualError}
          </p>
        )}
      </section>

      <section
        style={{
          background: "oklch(0.16 0.02 60 / 0.4)",
          border: "1px solid oklch(0.3 0.04 60 / 0.4)",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2
          style={{
            margin: "0 0 4px 0",
            font: "500 16px/1.2 'Space Grotesk', sans-serif",
            color: "oklch(0.92 0.04 80)",
          }}
        >
          Or use a demo dataset
        </h2>
        <p
          style={{
            margin: "0 0 14px",
            font: "400 12px/1.5 'JetBrains Mono', monospace",
            color: "oklch(0.65 0.03 75)",
          }}
        >
          Pre-parsed datasets the residents already know. No GitHub call.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {DEMO_DATASETS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => navigateToDemo(d.key)}
              style={demoCardButtonStyle}
              aria-label={`Load demo dataset ${d.label}`}
            >
              <span
                style={{
                  font: "600 14px/1.2 'Space Grotesk', sans-serif",
                  color: "oklch(0.96 0.015 80)",
                }}
              >
                {d.label}
              </span>
              <span
                style={{
                  font: "400 12px/1.45 'JetBrains Mono', monospace",
                  color: "oklch(0.7 0.03 75)",
                }}
              >
                {d.description}
              </span>
              <span
                style={{
                  font: "500 12px/1 'Space Grotesk', sans-serif",
                  color: "oklch(0.78 0.14 55)",
                  marginTop: 6,
                }}
              >
                load demo {"→"}
              </span>
            </button>
          ))}
        </div>
      </section>

      <footer
        style={{
          textAlign: "center",
          font: "400 11px/1.5 'JetBrains Mono', monospace",
          color: "oklch(0.55 0.03 75)",
        }}
      >
        <a
          href="/start"
          style={{
            color: "oklch(0.65 0.06 75)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          back to entry
        </a>
      </footer>
    </main>
  );
}

const inputStyle: CSSProperties = {
  appearance: "none",
  background: "oklch(0.12 0.02 60)",
  border: "1px solid oklch(0.3 0.04 60 / 0.7)",
  borderRadius: 6,
  padding: "10px 12px",
  color: "oklch(0.96 0.015 80)",
  font: "400 13px/1.2 'JetBrains Mono', monospace",
};

const primaryButtonStyle: CSSProperties = {
  appearance: "none",
  cursor: "pointer",
  background: "linear-gradient(180deg, oklch(0.78 0.16 60), oklch(0.55 0.16 45))",
  color: "oklch(0.13 0.03 40)",
  border: "1px solid oklch(0.6 0.18 50)",
  borderRadius: 6,
  padding: "10px 16px",
  font: "600 13px/1 'Space Grotesk', sans-serif",
  letterSpacing: "0.01em",
};

const repoRowButtonStyle: CSSProperties = {
  appearance: "none",
  cursor: "pointer",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  textAlign: "left",
  background: "oklch(0.18 0.02 60 / 0.7)",
  border: "1px solid oklch(0.3 0.04 60 / 0.4)",
  borderRadius: 8,
  padding: "12px 16px",
  color: "inherit",
};

const demoCardButtonStyle: CSSProperties = {
  appearance: "none",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 6,
  textAlign: "left",
  background: "oklch(0.18 0.02 60 / 0.7)",
  border: "1px solid oklch(0.3 0.04 60 / 0.4)",
  borderRadius: 8,
  padding: "14px 16px",
  color: "inherit",
};

function badgeStyle(kind: "priv" | "lang"): CSSProperties {
  const palette =
    kind === "priv"
      ? { bg: "oklch(0.3 0.08 30 / 0.6)", fg: "oklch(0.85 0.12 60)" }
      : { bg: "oklch(0.3 0.06 220 / 0.4)", fg: "oklch(0.85 0.08 220)" };
  return {
    display: "inline-block",
    padding: "2px 8px",
    background: palette.bg,
    color: palette.fg,
    font: "500 10px/1.4 'JetBrains Mono', monospace",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    borderRadius: 999,
  };
}

function PickerStatus({
  message,
  variant = "info",
}: {
  message: string;
  variant?: "info" | "warn";
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background:
          variant === "warn"
            ? "oklch(0.22 0.06 50 / 0.4)"
            : "oklch(0.18 0.02 60 / 0.5)",
        border:
          "1px solid " +
          (variant === "warn"
            ? "oklch(0.55 0.12 50 / 0.5)"
            : "oklch(0.3 0.04 60 / 0.5)"),
        borderRadius: 10,
        padding: "16px 18px",
        font: "400 13px/1.5 'JetBrains Mono', monospace",
        color: variant === "warn" ? "oklch(0.88 0.08 60)" : "oklch(0.75 0.03 75)",
      }}
    >
      {message}
    </div>
  );
}
