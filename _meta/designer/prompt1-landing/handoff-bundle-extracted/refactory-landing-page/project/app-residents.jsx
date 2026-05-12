// app-residents.jsx — Act 4: the five AI residents.
/* global React, RESIDENTS, RESIDENT_PORTRAITS */

function ResidentsSection() {
  return (
    <section className="residents">
      <div className="head">
        <div>
          <div className="eyebrow">Five residents</div>
          <h2 className="h2" style={{ margin:'18px 0 0', maxWidth:'18ch' }}>
            They live in the buildings<br/>they’re named for.
          </h2>
        </div>
        <p className="body">
          Each AI resident inhabits a landmark in the city. They watch their districts
          and answer in their domain — quietly, only when they have something specific to say.
        </p>
      </div>
      <div className="res-grid">
        {RESIDENTS.map((r, i) => (
          <article key={r.id} className="res-card">
            <div className="ix">{String(i+1).padStart(2,'0')} · {String(i+1).padStart(2,'0')}/05</div>
            <div className="portrait" style={{ color:'var(--cool)' }}>
              {RESIDENT_PORTRAITS[r.id]}
            </div>
            <div>
              <div className="role">{r.role}</div>
              <div className="name" style={{ marginTop:6 }}>{r.name}</div>
            </div>
            <p className="desc">{r.line}</p>
            <div className="landmark">{r.landmark}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

Object.assign(window, { ResidentsSection });
