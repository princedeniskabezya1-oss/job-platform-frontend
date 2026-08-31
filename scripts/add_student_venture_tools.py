from pathlib import Path

p = Path("student.js")
s = p.read_text(encoding="utf-8")

state_old = '''const studentCareerFocusState = {
  active:"",
  items:[],
  filtered:[],
  loading:false
};'''
state_new = '''const studentCareerFocusState = {
  active:"",
  items:[],
  filtered:[],
  loading:false,
  ventureMine:[],
  ventureMode:"all"
};'''
if state_old not in s:
    raise SystemExit("studentCareerFocusState block not found")
s = s.replace(state_old, state_new, 1)

marker = "function renderStudentCareerFocusResults(items){"
if marker not in s:
    raise SystemExit("renderStudentCareerFocusResults marker not found")

helpers = r'''function getStudentCareerVentureFundingTypes(item){
  return Array.isArray(item?.fundingTypes)
    ? item.fundingTypes.map(value => String(value || "").toLowerCase())
    : [];
}

function filterStudentCareerVenturesByMode(mode){
  const publicVentures = Array.isArray(studentCareerFocusState.items)
    ? studentCareerFocusState.items
    : [];
  const mine = Array.isArray(studentCareerFocusState.ventureMine)
    ? studentCareerFocusState.ventureMine
    : [];

  switch(mode){
    case "build":
      return mine;
    case "fund":
      return publicVentures.filter(item =>
        Number(item?.fundingGoal || 0) > 0 ||
        getStudentCareerVentureFundingTypes(item).some(type =>
          ["grant","sponsorship","donation","investment-interest"].includes(type)
        )
      );
    case "connect":
      return publicVentures.filter(item =>
        getStudentCareerVentureFundingTypes(item).some(type =>
          ["mentorship","pilot","sponsorship"].includes(type)
        )
      );
    case "pitch":
      return publicVentures.filter(item => item?.seekingInvestment === true);
    default:
      return publicVentures;
  }
}

function renderStudentCareerVentureTools(){
  const mine = Array.isArray(studentCareerFocusState.ventureMine)
    ? studentCareerFocusState.ventureMine
    : [];

  const fundCount = filterStudentCareerVenturesByMode("fund").length;
  const connectCount = filterStudentCareerVenturesByMode("connect").length;
  const pitchCount = filterStudentCareerVenturesByMode("pitch").length;
  const activeMode = studentCareerFocusState.ventureMode || "all";

  return `
    <section class="student-career-venture-tools" aria-label="AIFT Venture actions">
      <div class="student-career-venture-tools-head">
        <div>
          <span>AIFT VENTURES</span>
          <h4>Build, fund, connect and pitch</h4>
          <p>Manage your own ventures and discover live opportunities across the AIFT network.</p>
        </div>
        <a class="student-career-venture-create" href="create-venture.html">
          <i class="fa-solid fa-plus" aria-hidden="true"></i>
          <span>Create new venture</span>
        </a>
      </div>

      <div class="student-career-venture-tool-grid">
        <button type="button" class="student-career-venture-tool ${activeMode === "build" ? "active" : ""}" data-career-venture-tool="build">
          <span class="student-career-venture-tool-icon purple"><i class="fa-solid fa-lightbulb"></i></span>
          <span><small>Student projects</small><strong>Build</strong><em>${mine.length} ${mine.length === 1 ? "venture" : "ventures"}</em></span>
        </button>
        <button type="button" class="student-career-venture-tool ${activeMode === "fund" ? "active" : ""}" data-career-venture-tool="fund">
          <span class="student-career-venture-tool-icon amber"><i class="fa-solid fa-coins"></i></span>
          <span><small>Raise funding</small><strong>Fund</strong><em>${fundCount} available</em></span>
        </button>
        <button type="button" class="student-career-venture-tool ${activeMode === "connect" ? "active" : ""}" data-career-venture-tool="connect">
          <span class="student-career-venture-tool-icon green"><i class="fa-solid fa-handshake"></i></span>
          <span><small>Mentors & partners</small><strong>Connect</strong><em>${connectCount} available</em></span>
        </button>
        <button type="button" class="student-career-venture-tool ${activeMode === "pitch" ? "active" : ""}" data-career-venture-tool="pitch">
          <span class="student-career-venture-tool-icon blue"><i class="fa-solid fa-chart-line"></i></span>
          <span><small>Investor ready</small><strong>Pitch</strong><em>${pitchCount} available</em></span>
        </button>
      </div>

      <div class="student-career-venture-viewbar">
        <button type="button" class="${activeMode === "all" ? "active" : ""}" data-career-venture-tool="all">All ventures</button>
        <span>Choose an action above to focus the live Venture results.</span>
      </div>
    </section>
  `;
}

function ensureStudentCareerVentureToolStyles(){
  if (document.getElementById("studentCareerVentureToolStyles")) return;
  const style = document.createElement("style");
  style.id = "studentCareerVentureToolStyles";
  style.textContent = `
    #section-career .student-career-venture-tools{margin:0 0 14px;padding:16px;border:1px solid var(--career-border-soft,#e5e7eb);border-radius:14px;background:linear-gradient(180deg,#fff,#fbfcff);box-shadow:0 8px 24px rgba(15,23,42,.04)}
    #section-career .student-career-venture-tools-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:14px}
    #section-career .student-career-venture-tools-head>div{min-width:0}
    #section-career .student-career-venture-tools-head span{display:block;color:#7c3aed;font-size:7px;font-weight:800;letter-spacing:.1em}
    #section-career .student-career-venture-tools-head h4{margin:4px 0 3px;color:var(--career-heading,#111827);font-size:15px;line-height:1.25}
    #section-career .student-career-venture-tools-head p{margin:0;color:var(--career-muted,#667085);font-size:8px;line-height:1.5}
    #section-career .student-career-venture-create{min-height:36px;padding:0 13px;display:inline-flex;align-items:center;justify-content:center;gap:7px;flex:0 0 auto;border:1px solid #7c3aed;border-radius:9px;background:#7c3aed;color:#fff;font-size:8px;font-weight:750;box-shadow:0 6px 16px rgba(124,58,237,.16)}
    #section-career .student-career-venture-create:hover{background:#6d28d9;border-color:#6d28d9}
    #section-career .student-career-venture-tool-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
    #section-career .student-career-venture-tool{min-height:92px;padding:12px;display:grid;grid-template-columns:42px minmax(0,1fr);align-items:center;gap:10px;border:1px solid #e6eaf0;border-radius:12px;background:#fff;text-align:left;transition:.16s ease}
    #section-career .student-career-venture-tool:hover{transform:translateY(-1px);border-color:#cfd8e6;box-shadow:0 8px 20px rgba(15,23,42,.055)}
    #section-career .student-career-venture-tool.active{border-color:#7c3aed;box-shadow:0 0 0 2px rgba(124,58,237,.08)}
    #section-career .student-career-venture-tool-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:11px;font-size:14px}
    #section-career .student-career-venture-tool-icon.purple{background:#f3e8ff;color:#7c3aed}
    #section-career .student-career-venture-tool-icon.amber{background:#fff4db;color:#d97706}
    #section-career .student-career-venture-tool-icon.green{background:#e9f8ef;color:#16a34a}
    #section-career .student-career-venture-tool-icon.blue{background:#eaf3ff;color:#1677ff}
    #section-career .student-career-venture-tool>span:last-child{min-width:0;display:grid;gap:2px}
    #section-career .student-career-venture-tool small{color:#98a2b3;font-size:7px}
    #section-career .student-career-venture-tool strong{color:#172033;font-size:13px;font-weight:800}
    #section-career .student-career-venture-tool em{color:#667085;font-size:7px;font-style:normal}
    #section-career .student-career-venture-viewbar{margin-top:10px;padding-top:10px;display:flex;align-items:center;gap:10px;border-top:1px solid #edf0f4;color:#667085;font-size:7px}
    #section-career .student-career-venture-viewbar button{min-height:27px;padding:0 9px;border:1px solid #dfe4ea;border-radius:999px;background:#fff;color:#475467;font-size:7px;font-weight:700}
    #section-career .student-career-venture-viewbar button.active{border-color:#7c3aed;background:#f5f3ff;color:#6d28d9}
    @media(max-width:900px){#section-career .student-career-venture-tool-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:640px){#section-career .student-career-venture-tools-head{display:grid}#section-career .student-career-venture-create{width:100%}#section-career .student-career-venture-tool-grid{grid-template-columns:1fr}#section-career .student-career-venture-viewbar{align-items:flex-start;flex-direction:column}}
  `;
  document.head.appendChild(style);
}

'''
s = s.replace(marker, helpers + marker, 1)

render_start = s.index("function renderStudentCareerFocusResults(items){")
render_end = s.index("\nfunction filterStudentCareerFocusResults", render_start)
block = s[render_start:render_end]
block = block.replace(
    '  if (!container || !config) return;\n\n  if (!items.length){',
    '  if (!container || !config) return;\n\n  ensureStudentCareerVentureToolStyles();\n\n  const ventureTools = studentCareerFocusState.active === "ventures" ? renderStudentCareerVentureTools() : "";\n\n  if (!items.length){',
    1
)
block = block.replace(
    '    container.innerHTML = `\n      <div class="student-career-focus-empty">',
    '    container.innerHTML = `${ventureTools}\n      <div class="student-career-focus-empty">',
    1
)
block = block.replace(
    '  container.innerHTML = items.map(item => {',
    '  container.innerHTML = `${ventureTools}<div class="student-career-focus-result-list">${items.map(item => {',
    1
)
block = block.replace(
    '  }).join("");\n}',
    '  }).join("")}</div>`;\n}',
    1
)
s = s[:render_start] + block + s[render_end:]

open_start = s.index("async function openStudentCareerFocus(category){")
open_end = s.index("\n/* =========================================================\n   CAREER HUB ACTIONS", open_start)
block = s[open_start:open_end]
old_try = '''  try{
    const items = await loadStudentCareerFocusCategory(category);
    studentCareerFocusState.items = items;
    studentCareerFocusState.filtered = [...items];
    renderStudentCareerFocusResults(items);'''
new_try = '''  try{
    let items;
    if (category === "ventures"){
      studentCareerFocusState.ventureMode = "all";
      const [publicVentures, mineResponse] = await Promise.all([
        loadStudentCareerFocusCategory(category),
        apiGet("/api/ventures/mine").catch(() => [])
      ]);
      items = publicVentures;
      studentCareerFocusState.ventureMine = getStudentCareerFocusArray(mineResponse,["ventures"]);
    }else{
      items = await loadStudentCareerFocusCategory(category);
    }
    studentCareerFocusState.items = items;
    studentCareerFocusState.filtered = [...items];
    renderStudentCareerFocusResults(items);'''
if old_try not in block:
    raise SystemExit("openStudentCareerFocus try block not found")
block = block.replace(old_try, new_try, 1)
s = s[:open_start] + block + s[open_end:]

bind_start = s.index("function bindStudentCareerHubControls(){")
bind_end = s.index("\nasync function renderStudentCareerHub(){", bind_start)
block = s[bind_start:bind_end]
marker2 = '''      const actionButton =
        event.target.closest(
          "[data-career-action]"
        );'''
handler = '''      const ventureToolButton = event.target.closest("[data-career-venture-tool]");
      if (ventureToolButton && workspace.contains(ventureToolButton)){
        event.preventDefault();
        const mode = String(ventureToolButton.dataset.careerVentureTool || "all");
        studentCareerFocusState.ventureMode = mode;
        const filteredVentures = filterStudentCareerVenturesByMode(mode);
        studentCareerFocusState.filtered = [...filteredVentures];
        renderStudentCareerFocusResults(filteredVentures);
        return;
      }

'''
if marker2 not in block:
    raise SystemExit("Career action button marker not found")
block = block.replace(marker2, handler + marker2, 1)
s = s[:bind_start] + block + s[bind_end:]

p.write_text(s, encoding="utf-8")
