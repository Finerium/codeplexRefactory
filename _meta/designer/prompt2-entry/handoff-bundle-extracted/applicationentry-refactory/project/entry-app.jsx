// entry-app.jsx — Codeplex Chronicle / Entry page
// Twin Windows · warm-dark interior · Hermes on the sill

const { useEffect, useMemo, useRef, useState, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "warmth": 55,
  "doorStrength": 78,
  "shyness": 65,
  "motion": "breathing"
}/*EDITMODE-END*/;

// ─── small ui atoms ───────────────────────────────────────────────────────
function Badge({ children, tone = "brass" }) {
  const palette = {
    brass: { bg: "rgba(214,170,90,0.08)", bd: "rgba(214,170,90,0.32)", fg: "oklch(0.82 0.11 82)" },
    ember: { bg: "rgba(230,120,60,0.08)", bd: "rgba(230,120,60,0.32)", fg: "oklch(0.78 0.14 55)" },
    cool:  { bg: "rgba(120,150,200,0.06)", bd: "rgba(120,150,200,0.24)", fg: "oklch(0.72 0.05 235)" },
  }[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 9px 4px 8px", borderRadius: 999,
      border: `1px solid ${palette.bd}`, background: palette.bg,
      color: palette.fg,
      font: "500 11px/1 'JetBrains Mono', monospace",
      letterSpacing: "0.04em",
    }}>
      <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: 999, background: palette.fg, boxShadow: `0 0 8px ${palette.fg}` }} />
      {children}
    </span>
  );
}

function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="22" height="22" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="wm-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.82 0.13 80)" />
            <stop offset="100%" stopColor="oklch(0.55 0.16 45)" />
          </linearGradient>
        </defs>
        {/* two stacked tiles — small "city" mark */}
        <rect x="3"  y="11" width="6" height="10" fill="url(#wm-g)" />
        <rect x="10" y="7"  width="6" height="14" fill="url(#wm-g)" opacity="0.75" />
        <rect x="17" y="13" width="4" height="8"  fill="url(#wm-g)" opacity="0.55" />
        <circle cx="6" cy="14" r="0.8" fill="oklch(0.16 0.03 50)" />
        <circle cx="13" cy="11" r="0.8" fill="oklch(0.16 0.03 50)" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{ font: "600 13px/1 'Space Grotesk', sans-serif", letterSpacing: "0.01em" }}>
          Codeplex Chronicle
        </span>
        <span className="micro" style={{ color: "var(--mute)", marginTop: 3, fontSize: 10 }}>
          entry · threshold
        </span>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "22px 44px", position: "relative", zIndex: 5,
    }}>
      <Wordmark />
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span className="micro" style={{ color: "var(--mute)" }}>build · 0.3.0-alpha · refactory-r03</span>
        <Badge tone="ember">v0.3 prototype</Badge>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section style={{
      textAlign: "center", padding: "12px 24px 28px", position: "relative", zIndex: 5,
    }}>
      <div className="micro upper" style={{ color: "var(--brass-soft)", marginBottom: 14 }}>
        ── you have arrived ──
      </div>
      <h1 style={{
        font: "400 clamp(28px, 4.2vw, 52px)/1.12 'Space Grotesk', sans-serif",
        letterSpacing: "-0.02em",
        margin: "0 auto", maxWidth: 880,
        color: "var(--ink)",
      }}>
        Two doors. <span style={{ color: "var(--brass)" }}>One opens to your codebase.</span>
        <br />
        <span style={{ color: "var(--ink-soft)" }}>The other to a blank lot.</span>
      </h1>
      <p style={{
        font: "400 14px/1.55 'JetBrains Mono', monospace",
        color: "var(--mute)", margin: "16px auto 0", maxWidth: 560,
      }}>
        pick one. the city renders behind it. five residents are already inside, waiting.
      </p>
    </section>
  );
}

// ─── WINDOW CARD ──────────────────────────────────────────────────────────
// A casement window over a scene. Hovers lift. Click → doors swing open.
function WindowCard({
  side,          // "left" | "right"
  scene,         // <MiniCity/> or <EmptyLot/>
  kicker, title, body,
  ctaLabel, hint,
  focused, onFocus, onSelect,
  doorStrength = 78,
  opened, opening,
}) {
  // doorStrength 0..100 modulates frame + mullion intensity
  const frameW = 8 + (doorStrength / 100) * 14;          // 8..22px
  const mullionW = 1 + (doorStrength / 100) * 3.5;       // 1..4.5px
  const mullionOpacity = 0.35 + (doorStrength / 100) * 0.55;
  const hardwareVisible = doorStrength > 35;
  const cols = 3, rows = 4;

  // pane mullion offsets (percentages)
  const colLines = Array.from({ length: cols - 1 }, (_, i) => ((i + 1) / cols) * 100);
  const rowLines = Array.from({ length: rows - 1 }, (_, i) => ((i + 1) / rows) * 100);

  return (
    <button
      onClick={onSelect}
      onFocus={onFocus}
      onMouseEnter={onFocus}
      style={{
        all: "unset",
        cursor: "default",
        display: "flex", flexDirection: "column",
        width: "100%",
        maxWidth: 460,
        // hover lift handled via inline transition
        transform: focused ? "translateY(-4px)" : "translateY(0)",
        transition: "transform 320ms cubic-bezier(.2,.7,.2,1), filter 320ms",
        filter: focused ? "drop-shadow(0 24px 40px rgba(0,0,0,0.5))" : "drop-shadow(0 8px 18px rgba(0,0,0,0.35))",
      }}
      aria-label={title}
    >
      {/* WINDOW BODY */}
      <div style={{
        position: "relative",
        aspectRatio: "4 / 5",
        background: "var(--frame)",
        borderRadius: "3px",
        padding: frameW,
        border: `1px solid var(--frame-edge)`,
        boxShadow: focused
          ? `inset 0 0 0 1px rgba(255,200,120,0.18), 0 0 0 1px rgba(255,200,120,0.12), 0 0 40px -8px rgba(230,140,60,0.4)`
          : `inset 0 0 0 1px rgba(255,200,120,0.05)`,
        transition: "box-shadow 320ms",
      }}>
        {/* corner hardware (brass plates) */}
        {hardwareVisible && (
          <>
            {[[6,6],[null,6],[6,null],[null,null]].map(([l,t], i) => (
              <span key={i} style={{
                position: "absolute",
                left: l === 6 ? 6 : "auto",
                right: l === null ? 6 : "auto",
                top: t === 6 ? 6 : "auto",
                bottom: t === null ? 6 : "auto",
                width: 10, height: 10,
                background: "linear-gradient(135deg, oklch(0.82 0.12 82), oklch(0.5 0.08 70))",
                borderRadius: 1.5, opacity: 0.7,
              }} />
            ))}
          </>
        )}

        {/* SCENE BEHIND GLASS */}
        <div style={{
          position: "relative",
          width: "100%", height: "100%",
          overflow: "hidden",
          background: "oklch(0.1 0.02 40)",
          borderRadius: "1px",
        }}>
          {/* scene */}
          <div style={{
            position: "absolute", inset: 0,
            transform: opening ? "scale(1.04)" : "scale(1)",
            filter: opening ? "brightness(1.15) saturate(1.1)" : "brightness(1) saturate(1)",
            transition: "transform 900ms cubic-bezier(.2,.7,.2,1), filter 900ms",
          }}>
            {scene}
          </div>

          {/* glass sheen — diagonal highlight */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "linear-gradient(115deg, rgba(255,240,210,0.07) 0%, rgba(255,240,210,0) 38%, rgba(255,240,210,0) 62%, rgba(255,240,210,0.05) 100%)",
            mixBlendMode: "screen",
          }} />

          {/* MULLIONS — overlay grid, split-aware for "open" animation */}
          {/* horizontal mullions stay put */}
          {rowLines.map((p, i) => (
            <div key={"h" + i} style={{
              position: "absolute", left: 0, right: 0, top: `${p}%`,
              height: mullionW, background: "var(--frame)",
              boxShadow: "0 1px 0 rgba(0,0,0,0.4), 0 -1px 0 rgba(255,200,140,0.05)",
              opacity: mullionOpacity,
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }} />
          ))}
          {/* vertical mullions: the center one is the "split" — animate apart on open */}
          {colLines.map((p, i) => {
            const isCenter = colLines.length > 1 ? i === Math.floor(colLines.length / 2) : true;
            const shift = opening && isCenter ? "calc(-50% - 22px)" : "translateX(-50%)";
            return (
              <div key={"v" + i} style={{
                position: "absolute", top: 0, bottom: 0, left: `${p}%`,
                width: mullionW, background: "var(--frame)",
                boxShadow: "1px 0 0 rgba(0,0,0,0.4), -1px 0 0 rgba(255,200,140,0.05)",
                opacity: mullionOpacity,
                transform: opening && isCenter
                  ? (side === "left" ? "translateX(-220%)" : "translateX(220%)")
                  : "translateX(-50%)",
                transition: "transform 900ms cubic-bezier(.4,.0,.2,1)",
                pointerEvents: "none",
              }} />
            );
          })}

          {/* DOOR-LEAVES — invisible until "opening", then sweep across like casement panels */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden",
          }}>
            {/* left leaf */}
            <div style={{
              position: "absolute", top: 0, left: 0, width: "50%", height: "100%",
              background: "linear-gradient(90deg, rgba(20,14,8,0.55), rgba(20,14,8,0.1))",
              transformOrigin: "left center",
              transform: opening ? "perspective(900px) rotateY(-95deg)" : "rotateY(0deg)",
              opacity: opening ? 1 : 0,
              transition: "transform 900ms cubic-bezier(.4,.0,.2,1), opacity 240ms",
            }} />
            {/* right leaf */}
            <div style={{
              position: "absolute", top: 0, right: 0, width: "50%", height: "100%",
              background: "linear-gradient(270deg, rgba(20,14,8,0.55), rgba(20,14,8,0.1))",
              transformOrigin: "right center",
              transform: opening ? "perspective(900px) rotateY(95deg)" : "rotateY(0deg)",
              opacity: opening ? 1 : 0,
              transition: "transform 900ms cubic-bezier(.4,.0,.2,1), opacity 240ms",
            }} />
          </div>

          {/* focus indicator — thin warm border, top-left kicker */}
          <div style={{
            position: "absolute", top: 10, left: 12,
            font: "500 10px/1 'JetBrains Mono', monospace",
            letterSpacing: "0.1em",
            color: focused ? "oklch(0.92 0.05 80)" : "oklch(0.75 0.04 75)",
            textTransform: "uppercase",
            mixBlendMode: "screen",
            opacity: 0.85,
            textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          }}>
            {kicker}
          </div>
        </div>
      </div>

      {/* SILL — warm wood plank holds caption + CTA */}
      <div style={{
        position: "relative",
        marginTop: -2,
        background: "linear-gradient(180deg, var(--sill), oklch(0.22 0.04 50))",
        borderTop: "1px solid var(--frame-edge)",
        borderLeft: "1px solid rgba(0,0,0,0.4)",
        borderRight: "1px solid rgba(0,0,0,0.4)",
        borderBottom: "1px solid rgba(0,0,0,0.6)",
        padding: "16px 18px 16px",
        boxShadow: "0 6px 14px rgba(0,0,0,0.3)",
      }}>
        {/* wood-grain hairline */}
        <div style={{
          position: "absolute", left: 12, right: 12, top: 6,
          height: 1, background: "linear-gradient(90deg, transparent, rgba(255,220,170,0.16), transparent)",
        }} />
        <h2 style={{
          margin: 0,
          font: "500 19px/1.2 'Space Grotesk', sans-serif",
          letterSpacing: "-0.01em",
          color: "var(--ink)",
        }}>{title}</h2>
        <p style={{
          margin: "8px 0 14px",
          font: "400 13px/1.5 'JetBrains Mono', monospace",
          color: "var(--ink-soft)",
        }}>{body}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 14px",
            background: focused ? "linear-gradient(180deg, oklch(0.78 0.16 60), oklch(0.55 0.16 45))" : "oklch(0.22 0.04 50)",
            color: focused ? "oklch(0.13 0.03 40)" : "var(--ink)",
            font: "600 13px/1 'Space Grotesk', sans-serif",
            letterSpacing: "0.01em",
            borderRadius: 6,
            border: "1px solid " + (focused ? "oklch(0.6 0.18 50)" : "var(--frame-edge)"),
            boxShadow: focused ? "0 4px 18px -4px oklch(0.6 0.18 50 / 0.6)" : "none",
            transition: "all 200ms",
          }}>
            {ctaLabel}
          </span>
          <span className="micro" style={{ color: "var(--mute)" }}>{hint}</span>
        </div>
      </div>
    </button>
  );
}

// ─── HERMES ON THE SILL ───────────────────────────────────────────────────
// Sits at a "home" position between the two windows. Flees from cursor.
function useHermes({ shyness = 65, sceneRef, motion = "breathing" }) {
  // shyness 0..100 → flee threshold 60..280px, push factor 30..140
  const threshold = 60 + (shyness / 100) * 220;
  const pushFactor = 30 + (shyness / 100) * 110;

  const [pos, setPos] = useState({ x: 0, y: 0, ex: 0, ey: 0, hiding: false });
  const homeRef = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const raf = useRef(null);
  const cursor = useRef({ x: -9999, y: -9999 });

  // recompute home on resize
  useEffect(() => {
    const recompute = () => {
      const el = sceneRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // home = horizontal center, just under the windows (on the sill)
      homeRef.current = { x: rect.width / 2, y: rect.height * 0.66 };
      target.current = { ...homeRef.current };
      setPos((p) => ({ ...p, x: homeRef.current.x, y: homeRef.current.y }));
    };
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [sceneRef]);

  // listen to cursor (in scene-local coords)
  useEffect(() => {
    const onMove = (e) => {
      const el = sceneRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      cursor.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [sceneRef]);

  // rAF loop — flee logic + easing back
  useEffect(() => {
    const tick = () => {
      const home = homeRef.current;
      const cur = cursor.current;
      const dx = cur.x - home.x;
      const dy = cur.y - home.y;
      const d = Math.hypot(dx, dy);
      let tx, ty, hiding = false;
      if (d < threshold && d > 0.5) {
        // flee opposite
        const k = (1 - d / threshold) * pushFactor;
        tx = home.x - (dx / d) * k;
        ty = home.y - (dy / d) * k * 0.5; // less vertical run — he's on a sill
        hiding = d < threshold * 0.35;
      } else {
        tx = home.x;
        ty = home.y;
      }
      target.current = { x: tx, y: ty };
      // breathing bob
      const bob = motion !== "still" ? Math.sin(performance.now() / 720) * 1.5 : 0;
      setPos((p) => {
        const nx = p.x + (target.current.x - p.x) * 0.12;
        const ny = p.y + (target.current.y - p.y) * 0.12 + (bob - (p._bob || 0));
        // eye direction tracks cursor when far, droops when close
        const exRaw = (cur.x - p.x) / 200;
        const eyRaw = (cur.y - p.y) / 200;
        const ex = p.ex + (exRaw - p.ex) * 0.08;
        const ey = p.ey + (eyRaw - p.ey) * 0.08;
        return { x: nx, y: ny, ex, ey, hiding, _bob: bob };
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [threshold, pushFactor, motion]);

  return pos;
}

// ─── RESIDENTS ROW ────────────────────────────────────────────────────────
const RESIDENTS = [
  { name: "Athena", role: "the architect",  home: "City Hall",          bio: "Drafts the floor plan. Holds the load-bearing walls in her head.", glyph: "hall" },
  { name: "Apollo", role: "the doctor",     home: "Hospital",           bio: "Reads stack traces like x-rays. Knows where it hurts.", glyph: "cross" },
  { name: "Argus",  role: "the watcher",    home: "Police Station",     bio: "A hundred eyes on every diff. Sleeps in shifts.", glyph: "eye" },
  { name: "Clio",   role: "the historian",  home: "Library",            bio: "Keeps every commit on her shelves. Will find the one from June.", glyph: "book" },
  { name: "Hermes", role: "the guide",      home: "Tourist Info booth", bio: "Meets you at the door. Points the way in.", glyph: "info", onSill: true },
];

function ResidentGlyph({ kind }) {
  const stroke = "oklch(0.78 0.13 80)";
  const fill = "oklch(0.18 0.03 50)";
  switch (kind) {
    case "hall":
      return (
        <svg viewBox="0 0 40 40" width="32" height="32">
          <path d="M6 32 L34 32" stroke={stroke} strokeWidth="1.2" />
          <rect x="10" y="18" width="20" height="14" fill={fill} stroke={stroke} strokeWidth="0.8" />
          {[0,1,2,3].map(i => <rect key={i} x={12 + i*5} y="22" width="2" height="10" fill={stroke} opacity="0.7" />)}
          <path d="M10 18 Q20 8 30 18 Z" fill="none" stroke={stroke} strokeWidth="1" />
          <circle cx="20" cy="13" r="1.6" fill={stroke} />
        </svg>
      );
    case "cross":
      return (
        <svg viewBox="0 0 40 40" width="32" height="32">
          <rect x="11" y="14" width="18" height="18" fill={fill} stroke={stroke} strokeWidth="0.8" />
          <rect x="17.5" y="18" width="5" height="11" fill={stroke} opacity="0.85" />
          <rect x="14" y="21.5" width="12" height="4" fill={stroke} opacity="0.85" />
          <circle cx="20" cy="10" r="1" fill={stroke} />
        </svg>
      );
    case "eye":
      return (
        <svg viewBox="0 0 40 40" width="32" height="32">
          <rect x="10" y="14" width="20" height="18" fill={fill} stroke={stroke} strokeWidth="0.8" />
          <line x1="20" y1="14" x2="20" y2="6" stroke={stroke} strokeWidth="0.8" />
          <circle cx="20" cy="5" r="1.4" fill={stroke} />
          <path d="M15 22 Q20 18 25 22 Q20 26 15 22 Z" fill="none" stroke={stroke} strokeWidth="0.9" />
          <circle cx="20" cy="22" r="1.6" fill={stroke} />
        </svg>
      );
    case "book":
      return (
        <svg viewBox="0 0 40 40" width="32" height="32">
          <rect x="9" y="16" width="22" height="16" fill={fill} stroke={stroke} strokeWidth="0.8" />
          <polygon points="9,16 31,16 27,12 13,12" fill={fill} stroke={stroke} strokeWidth="0.8" />
          {[0,1,2,3,4,5].map(i => <rect key={i} x={11 + i*3.2} y="18" width="2" height="12" fill={stroke} opacity="0.7" />)}
        </svg>
      );
    case "info":
      return (
        <svg viewBox="0 0 40 40" width="32" height="32">
          <polygon points="8,20 32,20 30,16 10,16" fill="oklch(0.55 0.13 45)" stroke={stroke} strokeWidth="0.6" />
          <rect x="11" y="20" width="18" height="12" fill={fill} stroke={stroke} strokeWidth="0.8" />
          <rect x="14" y="23" width="12" height="6" fill={stroke} opacity="0.5" />
          <circle cx="32" cy="13" r="2.2" fill="oklch(0.85 0.12 80)" />
          <text x="32" y="14.5" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="3" fontWeight="700" fill="oklch(0.18 0.03 40)">i</text>
        </svg>
      );
  }
}

function Residents() {
  return (
    <section style={{
      padding: "30px 44px 18px",
      borderTop: "1px solid var(--rule)",
      position: "relative", zIndex: 4,
    }}>
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        marginBottom: 18,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span className="micro upper" style={{ color: "var(--brass-soft)" }}>// the residents</span>
          <span className="micro" style={{ color: "var(--mute)" }}>five colleagues already inside</span>
        </div>
        <span className="micro" style={{ color: "var(--faint)" }}>n=5 · ai · resident</span>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        gap: 1,
        background: "var(--rule)",
        border: "1px solid var(--rule)",
        borderRadius: 6,
        overflow: "hidden",
      }}>
        {RESIDENTS.map((r) => (
          <article key={r.name} style={{
            padding: "16px 14px 14px",
            background: r.onSill
              ? "linear-gradient(180deg, oklch(0.2 0.04 55), oklch(0.15 0.025 50))"
              : "oklch(0.155 0.025 55)",
            display: "flex", flexDirection: "column", gap: 8,
            position: "relative",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <ResidentGlyph kind={r.glyph} />
              {r.onSill && (
                <span className="micro" style={{
                  fontSize: 9, color: "oklch(0.78 0.14 55)",
                  border: "1px solid oklch(0.78 0.14 55 / 0.4)",
                  padding: "2px 5px", borderRadius: 999,
                  letterSpacing: "0.06em",
                }}>on the sill</span>
              )}
            </div>
            <div>
              <h3 style={{
                margin: 0,
                font: "600 16px/1.1 'Space Grotesk', sans-serif",
                color: "var(--ink)",
              }}>{r.name}</h3>
              <div className="micro" style={{ color: "var(--brass-soft)", marginTop: 4 }}>
                {r.role} · <span style={{ color: "var(--mute)" }}>{r.home}</span>
              </div>
            </div>
            <p style={{
              margin: "4px 0 0",
              font: "400 12.5px/1.5 'JetBrains Mono', monospace",
              color: "var(--ink-soft)",
            }}>{r.bio}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 24, padding: "20px 44px 32px",
      borderTop: "1px solid var(--rule)",
      color: "var(--mute)",
      font: "400 11.5px/1.6 'JetBrains Mono', monospace",
      position: "relative", zIndex: 4,
    }}>
      <span>
        Built at <span style={{ color: "var(--ink-soft)" }}>Refactory Hackathon Round 03</span>,
        Telkom University Bandung, May 12–13 2026.
      </span>
      <span>
        Tim Duopoly · <span style={{ color: "var(--ink-soft)" }}>Ghaisan Khoirul Badruzaman</span>
        <span style={{ color: "var(--faint)" }}> + </span>
        <span style={{ color: "var(--ink-soft)" }}>Hafiz Fauzan Syafrudin</span>
      </span>
    </footer>
  );
}

// ─── STAGE: two windows with Hermes between them ──────────────────────────
function Stage({ selected, setSelected, onSelect, opening, doorStrength, shyness, motion, warmth }) {
  const sceneRef = useRef(null);
  const hermes = useHermes({ shyness, sceneRef, motion });

  return (
    <section
      ref={sceneRef}
      style={{
        position: "relative",
        padding: "10px 44px 14px",
        maxWidth: 1280,
        margin: "0 auto",
      }}
    >
      {/* twin windows */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 60px 1fr",
        gap: 0,
        alignItems: "stretch",
      }}>
        {/* LEFT — import */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <WindowCard
            side="left"
            kicker="01 · existing city"
            scene={<MiniCity motion={motion} warmth={warmth} />}
            title="Import a repository"
            body="Authorize with GitHub. Pick a repo. We render the city — every module a building, every commit a footprint."
            ctaLabel={<>Connect GitHub <span style={{ marginLeft: 4 }}>→</span></>}
            hint="↵ enter"
            focused={selected === "left"}
            onFocus={() => setSelected("left")}
            onSelect={() => onSelect("left")}
            doorStrength={doorStrength}
            opening={opening === "left"}
          />
        </div>

        {/* CENTER PILLAR — where Hermes lives */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {/* a thin pillar */}
          <div style={{
            position: "absolute", top: 24, bottom: 24, left: "50%",
            width: 1.5, transform: "translateX(-50%)",
            background: "linear-gradient(180deg, transparent, var(--rule-hi) 20%, var(--rule-hi) 80%, transparent)",
          }} />
          {/* tag */}
          <span className="micro" style={{
            position: "absolute", top: "50%", transform: "translateY(-50%) rotate(-90deg)",
            color: "var(--faint)", letterSpacing: "0.3em", whiteSpace: "nowrap",
          }}>
            CHOOSE · ONE
          </span>
        </div>

        {/* RIGHT — blank lot */}
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <WindowCard
            side="right"
            kicker="02 · blank lot"
            scene={<EmptyLot motion={motion} warmth={warmth} />}
            title="Build from scratch"
            body="Start with an empty lot. We render as you code — buildings rise in-memory, no remote, no commits."
            ctaLabel={<>Open a blank city <span style={{ marginLeft: 4 }}>→</span></>}
            hint="↵ enter"
            focused={selected === "right"}
            onFocus={() => setSelected("right")}
            onSelect={() => onSelect("right")}
            doorStrength={doorStrength}
            opening={opening === "right"}
          />
        </div>
      </div>

      {/* HERMES — absolute on top, tracking cursor */}
      <div style={{
        position: "absolute",
        left: hermes.x + 44, // +padding compensation
        top: hermes.y + 10,
        transform: `translate(-50%, -50%) ${hermes.hiding ? "scale(0.8)" : "scale(1)"}`,
        transition: "transform 280ms",
        pointerEvents: "none",
        zIndex: 6,
        filter: hermes.hiding ? "brightness(0.7) blur(0.4px)" : "brightness(1)",
      }}>
        <HermesBlob size={64} eyesDir={{ x: hermes.ex || 0, y: hermes.ey || 0 }} />
        {/* little speech tag near Hermes when idle */}
        <div style={{
          position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)",
          opacity: hermes.hiding ? 0 : 0.85,
          transition: "opacity 240ms",
          font: "500 10px/1 'JetBrains Mono', monospace",
          letterSpacing: "0.08em",
          color: "oklch(0.85 0.05 75)",
          background: "rgba(20,14,8,0.78)",
          padding: "5px 8px", borderRadius: 999,
          border: "1px solid oklch(0.78 0.14 55 / 0.35)",
          whiteSpace: "nowrap",
        }}>
          hermes · pick a door
        </div>
      </div>

      {/* entering overlay — appears when a door opens */}
      {opening && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 10,
        }}>
          <div style={{
            transform: "translateY(-30px)",
            padding: "10px 18px",
            background: "rgba(20,14,8,0.86)",
            border: "1px solid oklch(0.78 0.14 55 / 0.45)",
            borderRadius: 999,
            font: "500 12px/1 'JetBrains Mono', monospace",
            color: "oklch(0.92 0.06 75)",
            letterSpacing: "0.08em",
            animation: "cs-pulse 1.4s ease-in-out infinite",
          }}>
            {opening === "left" ? "stepping into your codebase ·" : "breaking ground on a blank lot ·"}
            &nbsp;<span style={{ color: "oklch(0.78 0.14 55)" }}>entering city view…</span>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [selected, setSelected] = useState("left");
  const [opening, setOpening] = useState(null);

  const onSelect = useCallback((side) => {
    if (opening) return;
    setSelected(side);
    setOpening(side);
    // reset after the door animation finishes — in the real app this would navigate to /city
    setTimeout(() => setOpening(null), 2200);
  }, [opening]);

  // keyboard nav: ← → toggles, Enter triggers select
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft")  { e.preventDefault(); setSelected("left"); }
      if (e.key === "ArrowRight") { e.preventDefault(); setSelected("right"); }
      if (e.key === "Enter")      { e.preventDefault(); onSelect(selected); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, onSelect]);

  // ambient warmth — tint the room background subtly
  const warmthVar = useMemo(() => {
    // shift the bg-deep / bg-room hue & chroma based on warmth 0..100
    const k = (t.warmth - 50) / 50; // -1..1
    const hue = 55 + k * 12;          // cooler → ~43, warmer → ~67
    const chroma = 0.018 + k * 0.014;
    return {
      "--bg-deep": `oklch(${0.115 + k * 0.005} ${Math.max(0.005, chroma)} ${hue})`,
      "--bg-room": `oklch(${0.16 + k * 0.005} ${Math.max(0.008, chroma + 0.007)} ${hue + 5})`,
      "--wood": `oklch(${0.205 + k * 0.01} ${0.04 + k * 0.01} ${hue - 5})`,
    };
  }, [t.warmth]);

  return (
    <div className="room" style={warmthVar}>
      <Header />
      <Hero />
      <Stage
        selected={selected}
        setSelected={setSelected}
        onSelect={onSelect}
        opening={opening}
        doorStrength={t.doorStrength}
        shyness={t.shyness}
        motion={t.motion}
        warmth={t.warmth}
      />

      {/* quick keyboard hints under the windows */}
      <div style={{
        textAlign: "center", padding: "10px 24px 0",
        font: "400 11px/1 'JetBrains Mono', monospace",
        color: "var(--faint)", letterSpacing: "0.05em",
      }}>
        <kbd style={kbd}>←</kbd> <kbd style={kbd}>→</kbd> to choose · <kbd style={kbd}>↵</kbd> to enter · <kbd style={kbd}>esc</kbd> back to landing
      </div>

      <Residents />
      <Footer />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Atmosphere" />
        <TweakSlider label="Ambient warmth" value={t.warmth} min={0} max={100} unit=""
          onChange={(v) => setTweak("warmth", v)} />
        <TweakRadio label="Background motion" value={t.motion}
          options={["still", "breathing", "animated-city"]}
          onChange={(v) => setTweak("motion", v)} />

        <TweakSection label="Window metaphor" />
        <TweakSlider label="Door strength" value={t.doorStrength} min={0} max={100} unit="%"
          onChange={(v) => setTweak("doorStrength", v)} />

        <TweakSection label="Hermes" />
        <TweakSlider label="Shyness" value={t.shyness} min={0} max={100} unit=""
          onChange={(v) => setTweak("shyness", v)} />
      </TweaksPanel>
    </div>
  );
}

const kbd = {
  display: "inline-block",
  padding: "2px 6px",
  margin: "0 1px",
  background: "oklch(0.2 0.03 55)",
  border: "1px solid var(--rule-hi)",
  borderRadius: 3,
  color: "var(--ink-soft)",
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 10,
};

// ─── boot ─────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
