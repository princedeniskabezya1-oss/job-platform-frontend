from pathlib import Path
import re

path = Path('home.html')
text = path.read_text(encoding='utf-8')

css_pattern = re.compile(
    r'/\* =========================================================\n'
    r'   FAMILY ADVANTAGE — HOME PROMOTION\n'
    r'========================================================= \*/.*?'
    r'@media\(max-width:760px\)\{\s*\.family-advantage-card\{\s*display:none;\s*\}\s*\}',
    re.S,
)

new_css = '''/* =========================================================
   FAMILY ADVANTAGE — HOME PROMOTION
========================================================= */
.family-advantage-card{
  position:relative;
  isolation:isolate;
  margin-top:12px;
  overflow:hidden;
  min-height:152px;
  border:1px solid rgba(255,255,255,.16);
  border-radius:12px;
  background:
    radial-gradient(circle at 100% 0%,rgba(99,102,241,.36),transparent 42%),
    linear-gradient(145deg,#0a2a68 0%,#1648c7 60%,#5730a2 100%);
  color:#fff;
  box-shadow:var(--shadow);
}

.family-advantage-card::before{
  content:"";
  position:absolute;
  inset:0;
  z-index:-1;
  opacity:.12;
  background-image:
    linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px);
  background-size:26px 26px;
}

.family-advantage-inner{
  padding:14px 15px 13px;
}

.family-advantage-eyebrow{
  display:flex;
  align-items:center;
  gap:6px;
  margin-bottom:7px;
  color:rgba(255,255,255,.82);
  font-size:9px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.family-advantage-crown{
  width:20px;
  height:20px;
  display:grid;
  place-items:center;
  border:1px solid rgba(255,255,255,.2);
  border-radius:6px;
  background:rgba(255,255,255,.1);
  font-size:10px;
}

.family-advantage-card h3{
  margin:0;
  color:#fff;
  font-size:16px;
  line-height:1.18;
  letter-spacing:-.02em;
  font-weight:800;
}

.family-advantage-lead{
  margin:7px 0 11px;
  color:rgba(255,255,255,.78);
  font-size:10px;
  line-height:1.4;
}

.family-advantage-list,
.family-advantage-feature{
  display:none;
}

.family-advantage-cta{
  width:100%;
  min-height:34px;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:6px;
  padding:8px 10px;
  border:0;
  border-radius:999px;
  background:#fff;
  color:#15378f;
  font-size:10px;
  font-weight:800;
  box-shadow:0 5px 14px rgba(15,23,42,.13);
  transition:transform .16s ease,background .16s ease;
}

.family-advantage-cta:hover{
  transform:translateY(-1px);
  background:#f8fbff;
}

.family-advantage-cta:focus-visible{
  outline:3px solid rgba(255,255,255,.5);
  outline-offset:2px;
}

.family-advantage-free{
  margin-top:7px;
  text-align:center;
  color:rgba(255,255,255,.68);
  font-size:8.5px;
  font-weight:600;
}

@media(max-width:760px){
  .family-advantage-card{
    display:none;
  }
}'''

text, css_count = css_pattern.subn(new_css, text, count=1)
if css_count != 1:
    raise SystemExit('Family Advantage CSS block not found')

html_pattern = re.compile(
    r'<section class="family-advantage-card" aria-labelledby="familyAdvantageTitle">.*?</section>',
    re.S,
)

new_html = '''<section class="family-advantage-card" aria-labelledby="familyAdvantageTitle">
    <div class="family-advantage-inner">
      <div class="family-advantage-eyebrow">
        <span class="family-advantage-crown" aria-hidden="true">✦</span>
        <span>Family Advantage</span>
      </div>

      <h3 id="familyAdvantageTitle">Build a stronger future for your family.</h3>

      <p class="family-advantage-lead">
        Explore schools, scholarships, opportunities, and funding in one place.
      </p>

      <a class="family-advantage-cta" href="family.html" aria-label="Open Family Advantage">
        <span>Explore Family Advantage</span>
        <span aria-hidden="true">→</span>
      </a>

      <div class="family-advantage-free">Included with your AIFT account</div>
    </div>
  </section>'''

text, html_count = html_pattern.subn(new_html, text, count=1)
if html_count != 1:
    raise SystemExit('Family Advantage HTML block not found')

path.write_text(text, encoding='utf-8')
