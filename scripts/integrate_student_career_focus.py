from pathlib import Path

js_path = Path("student.js")
html_path = Path("student.html")
js = js_path.read_text(encoding="utf-8")
html = html_path.read_text(encoding="utf-8")

helper_marker = """/* =========================================================
   CAREER HUB ACTIONS
========================================================= */
"""

helpers = r'''/* =========================================================
   CAREER HUB FOCUSED CATEGORY WORKSPACE
   Native student.js implementation
========================================================= */

const studentCareerFocusState = {
  active:"",
  items:[],
  filtered:[],
  loading:false
};

const STUDENT_CAREER_FOCUS_CONFIG = Object.freeze({
  internships:{title:"Internships",description:"Build experience with real companies and verified AIFT partners.",icon:"fa-solid fa-briefcase",search:"Search internships..."},
  jobs:{title:"Jobs",description:"Explore graduate, entry-level and career opportunities.",icon:"fa-solid fa-building",search:"Search jobs..."},
  scholarships:{title:"Scholarships",description:"Explore education funding published through AIFT.",icon:"fa-solid fa-graduation-cap",search:"Search scholarships..."},
  partnerships:{title:"Partnerships",description:"Explore school and industry opportunities across the AIFT network.",icon:"fa-solid fa-handshake",search:"Search partnerships..."},
  ventures:{title:"AIFT Ventures",description:"Explore live ventures, projects and funding opportunities.",icon:"fa-solid fa-rocket",search:"Search ventures..."},
  events:{title:"Events",description:"Explore career fairs, Demo Days, workshops and recruitment events.",icon:"fa-solid fa-calendar-days",search:"Search events..."}
});

function getStudentCareerFocusArray(value, keys = []){
  if (Array.isArray(value)) return value;
  for (const key of keys){
    if (Array.isArray(value?.[key])) return value[key];
  }
  return Array.isArray(value?.items) ? value.items : [];
}

function getStudentCareerFocusId(item){
  return normalizeId(item?._id || item?.id || "");
}

function getStudentCareerFocusTitle(item){
  return String(item?.title || item?.name || item?.position || item?.eventName || "AIFT opportunity").trim();
}

function getStudentCareerFocusOrganization(item){
  const owner = item?.employerId || item?.companyId || item?.schoolId || item?.ownerId || item?.organization || {};
  return String(owner?.companyName || owner?.schoolName || owner?.name || item?.companyName || item?.schoolName || item?.organizationName || "AIFT").trim();
}

function getStudentCareerFocusDescription(item){
  return String(item?.summary || item?.description || item?.tagline || item?.problem || "Details are available from the publisher.").trim();
}

function getStudentCareerFocusLocation(item){
  return String(item?.location || item?.workLocation || item?.venue || item?.address || "").trim();
}

function getStudentCareerFocusType(item){
  return String(item?.type || item?.opportunityType || item?.ventureType || item?.employmentType || "").trim();
}

async function loadStudentCareerFocusCategory(category){
  switch(category){
    case "internships":
      return getStudentCareerFocusArray(await apiGet("/api/opportunities?type=internship"), ["opportunities"]);
    case "jobs":
      return getStudentCareerFocusArray(await apiGet("/api/jobs"), ["jobs"]);
    case "scholarships":
      return getStudentCareerFocusArray(await apiGet("/api/scholarships"), ["scholarships"]);
    case "ventures":
      return getStudentCareerFocusArray(await apiGet("/api/ventures"), ["ventures"]);
    case "events":
      return getStudentCareerFocusArray(await apiGet("/api/career-events"), ["events"]);
    case "partnerships":{
      const results = await Promise.allSettled([
        apiGet("/api/opportunities?type=collaboration"),
        apiGet("/api/opportunities?type=placement"),
        apiGet("/api/school-company-partnerships")
      ]);
      const combined = [];
      for (const result of results){
        if (result.status !== "fulfilled") continue;
        combined.push(...getStudentCareerFocusArray(result.value,["opportunities","partnerships"]));
      }
      const seen = new Set();
      return combined.filter(item => {
        const key = getStudentCareerFocusId(item) || `${getStudentCareerFocusTitle(item)}-${getStudentCareerFocusOrganization(item)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    default:
      return [];
  }
}

function updateStudentCareerFocusSelection(category){
  document.querySelectorAll("#section-career .student-career-category-card").forEach(card => {
    card.classList.toggle("career-focus-selected", card.dataset.careerAction === category);
  });
}

function renderStudentCareerFocusResults(items){
  const container = $("studentCareerFocusResults");
  const count = $("studentCareerFocusResultCount");
  const config = STUDENT_CAREER_FOCUS_CONFIG[studentCareerFocusState.active];
  if (count) count.textContent = `${items.length} result${items.length === 1 ? "" : "s"}`;
  if (!container || !config) return;

  if (!items.length){
    container.innerHTML = `
      <div class="student-career-focus-empty">
        <span><i class="fa-regular fa-folder-open"></i></span>
        <strong>No live ${escapeHtml(config.title.toLowerCase())} available right now.</strong>
        <p>New AIFT opportunities will appear here automatically when they are published.</p>
      </div>`;
    return;
  }

  container.innerHTML = items.map(item => {
    const itemId = getStudentCareerFocusId(item);
    const itemTitle = getStudentCareerFocusTitle(item);
    const organization = getStudentCareerFocusOrganization(item);
    const description = getStudentCareerFocusDescription(item);
    const location = getStudentCareerFocusLocation(item);
    const itemType = getStudentCareerFocusType(item).replace(/[-_]/g," ");

    return `
      <article class="student-career-focus-result">
        <span class="student-career-focus-result-icon"><i class="${config.icon}"></i></span>
        <div class="student-career-focus-result-copy">
          <strong>${escapeHtml(itemTitle)}</strong>
          <span>${escapeHtml(organization)}</span>
          <p>${escapeHtml(description)}</p>
          <div class="student-career-focus-result-meta">
            ${itemType ? `<span>${escapeHtml(itemType)}</span>` : ""}
            ${location ? `<span>${escapeHtml(location)}</span>` : ""}
          </div>
        </div>
        <div class="student-career-focus-result-actions">
          ${studentCareerFocusState.active === "jobs" && itemId ? `<button type="button" class="student-career-primary-button" data-career-open-job="${escapeHtml(itemId)}">View job</button>` : ""}
          ${studentCareerFocusState.active === "ventures" && itemId ? `<button type="button" class="student-career-primary-button" data-career-open-venture="${escapeHtml(itemId)}">View venture</button>` : ""}
        </div>
      </article>`;
  }).join("");
}

function filterStudentCareerFocusResults(value){
  const query = String(value || "").trim().toLowerCase();
  studentCareerFocusState.filtered = !query
    ? [...studentCareerFocusState.items]
    : studentCareerFocusState.items.filter(item => `${getStudentCareerFocusTitle(item)} ${getStudentCareerFocusOrganization(item)} ${getStudentCareerFocusDescription(item)} ${getStudentCareerFocusLocation(item)} ${getStudentCareerFocusType(item)}`.toLowerCase().includes(query));
  renderStudentCareerFocusResults(studentCareerFocusState.filtered);
}

async function openStudentCareerFocus(category){
  const config = STUDENT_CAREER_FOCUS_CONFIG[category];
  const panel = $("studentCareerFocusPanel");
  const main = document.querySelector("#section-career .student-career-main");
  if (!config || !panel || !main) return;

  studentCareerFocusState.active = category;
  studentCareerFocusState.loading = true;

  main.querySelectorAll(":scope > .student-career-card").forEach(card => {
    card.hidden = true;
  });

  panel.hidden = false;
  updateStudentCareerFocusSelection(category);
  setText("studentCareerFocusTitle", config.title);
  setText("studentCareerFocusDescription", config.description);
  setText("studentCareerFocusResultCount", "Loading...");

  const search = $("studentCareerFocusSearch");
  if (search){
    search.value = "";
    search.placeholder = config.search;
  }

  const results = $("studentCareerFocusResults");
  if (results){
    results.innerHTML = `<div class="student-career-focus-empty"><span><i class="fa-solid fa-circle-notch fa-spin"></i></span><strong>Loading ${escapeHtml(config.title.toLowerCase())}...</strong></div>`;
  }

  panel.scrollIntoView({behavior:"smooth",block:"start"});

  try{
    const items = await loadStudentCareerFocusCategory(category);
    studentCareerFocusState.items = items;
    studentCareerFocusState.filtered = [...items];
    renderStudentCareerFocusResults(items);
  }catch(error){
    console.error("Career Hub focused category load failed:", error);
    studentCareerFocusState.items = [];
    studentCareerFocusState.filtered = [];
    if (results){
      results.innerHTML = `<div class="student-career-focus-empty error"><span><i class="fa-solid fa-triangle-exclamation"></i></span><strong>${escapeHtml(error?.message || "This category could not be loaded.")}</strong><p>Use Refresh to try again.</p></div>`;
    }
    setText("studentCareerFocusResultCount", "Unable to load");
  }finally{
    studentCareerFocusState.loading = false;
  }
}

'''

if "const studentCareerFocusState = {" not in js:
    if helper_marker not in js:
        raise SystemExit("Career Hub action marker not found")
    js = js.replace(helper_marker, helpers + helper_marker, 1)

action_needle = """  const scrollToCareerElement =
    id => {
"""
guard = """  if (Object.prototype.hasOwnProperty.call(
    STUDENT_CAREER_FOCUS_CONFIG,
    normalizedAction
  )){
    openStudentCareerFocus(normalizedAction);
    return;
  }


"""
if "openStudentCareerFocus(normalizedAction);" not in js:
    if action_needle not in js:
        raise SystemExit("Career action insertion point not found")
    js = js.replace(action_needle, guard + action_needle, 1)

main_marker = """        <main class=\"student-career-main\">\n\n\n          <!-- ===============================================\n               RECOMMENDED FOR YOU\n"""
focus_markup = """        <main class=\"student-career-main\">\n\n          <section\n            id=\"studentCareerFocusPanel\"\n            class=\"student-career-focus-panel\"\n            hidden\n          >\n            <header class=\"student-career-focus-panel-header\">\n              <div>\n                <span>EXPLORE AIFT</span>\n                <h3 id=\"studentCareerFocusTitle\">Choose an opportunity</h3>\n                <p id=\"studentCareerFocusDescription\">Select one of the six opportunity categories above.</p>\n              </div>\n              <div class=\"student-career-focus-panel-tools\">\n                <label>\n                  <i class=\"fa-solid fa-magnifying-glass\" aria-hidden=\"true\"></i>\n                  <input id=\"studentCareerFocusSearch\" type=\"search\" placeholder=\"Search opportunities...\" autocomplete=\"off\">\n                </label>\n                <button type=\"button\" class=\"student-career-secondary-button\" data-career-focus-refresh>\n                  <i class=\"fa-solid fa-rotate-right\" aria-hidden=\"true\"></i>\n                  Refresh\n                </button>\n              </div>\n            </header>\n            <div class=\"student-career-focus-panel-summary\">\n              <strong id=\"studentCareerFocusResultCount\">Select a category</strong>\n            </div>\n            <div id=\"studentCareerFocusResults\" class=\"student-career-focus-results\"></div>\n          </section>\n\n\n          <!-- ===============================================\n               RECOMMENDED FOR YOU\n"""
if 'id="studentCareerFocusPanel"' not in js:
    if main_marker not in js:
        raise SystemExit("Career main column insertion point not found")
    js = js.replace(main_marker, focus_markup, 1)

bind_marker = """  workspace.addEventListener(
    \"click\",
    event => {
"""
focus_binding = """  workspace.addEventListener(
    \"input\",
    event => {
      if (event.target?.id === \"studentCareerFocusSearch\"){
        filterStudentCareerFocusResults(event.target.value);
      }
    }
  );


  workspace.addEventListener(
    \"click\",
    event => {
      const refreshFocusButton =
        event.target.closest(\"[data-career-focus-refresh]\");

      if (refreshFocusButton && workspace.contains(refreshFocusButton)){
        event.preventDefault();
        if (studentCareerFocusState.active){
          openStudentCareerFocus(studentCareerFocusState.active);
        }
        return;
      }

"""
segment_start = js.find("function bindStudentCareerHubControls")
segment_end = js.find("async function renderStudentCareerHub")
segment = js[segment_start:segment_end]
if 'event.target?.id === "studentCareerFocusSearch"' not in segment:
    if bind_marker not in js:
        raise SystemExit("Career workspace click binding not found")
    js = js.replace(bind_marker, focus_binding, 1)

css = r'''
<style id="studentCareerFocusNativeStyles">
#section-career .student-career-focus-panel{overflow:hidden;border:1px solid var(--career-border-soft,#e4e9f2);border-radius:16px;background:#fff;box-shadow:0 8px 24px rgba(15,23,42,.045)}
#section-career .student-career-focus-panel[hidden]{display:none!important}
#section-career .student-career-focus-panel-header{min-height:92px;padding:18px 20px;display:flex;align-items:flex-start;justify-content:space-between;gap:20px;border-bottom:1px solid var(--career-border-soft,#e4e9f2)}
#section-career .student-career-focus-panel-header>div:first-child{min-width:0}
#section-career .student-career-focus-panel-header span{color:#1677ff;font-size:8px;font-weight:850;letter-spacing:.08em}
#section-career .student-career-focus-panel-header h3{margin:3px 0 4px;color:#101828;font-size:18px;line-height:1.2}
#section-career .student-career-focus-panel-header p{margin:0;color:#667085;font-size:9px}
#section-career .student-career-focus-panel-tools{display:flex;align-items:center;gap:8px}
#section-career .student-career-focus-panel-tools label{width:min(330px,30vw);height:38px;padding:0 12px;display:flex;align-items:center;gap:8px;border:1px solid #d9e2ef;border-radius:10px;background:#fff}
#section-career .student-career-focus-panel-tools label:focus-within{border-color:#1677ff;box-shadow:0 0 0 3px rgba(22,119,255,.10)}
#section-career .student-career-focus-panel-tools input{width:100%;border:0;outline:0;background:transparent;color:#101828;font-size:9px}
#section-career .student-career-focus-panel-summary{padding:10px 20px;border-bottom:1px solid #edf1f6;background:#fbfcfe}
#section-career .student-career-focus-panel-summary strong{color:#475467;font-size:8px}
#section-career .student-career-focus-results{padding:10px;display:grid;gap:8px}
#section-career .student-career-focus-result{min-height:82px;padding:12px;display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:12px;border:1px solid #e5eaf2;border-radius:12px;background:#fff}
#section-career .student-career-focus-result:hover{border-color:#cbd8eb;box-shadow:0 7px 20px rgba(15,23,42,.055)}
#section-career .student-career-focus-result-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;background:#eef5ff;color:#1677ff}
#section-career .student-career-focus-result-copy{min-width:0;display:grid;gap:3px}
#section-career .student-career-focus-result-copy>strong{color:#101828;font-size:10px}
#section-career .student-career-focus-result-copy>span{color:#667085;font-size:8px}
#section-career .student-career-focus-result-copy p{margin:2px 0 0;overflow:hidden;color:#667085;font-size:8px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
#section-career .student-career-focus-result-meta{display:flex;flex-wrap:wrap;gap:5px;margin-top:3px}
#section-career .student-career-focus-result-meta span{padding:3px 7px;border-radius:999px;background:#f2f4f7;color:#475467;font-size:7px;text-transform:capitalize}
#section-career .student-career-focus-result-actions{display:flex;gap:7px;align-items:center}
#section-career .student-career-focus-empty{min-height:170px;display:grid;place-items:center;align-content:center;gap:7px;text-align:center}
#section-career .student-career-focus-empty>span{width:44px;height:44px;display:grid;place-items:center;border-radius:13px;background:#eef5ff;color:#1677ff}
#section-career .student-career-focus-empty strong{color:#101828;font-size:10px}
#section-career .student-career-focus-empty p{max-width:430px;margin:0;color:#667085;font-size:8px}
#section-career .student-career-category-card.career-focus-selected{border-color:#1677ff!important;box-shadow:0 0 0 2px rgba(22,119,255,.10)!important}
@media(max-width:980px){#section-career .student-career-focus-panel-header{flex-direction:column}#section-career .student-career-focus-panel-tools{width:100%}#section-career .student-career-focus-panel-tools label{width:100%}}
@media(max-width:700px){#section-career .student-career-focus-result{grid-template-columns:40px minmax(0,1fr)}#section-career .student-career-focus-result-actions{grid-column:1/-1;padding-left:52px}}
</style>
'''

if 'id="studentCareerFocusNativeStyles"' not in html:
    if "</head>" not in html:
        raise SystemExit("student.html head end not found")
    html = html.replace("</head>", css + "\n</head>", 1)

js_path.write_text(js, encoding="utf-8")
html_path.write_text(html, encoding="utf-8")
