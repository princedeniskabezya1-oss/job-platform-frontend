from pathlib import Path
import re

p = Path("student.js")
s = p.read_text(encoding="utf-8")

anchor = "function ensureStudentCareerVentureToolStyles(){"
if anchor not in s:
    raise SystemExit("Venture tool style function not found")

helper = r'''
function getStudentCareerVentureModeCopy(mode){
  const copy = {
    all:{eyebrow:"VENTURE MARKETPLACE",title:"All live ventures",description:"Explore active AIFT ventures published across the network."},
    build:{eyebrow:"YOUR VENTURES",title:"Build and manage your ideas",description:"Your own ventures appear here so you can continue building, editing and preparing them for support."},
    fund:{eyebrow:"FUNDING",title:"Ventures seeking funding",description:"Projects seeking grants, sponsorship, donations or investment support appear here."},
    connect:{eyebrow:"CONNECT",title:"Ventures seeking people and partners",description:"Find projects looking for mentors, pilots, sponsors and partnership support."},
    pitch:{eyebrow:"INVESTOR READY",title:"Ventures open to investors",description:"Only ventures currently marked as seeking investment are shown here."}
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

      applyStudentCareerVentureMode(String(button.dataset.careerVentureTool || "all"));
    },
    true
  );

  document.documentElement.dataset.studentVentureToolsBound = "true";
}

bindStudentCareerVentureToolDelegation();

'''

if "function applyStudentCareerVentureMode(mode){" not in s:
    s = s.replace(anchor, helper + anchor, 1)

if "const modeCopy = getStudentCareerVentureModeCopy(activeMode);" not in s:
    s, n = re.subn(
        r'(const activeMode\s*=\s*studentCareerFocusState\.ventureMode\s*\|\|\s*"all";)',
        r'\1\n  const modeCopy = getStudentCareerVentureModeCopy(activeMode);',
        s,
        count=1
    )
    if n != 1:
        raise SystemExit("Could not add Venture mode copy")

summary_markup = '''      <div class="student-career-venture-mode-summary">
        <div>
          <span>${escapeHtml(modeCopy.eyebrow)}</span>
          <strong>${escapeHtml(modeCopy.title)}</strong>
          <p>${escapeHtml(modeCopy.description)}</p>
        </div>
        <button type="button" class="${activeMode === "all" ? "active" : ""}" data-career-venture-tool="all">
          <i class="fa-solid fa-layer-group" aria-hidden="true"></i>
          All ventures
        </button>
      </div>'''

if "student-career-venture-mode-summary" not in s:
    s, n = re.subn(
        r'\s*<div class="student-career-venture-viewbar">.*?</div>',
        '\n' + summary_markup,
        s,
        count=1,
        flags=re.S
    )
    if n != 1:
        # Fallback: insert before closing venture tools section template.
        marker = '''      </div>\n    </section>\n  `;'''
        pos = s.find(marker, s.find('function renderStudentCareerVentureTools(){'))
        if pos == -1:
            raise SystemExit("Could not locate Venture tools footer")
        s = s[:pos] + summary_markup + '\n' + s[pos:]

if "#section-career .student-career-venture-mode-summary{" not in s:
    css_anchor = '#section-career .student-career-venture-create:hover{background:#f8f7ff;border-color:#c9b8ff;color:#5b21b6}'
    if css_anchor not in s:
        raise SystemExit("Venture CSS anchor not found")
    css = '''\n    #section-career .student-career-venture-mode-summary{margin-top:12px;padding:12px 13px;display:flex;align-items:center;justify-content:space-between;gap:14px;border:1px solid #ececf3;border-radius:11px;background:#fafaff}\n    #section-career .student-career-venture-mode-summary>div{min-width:0}\n    #section-career .student-career-venture-mode-summary span{display:block;margin-bottom:3px;color:#7c3aed;font-size:7px;font-weight:800;letter-spacing:.09em}\n    #section-career .student-career-venture-mode-summary strong{display:block;color:#172033;font-size:10px;line-height:1.3}\n    #section-career .student-career-venture-mode-summary p{margin:3px 0 0;color:#667085;font-size:7.5px;line-height:1.45}\n    #section-career .student-career-venture-mode-summary button{min-height:31px;padding:0 10px;display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;border:1px solid #dfe4ea;border-radius:999px;background:#fff;color:#475467;font-size:7px;font-weight:750}\n    #section-career .student-career-venture-mode-summary button.active{border-color:#7c3aed;background:#f5f3ff;color:#6d28d9}\n'''
    s = s.replace(css_anchor, css_anchor + css, 1)

# Ensure mobile layout does not break the new summary.
if '#section-career .student-career-venture-mode-summary{align-items:flex-start;flex-direction:column}' not in s:
    s = s.replace(
        '@media(max-width:640px){#section-career .student-career-venture-tools-head{display:grid}',
        '@media(max-width:640px){#section-career .student-career-venture-mode-summary{align-items:flex-start;flex-direction:column}#section-career .student-career-venture-mode-summary button{width:100%;justify-content:center}#section-career .student-career-venture-tools-head{display:grid}',
        1
    )

p.write_text(s, encoding="utf-8")
