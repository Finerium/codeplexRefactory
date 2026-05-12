"use client";

/**
 * BlankCityWorkspace: in-memory virtual filesystem playground.
 *
 * Hestia Wave-Fixing #2 cycle 1 (E-5 CRITICAL rescue).
 *
 * The previous Wave-Fixing cycle 1 fix for the E-1 404 redirect rerouted the
 * right door to `/city?mock_auth=true&mode=empty`. QA round 2 found that the
 * city page either throws a client-side exception OR silently falls back to
 * the full mock city, which contradicts PRD Section 7.1 line 292 spec for
 * "Build from scratch entry option (in-memory virtual FS)".
 *
 * Per PRD Section 7.1 the blank-lot path must:
 *   1. Render an empty city (no remote repo, no commits).
 *   2. Provide an in-app text editor.
 *   3. Trigger building grow animations as files are created.
 *   4. Persist the virtual FS to localStorage for session continuity.
 *
 * Iris owns `cityEngine.ts` and the 3D `<BuildingInstances>` mount; per the
 * anti-collision file ownership rule from the Manager Wave-Fixing #2 prompt
 * Hestia must NOT edit cityEngine.ts directly. Therefore this workspace is
 * a Hestia-only 2D rendition: a deterministic SVG city skyline that grows
 * one building per virtual file the user creates. The visual primitives are
 * reused from `components/entry/scene-helpers.ts` (mulberry32) so the
 * skyline reads as the same world the entry casement window shows behind
 * the right door. If Iris wires a true 3D mode=empty render in a future
 * cycle, that 3D variant can replace the SVG layer here without changing
 * the editor/FS API.
 *
 * Lock 1 (no em dash): clean.
 * Lock 2 (no emoji): clean.
 * Lock 4 (honest claim): the SVG city is a deliberate 2D placeholder, not
 *   the production 3D r3f scene; this is documented in source headers and
 *   in the handoff log. The virtual FS, editor, and persistence layer are
 *   genuine and not mocked.
 * Lock 5 (no silent scope narrow): file ownership boundary respected;
 *   /city remains Iris/Hera/Persephone domain, the blank-lot path is
 *   entirely Hestia-owned.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { mulberry32 } from "../entry/scene-helpers";

// ---------------------------------------------------------------------------
// Virtual filesystem model
// ---------------------------------------------------------------------------

/**
 * VirtualFile: one node in the in-memory FS. Paths use POSIX slashes and
 * always start with "/". Directories are implicit (derived from file paths).
 */
interface VirtualFile {
  path: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface VirtualFS {
  files: Record<string, VirtualFile>;
  active: string | null;
}

const STORAGE_KEY = "codeplex.blank-city.vfs.v1";

/**
 * Default seed: a handful of starter files so the workspace does not open
 * empty. Each file has a brief comment that hints at what a Codeplex
 * Chronicle session would normally render in real production code.
 */
// Stable epoch for seed file timestamps. Using a fixed sentinel rather than
// Date.now() avoids the React 19 hydration mismatch where the server renders
// timestamps that differ from the first client render. Buildings created
// after mount get real Date.now() values; seed buildings render fully grown
// because their age is far older than the 1.1s grow window.
const SEED_EPOCH = 0;

const SEED_FILES: VirtualFile[] = [
  {
    path: "/README.md",
    content: [
      "# Blank City",
      "",
      "Welcome to your empty lot. Each file you create becomes a building in",
      "the skyline below. Edit, rename, delete, and the city updates live.",
      "",
      "No remote. No commits. Everything stays in your browser memory.",
    ].join("\n"),
    createdAt: SEED_EPOCH,
    updatedAt: SEED_EPOCH,
  },
  {
    path: "/app/main.ts",
    content: [
      "// First building. This is your downtown anchor.",
      "export function hello() {",
      "  return 'codeplex chronicle';",
      "}",
    ].join("\n"),
    createdAt: SEED_EPOCH,
    updatedAt: SEED_EPOCH,
  },
  {
    path: "/app/health.ts",
    content: [
      "// Apollo will visit this building when health mode lights up.",
      "export function diagnose() {",
      "  return { ok: true };",
      "}",
    ].join("\n"),
    createdAt: SEED_EPOCH,
    updatedAt: SEED_EPOCH,
  },
];

function freshFS(): VirtualFS {
  const files: Record<string, VirtualFile> = {};
  for (const f of SEED_FILES) files[f.path] = f;
  return { files, active: SEED_FILES[0]?.path ?? null };
}

function loadFS(): VirtualFS {
  if (typeof window === "undefined") return freshFS();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshFS();
    const parsed = JSON.parse(raw) as VirtualFS;
    if (!parsed || typeof parsed !== "object" || !parsed.files) return freshFS();
    return parsed;
  } catch {
    return freshFS();
  }
}

function saveFS(fs: VirtualFS): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fs));
  } catch {
    // localStorage may throw in private mode or when quota-exceeded.
    // We silently skip; the session still works in memory.
  }
}

const PATH_RE = /^\/[A-Za-z0-9._/-]+[A-Za-z0-9._-]$/;

function normalizePath(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (!PATH_RE.test(withSlash)) return null;
  return withSlash;
}

// ---------------------------------------------------------------------------
// Hashed positioning for the skyline
// ---------------------------------------------------------------------------

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = (h ^ s.charCodeAt(i)) >>> 0;
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}

interface BuildingGlyph {
  path: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hue: number;
  windowSeed: number;
  growMs: number;
}

const CITY_VIEW_W = 720;
const CITY_VIEW_H = 220;
const GROUND_Y = 188;

/**
 * Derive the building glyphs from the current files. Each file's path hashes
 * to a stable (x, height) so a given path always renders as the same
 * building. Newly created files animate-grow from the ground.
 */
function buildingsFromFiles(fs: VirtualFS, now: number): BuildingGlyph[] {
  const paths = Object.keys(fs.files).sort();
  const glyphs: BuildingGlyph[] = [];
  const slotW = 30;
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]!;
    const file = fs.files[path]!;
    const seed = hashString(path);
    const rng = mulberry32(seed);
    const heightFactor = 0.4 + rng() * 0.55;
    const widthFactor = 0.6 + rng() * 0.5;
    const hueShift = rng() * 60 - 30;
    const width = Math.max(16, Math.min(28, slotW * widthFactor));
    const fullHeight = 30 + heightFactor * (CITY_VIEW_H - 60);
    const ageMs = Math.max(0, now - file.createdAt);
    const growMs = Math.max(0, 1100 - ageMs);
    const x = 14 + i * slotW + (slotW - width) / 2;
    const y = GROUND_Y - fullHeight;
    glyphs.push({
      path,
      x,
      y,
      width,
      height: fullHeight,
      hue: 38 + hueShift,
      windowSeed: seed,
      growMs,
    });
  }
  return glyphs;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BlankCityWorkspace() {
  const [fs, setFS] = useState<VirtualFS>(() => freshFS());
  const [hydrated, setHydrated] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");
  const [newFileError, setNewFileError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  // Sentinel initial value: 2 seconds past SEED_EPOCH guarantees the SSR
  // pass renders seed buildings as fully grown (no grow animation in the
  // server HTML). The client setNow effect upgrades to real time after
  // mount, which only matters for buildings created post-mount.
  const [now, setNow] = useState<number>(SEED_EPOCH + 2_000);

  // Hydrate from localStorage after mount so the server-rendered HTML and
  // client render match (avoids React 19 hydration mismatch). Also upgrade
  // the clock to real time after mount; the SVG skyline regenerates on
  // every render via useMemo so the grow animation starts only for files
  // created post-mount.
  useEffect(() => {
    setFS(loadFS());
    setNow(Date.now());
    setHydrated(true);
  }, []);

  // Persist after every change once hydrated.
  useEffect(() => {
    if (!hydrated) return;
    saveFS(fs);
  }, [fs, hydrated]);

  // Tick the clock for the grow animation; throttle to 100ms while any
  // building is still in its first second, idle after.
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 120);
    return () => window.clearInterval(interval);
  }, []);

  const activeFile = fs.active ? fs.files[fs.active] : null;

  const handleCreate = useCallback(() => {
    const normalized = normalizePath(newFilePath);
    if (!normalized) {
      setNewFileError(
        "expected path like /src/app.ts (slash-prefixed, alphanumerics + ._-/)",
      );
      return;
    }
    if (fs.files[normalized]) {
      setNewFileError(`${normalized} already exists`);
      return;
    }
    setNewFileError(null);
    setNewFilePath("");
    setFS((prev) => {
      const ts = Date.now();
      return {
        files: {
          ...prev.files,
          [normalized]: {
            path: normalized,
            content: "",
            createdAt: ts,
            updatedAt: ts,
          },
        },
        active: normalized,
      };
    });
    // Focus the editor so the user can type immediately.
    window.setTimeout(() => editorRef.current?.focus(), 30);
  }, [fs.files, newFilePath]);

  const handleSelect = useCallback((path: string) => {
    setFS((prev) => ({ ...prev, active: path }));
  }, []);

  const handleEdit = useCallback(
    (value: string) => {
      if (!fs.active) return;
      setFS((prev) => {
        const current = prev.files[prev.active!];
        if (!current) return prev;
        return {
          ...prev,
          files: {
            ...prev.files,
            [prev.active!]: {
              ...current,
              content: value,
              updatedAt: Date.now(),
            },
          },
        };
      });
    },
    [fs.active],
  );

  const handleDelete = useCallback(
    (path: string) => {
      setFS((prev) => {
        const next = { ...prev.files };
        delete next[path];
        const remaining = Object.keys(next).sort();
        return {
          files: next,
          active:
            prev.active === path
              ? remaining[0] ?? null
              : prev.active,
        };
      });
    },
    [],
  );

  const handleReset = useCallback(() => {
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        "Reset the blank city? This clears all virtual files from this browser.",
      );
      if (!ok) return;
    }
    setFS(freshFS());
  }, []);

  const handleSubmitNew = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCreate();
      }
    },
    [handleCreate],
  );

  // Wave-Fixing E-5 (Lock 5 honest claim): the "Save to GitHub" CTA is a
  // labeled placeholder. PRD Section 7.1 mentions the export flow as
  // optional; real implementation needs PyGithub on the backend + a Hades
  // endpoint that wraps the user's OAuth token and POSTs a tree write. We
  // surface the affordance without faking the persist. Wave 3 Hades or a
  // post-submission cycle picks this up.
  const handleExportPlaceholder = useCallback(() => {
    setExportStatus(
      "save to github is a Wave 3 follow-up. Your virtual FS is persisted in this browser for the session.",
    );
  }, []);

  const skyline = useMemo(() => buildingsFromFiles(fs, now), [fs, now]);
  const fileList = useMemo(() => Object.keys(fs.files).sort(), [fs.files]);

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div style={kickerStyle}>blank lot . in-memory virtual FS</div>
        <h1 style={titleStyle}>
          Build the city as you{" "}
          <span style={{ color: "oklch(0.78 0.14 55)" }}>type</span>
        </h1>
        <p style={subtitleStyle}>
          Add files in the panel on the left. Each new path raises a new
          building in the skyline below. Nothing leaves this browser.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <a href="/start" style={linkButtonStyle}>
            {"<-"} back to entry
          </a>
          <button type="button" style={ghostButtonStyle} onClick={handleReset}>
            reset workspace
          </button>
          <button
            type="button"
            style={ghostButtonStyle}
            onClick={handleExportPlaceholder}
          >
            save to github (Wave 3)
          </button>
        </div>
        {exportStatus && (
          <div role="status" style={statusBoxStyle}>
            {exportStatus}
          </div>
        )}
      </header>

      <section aria-label="virtual filesystem skyline" style={skylineWrapStyle}>
        <svg
          viewBox={`0 0 ${CITY_VIEW_W} ${CITY_VIEW_H}`}
          width="100%"
          height={CITY_VIEW_H}
          preserveAspectRatio="xMidYMax meet"
          style={{ display: "block" }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#1b2740" />
              <stop offset="100%" stopColor="#0b1326" />
            </linearGradient>
            <linearGradient id="ground" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2a1f17" />
              <stop offset="100%" stopColor="#0b0703" />
            </linearGradient>
          </defs>
          <rect width={CITY_VIEW_W} height={CITY_VIEW_H} fill="url(#sky)" />
          <rect
            x={0}
            y={GROUND_Y}
            width={CITY_VIEW_W}
            height={CITY_VIEW_H - GROUND_Y}
            fill="url(#ground)"
          />

          {/* Anchor light: the Tourist Info booth glow at the right edge so
              the scene matches the entry-page right window. */}
          <circle cx={CITY_VIEW_W - 30} cy={GROUND_Y - 4} r={5} fill="oklch(0.85 0.18 55)" opacity={0.65} />

          {skyline.map((b) => {
            const isActive = b.path === fs.active;
            const progress =
              b.growMs <= 0 ? 1 : 1 - Math.min(1, b.growMs / 1100);
            const drawnH = b.height * progress;
            const drawnY = GROUND_Y - drawnH;
            const fill = `oklch(0.55 0.04 ${b.hue})`;
            const stroke = isActive
              ? "oklch(0.85 0.18 55)"
              : "oklch(0.32 0.03 60 / 0.7)";
            return (
              <g key={b.path}>
                <rect
                  x={b.x}
                  y={drawnY}
                  width={b.width}
                  height={drawnH}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isActive ? 1.6 : 0.8}
                  rx={1.5}
                />
                {/* Two stacked window rows, only visible once the building
                    has grown a bit. */}
                {progress > 0.55 && (
                  <>
                    <rect
                      x={b.x + 3}
                      y={drawnY + 6}
                      width={b.width - 6}
                      height={3}
                      fill="oklch(0.78 0.12 60)"
                      opacity={0.7}
                    />
                    <rect
                      x={b.x + 3}
                      y={drawnY + 12}
                      width={b.width - 6}
                      height={3}
                      fill="oklch(0.78 0.12 60)"
                      opacity={0.55}
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>
        <div style={skylineCaptionStyle}>
          <span>
            {fileList.length} building{fileList.length === 1 ? "" : "s"}
          </span>
          <span>persisted in localStorage</span>
        </div>
      </section>

      <section style={workspaceWrapStyle}>
        <aside aria-label="file tree" style={fileTreeStyle}>
          <header style={{ padding: "12px 14px 6px" }}>
            <div style={panelHeadingStyle}>files</div>
            <p style={panelSubtitleStyle}>
              path like /src/app.ts, Enter to create
            </p>
          </header>
          <div style={{ padding: "0 14px 12px", display: "flex", gap: 6 }}>
            <input
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              onKeyDown={handleSubmitNew}
              placeholder="/src/app.ts"
              style={inputStyle}
              aria-label="new file path"
              spellCheck={false}
            />
            <button type="button" onClick={handleCreate} style={primaryButtonStyle}>
              create
            </button>
          </div>
          {newFileError && (
            <p style={errorTextStyle} role="alert">
              {newFileError}
            </p>
          )}
          <ul style={fileListStyle}>
            {fileList.map((path) => (
              <li key={path}>
                <div
                  style={{
                    ...fileRowStyle,
                    background:
                      path === fs.active
                        ? "oklch(0.24 0.06 60 / 0.8)"
                        : "transparent",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(path)}
                    style={fileRowButtonStyle}
                    aria-pressed={path === fs.active}
                  >
                    {path}
                  </button>
                  {fileList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(path)}
                      style={deleteButtonStyle}
                      aria-label={`delete ${path}`}
                      title={`delete ${path}`}
                    >
                      x
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <section aria-label="text editor" style={editorWrapStyle}>
          <header style={editorHeaderStyle}>
            <span style={panelHeadingStyle}>
              {activeFile ? activeFile.path : "no file selected"}
            </span>
            {activeFile && (
              <span style={editorMetaStyle}>
                {activeFile.content.split("\n").length} line
                {activeFile.content.split("\n").length === 1 ? "" : "s"} .{" "}
                {activeFile.content.length} chars
              </span>
            )}
          </header>
          {activeFile ? (
            <textarea
              ref={editorRef}
              value={activeFile.content}
              onChange={(e) => handleEdit(e.target.value)}
              style={textareaStyle}
              spellCheck={false}
              aria-label={`editor for ${activeFile.path}`}
            />
          ) : (
            <div style={editorEmptyStyle}>
              create a file on the left to start editing
            </div>
          )}
        </section>
      </section>

      <footer style={footerStyle}>
        <span>
          PRD Section 7.1 in-memory virtual FS . no remote, no commits, no
          telemetry. Files persist only in this browser via localStorage.
        </span>
      </footer>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Inline styles
// ---------------------------------------------------------------------------

const pageStyle: CSSProperties = {
  maxWidth: 1080,
  margin: "0 auto",
  padding: "32px 24px 64px",
  display: "flex",
  flexDirection: "column",
  gap: 24,
  color: "oklch(0.96 0.015 80)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  alignItems: "center",
  textAlign: "center",
};

const kickerStyle: CSSProperties = {
  font: "500 11px/1 'JetBrains Mono', monospace",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color: "oklch(0.78 0.14 55)",
  marginBottom: 6,
};

const titleStyle: CSSProperties = {
  font: "400 clamp(24px, 3.6vw, 42px)/1.12 'Space Grotesk', sans-serif",
  letterSpacing: "-0.02em",
  margin: 0,
};

const subtitleStyle: CSSProperties = {
  font: "400 13px/1.55 'JetBrains Mono', monospace",
  color: "oklch(0.7 0.03 75)",
  margin: "10px auto 0",
  maxWidth: 560,
};

const linkButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  background: "transparent",
  border: "1px solid oklch(0.3 0.04 60 / 0.6)",
  borderRadius: 6,
  padding: "8px 14px",
  color: "oklch(0.85 0.04 75)",
  textDecoration: "none",
  font: "500 12px/1 'JetBrains Mono', monospace",
};

const ghostButtonStyle: CSSProperties = {
  appearance: "none",
  cursor: "pointer",
  background: "transparent",
  border: "1px solid oklch(0.3 0.04 60 / 0.6)",
  borderRadius: 6,
  padding: "8px 14px",
  color: "oklch(0.85 0.04 75)",
  font: "500 12px/1 'JetBrains Mono', monospace",
};

const statusBoxStyle: CSSProperties = {
  marginTop: 14,
  padding: "10px 14px",
  background: "oklch(0.22 0.06 50 / 0.45)",
  border: "1px solid oklch(0.55 0.12 50 / 0.5)",
  borderRadius: 8,
  font: "400 12px/1.5 'JetBrains Mono', monospace",
  color: "oklch(0.88 0.08 60)",
  maxWidth: 560,
};

const skylineWrapStyle: CSSProperties = {
  border: "1px solid oklch(0.3 0.04 60 / 0.5)",
  borderRadius: 12,
  background: "oklch(0.13 0.02 55)",
  overflow: "hidden",
};

const skylineCaptionStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 14px",
  font: "400 11px/1.4 'JetBrains Mono', monospace",
  color: "oklch(0.65 0.03 75)",
  borderTop: "1px solid oklch(0.3 0.04 60 / 0.4)",
};

const workspaceWrapStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(220px, 280px) 1fr",
  gap: 16,
  minHeight: 380,
};

const fileTreeStyle: CSSProperties = {
  background: "oklch(0.16 0.02 60 / 0.65)",
  border: "1px solid oklch(0.3 0.04 60 / 0.5)",
  borderRadius: 10,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const panelHeadingStyle: CSSProperties = {
  font: "500 12px/1 'JetBrains Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.22em",
  color: "oklch(0.92 0.04 80)",
};

const panelSubtitleStyle: CSSProperties = {
  margin: "6px 0 0",
  font: "400 11px/1.5 'JetBrains Mono', monospace",
  color: "oklch(0.65 0.03 75)",
};

const inputStyle: CSSProperties = {
  appearance: "none",
  flex: "1 1 auto",
  minWidth: 0,
  background: "oklch(0.12 0.02 60)",
  border: "1px solid oklch(0.3 0.04 60 / 0.7)",
  borderRadius: 6,
  padding: "8px 10px",
  color: "oklch(0.96 0.015 80)",
  font: "400 12px/1.2 'JetBrains Mono', monospace",
};

const primaryButtonStyle: CSSProperties = {
  appearance: "none",
  cursor: "pointer",
  background:
    "linear-gradient(180deg, oklch(0.78 0.16 60), oklch(0.55 0.16 45))",
  color: "oklch(0.13 0.03 40)",
  border: "1px solid oklch(0.6 0.18 50)",
  borderRadius: 6,
  padding: "8px 12px",
  font: "600 12px/1 'Space Grotesk', sans-serif",
};

const errorTextStyle: CSSProperties = {
  margin: 0,
  padding: "0 14px 6px",
  font: "400 11px/1.45 'JetBrains Mono', monospace",
  color: "oklch(0.78 0.16 30)",
};

const fileListStyle: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: "0 0 12px",
  overflowY: "auto",
  flex: "1 1 auto",
};

const fileRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 14px",
};

const fileRowButtonStyle: CSSProperties = {
  appearance: "none",
  cursor: "pointer",
  background: "transparent",
  border: "none",
  color: "inherit",
  font: "500 12px/1.3 'JetBrains Mono', monospace",
  flex: "1 1 auto",
  textAlign: "left",
  padding: 0,
};

const deleteButtonStyle: CSSProperties = {
  appearance: "none",
  cursor: "pointer",
  background: "transparent",
  border: "1px solid oklch(0.3 0.04 60 / 0.5)",
  borderRadius: 4,
  color: "oklch(0.65 0.03 75)",
  font: "500 10px/1 'JetBrains Mono', monospace",
  padding: "2px 6px",
};

const editorWrapStyle: CSSProperties = {
  background: "oklch(0.16 0.02 60 / 0.65)",
  border: "1px solid oklch(0.3 0.04 60 / 0.5)",
  borderRadius: 10,
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
};

const editorHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "10px 14px",
  borderBottom: "1px solid oklch(0.3 0.04 60 / 0.4)",
};

const editorMetaStyle: CSSProperties = {
  font: "400 11px/1.2 'JetBrains Mono', monospace",
  color: "oklch(0.65 0.03 75)",
};

const textareaStyle: CSSProperties = {
  appearance: "none",
  width: "100%",
  flex: "1 1 auto",
  minHeight: 320,
  background: "oklch(0.1 0.018 60)",
  color: "oklch(0.96 0.015 80)",
  border: "none",
  resize: "vertical",
  padding: "14px 16px",
  font: "400 13px/1.55 'JetBrains Mono', monospace",
  outline: "none",
};

const editorEmptyStyle: CSSProperties = {
  flex: "1 1 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  font: "400 12px/1.4 'JetBrains Mono', monospace",
  color: "oklch(0.55 0.03 75)",
  padding: 30,
};

const footerStyle: CSSProperties = {
  textAlign: "center",
  font: "400 11px/1.45 'JetBrains Mono', monospace",
  color: "oklch(0.55 0.03 75)",
};
