/**
 * TechStackSection, tech stack signal block surfaced after Residents and
 * before the closing CTA.
 *
 * Authored by Calliope (Manager FINAL Cycle 4 truly-cluster5b) per Pan
 * audit #5 verdict: tech stack logos were buried as a single "tree-sitter"
 * line inside TrinityCode SVG. Pan flagged that judges scanning the landing
 * page cannot tell the stack at a glance, which weakens hackathon rubric
 * "engineering depth" signal.
 *
 * Implementation choice: text-only mono lockup rather than raster or
 * external image hosts. Matches the existing developer-manifest voice of
 * TrinityCode (`$ tree-sitter parse -> AST -> district mapper`) and adds
 * zero network dependency, zero new asset pipeline. Two columns: runtime
 * stack and intelligence stack, separated by a thin --line divider top
 * border consistent with the closer credit block.
 */
export function TechStackSection() {
  return (
    <section className="techstack" id="tech-stack">
      <div className="inner">
        <div className="eyebrow" style={{ marginBottom: 24 }}>
          The stack
        </div>
        <h2 className="techstack-headline">
          Built on production
          <br />
          tools you already trust.
        </h2>
        <div className="techstack-grid">
          <div className="techstack-col">
            <div className="techstack-label">RUNTIME</div>
            <ul className="techstack-list">
              <li>
                <span className="techstack-prompt">$</span> Next.js 16
                <span className="techstack-note">App Router, RSC</span>
              </li>
              <li>
                <span className="techstack-prompt">$</span> React 19
                <span className="techstack-note">Server Components</span>
              </li>
              <li>
                <span className="techstack-prompt">$</span> Three.js + r3f
                <span className="techstack-note">3D city render</span>
              </li>
              <li>
                <span className="techstack-prompt">$</span> Tailwind + GSAP
                <span className="techstack-note">motion + tokens</span>
              </li>
              <li>
                <span className="techstack-prompt">$</span> TypeScript
                <span className="techstack-note">strict mode</span>
              </li>
            </ul>
          </div>
          <div className="techstack-col">
            <div className="techstack-label">INTELLIGENCE</div>
            <ul className="techstack-list">
              <li>
                <span className="techstack-prompt">$</span> FastAPI + Python 3.12
                <span className="techstack-note">async backend</span>
              </li>
              <li>
                <span className="techstack-prompt">$</span> DeepSeek V4
                <span className="techstack-note">Flash + Pro routing</span>
              </li>
              <li>
                <span className="techstack-prompt">$</span> tree-sitter
                <span className="techstack-note">11 language parser</span>
              </li>
              <li>
                <span className="techstack-prompt">$</span> OpenSpec
                <span className="techstack-note">Fission-AI dual folder</span>
              </li>
              <li>
                <span className="techstack-prompt">$</span> PostgreSQL
                <span className="techstack-note">event store</span>
              </li>
              <li>
                <span className="techstack-prompt">$</span> Kubernetes
                <span className="techstack-note">multi-arch Docker on Refactory cluster</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
