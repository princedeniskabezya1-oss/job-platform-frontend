from pathlib import Path

p = Path("student.js")
s = p.read_text(encoding="utf-8")

anchor = '''function ensureStudentCareerVentureToolStyles(){'''
if anchor not in s:
    raise SystemExit("Venture tool style function not found")

helper = r'''
function getStudentCareerVentureModeCopy(mode){
  const copy = {
    all:{
      eyebrow:"VENTURE MARKETPLACE",
      title:"All live ventures",
      description:"Explore active AIFT ventures published across the network."
    },
    build:{
      eyebrow:"YOUR VENTURES",
      title:"Build and manage your ideas",
      description:"Your own ventures appear here so you can continue building, editing and preparing them for support."
    },
    fund:{
      eyebrow:"FUNDING",
      title:"Ventures seeking funding",
      description:"Projects seeking grants, sponsorship, donations or investment support appear here."
    },
    connect:{
      eyebrow:"CONNECT",
      title:"Ventures seeking people and partners",
      description:"Find projects looking for mentors, pilots, sponsors and partnership support."
    },
    pitch:{
      eyebrow:"INVESTOR READY",
      title:"Ventures open to investors",
      description:"Only ventures currently marked as seeking investment are shown here."
    }
  };
  return copy[mode] || copy.all;
}

function getStudentCareerVentureModeItems(mode){
  return filterStudentCareerVenturesByMode(mode || "all");
}

function applyStudentCareerVentureMode(mode){
  if (studentCareerFocusState.active !== "ventures") return;

  const normalizedMode = ["all","build","fund","connect","pitch"].includes(mode)
    ? mode
    : "all";

  studentCareerFocusState.ventureMode = normalizedMode;

  const items = getStudentCareerVentureModeItems(normalizedMode);
  studentCareerFocusState.filtered = [...items];

  renderStudentCareerFocusResults(items);

  const panel = document.getElementById("studentCareerFocusPanel");
  if (panel){
    panel.scrollIntoView({behavior:"smooth", block:"start"});
  }
}

function bindStudentCareerVentureToolDelegation(){
  if (document.documentElement.dataset.studentVentureToolsBound === "true") return;

  document.addEventListener(
    "click",
    event => {
      const button = event.target.closest("[data-career-venture-tool]");
      if (!button) return;

      const careerSection = document.getElementById("section-career");
      if (!careerSection || !careerSection.contains(button)) return;

      event.preventDefault();
      event.stopPropagation();

      applyStudentCareerVentureMode(
        String(button.dataset.careerVentureTool || "all")
      );
    },
    true
  );

  document.documentElement.dataset.studentVentureToolsBound = "true";
}

bindStudentCareerVentureToolDelegation();

'''

if "function applyStudentCareerVentureMode(mode){" not in s:
    s = s.replace(anchor, helper + anchor, 1)

# Make the selected mode visibly change the content below the four controls.
needle = '''  const activeMode = studentCareerFocusState.ventureMode || "all";\n\n  return `'''
replacement = '''  const activeMode = studentCareerFocusState.ventureMode || "all";\n  const modeCopy = getStudentCareerVentureModeCopy(activeMode);\n\n  return `'''
if needle not in s:
    raise SystemExit("Venture tool render state marker not found")
s = s.replace(needle, replacement, 1)

viewbar_old = '''      <div class="student-career-venture-viewbar">\n        <button type="button" class="${activeMode === "all" ? "active" : ""}" data-career-venture-tool="all">All ventures</button>\n        <span>Choose a Venture action above to focus the results.</span>\n      </div>'''
viewbar_new = '''      <div class="student-career-venture-mode-summary">\n        <div>\n          <span>${escapeHtml(modeCopy.eyebrow)}</span>\n          <strong>${escapeHtml(modeCopy.title)}</strong>\n          <p>${escapeHtml(modeCopy.description)}</p>\n        </div>\n        <button type="button" class="${activeMode === "all" ? "active" : ""}" data-career-venture-tool="all">\n          <i class="fa-solid fa-layer-group" aria-hidden="true"></i>\n          All ventures\n        </button>\n      </div>'''
if viewbar_old not in s:
    raise SystemExit("Venture viewbar markup not found")
s = s.replace(viewbar_old, viewbar_new, 1)

css_old = '''    #section-career .student-career-venture-viewbar{margin-top:10px;padding-top:10px;display:flex;align-items:center;gap:10px;border-top:1px solid #edf0f4;color:#667085;font-size:7px}\n    #section-career .student-career-venture-viewbar button{min-height:27px;padding:0 9px;border:1px solid #dfe4ea;border-radius:999px;background:#fff;color:#475467;font-size:7px;font-weight:700}\n    #section-career .student-career-venture-viewbar button.active{border-color:#7c3aed;background:#f5f3ff;color:#6d28d9}'''
css_new = '''    #section-career .student-career-venture-mode-summary{margin-top:12px;padding:12px 13px;display:flex;align-items:center;justify-content:space-between;gap:14px;border:1px solid #ececf3;border-radius:11px;background:#fafaff}\n    #section-career .student-career-venture-mode-summary>div{min-width:0}\n    #section-career .student-career-venture-mode-summary span{display:block;margin-bottom:3px;color:#7c3aed;font-size:7px;font-weight:800;letter-spacing:.09em}\n    #section-career .student-career-venture-mode-summary strong{display:block;color:#172033;font-size:10px;line-height:1.3}\n    #section-career .student-career-venture-mode-summary p{margin:3px 0 0;color:#667085;font-size:7.5px;line-height:1.45}\n    #section-career .student-career-venture-mode-summary button{min-height:31px;padding:0 10px;display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;border:1px solid #dfe4ea;border-radius:999px;background:#fff;color:#475467;font-size:7px;font-weight:750}\n    #section-career .student-career-venture-mode-summary button.active{border-color:#7c3aed;background:#f5f3ff;color:#6d28d9}'''
if css_old not in s:
    raise SystemExit("Venture viewbar CSS not found")
s = s.replace(css_old, css_new, 1)

# Make each mode noticeably distinct even when the same venture qualifies for multiple categories.
mobile_old = '''@media(max-width:640px){#section-career .student-career-venture-tools-head{display:grid}#section-career .student-career-venture-create{width:100%}#section-career .student-career-venture-tool-grid{grid-template-columns:1fr}#section-career .student-career-venture-viewbar{align-items:flex-start;flex-direction:column}}'''
mobile_new = '''@media(max-width:640px){#section-career .student-career-venture-tools-head{display:grid}#section-career .student-career-venture-create{width:100%}#section-career .student-career-venture-tool-grid{grid-template-columns:1fr}#section-career .student-career-venture-mode-summary{align-items:flex-start;flex-direction:column}#section-career .student-career-venture-mode-summary button{width:100%;justify-content:center}}'''
if mobile_old not in s:
    raise SystemExit("Venture mobile CSS marker not found")
s = s.replace(mobile_old, mobile_new, 1)

p.write_text(s, encoding="utf-8")
