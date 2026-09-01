(() => {
  "use strict";

  const API = "https://backend-1-9b6f.onrender.com";
  const PAGE = String(location.pathname.split("/").pop() || "").toLowerCase();
  const ROLE = String(localStorage.getItem("role") || "").trim().toLowerCase();
  const SUPPORTED = new Set(["school.html", "employer.html"]);

  if (!SUPPORTED.has(PAGE)) return;

  const state = {
    kind: "",
    partnerItems: [],
    busy: false,
    workspaceId: "",
    workspace: null,
    previousDocumentOverflow: "",
    previousBodyOverflow: ""
  };

  const legacy = {
    schoolOpportunity: window.openCareerOpportunityComposer,
    schoolScholarship: window.openCareerScholarshipComposer,
    schoolPartnership: window.openCareerPartnershipComposer,
    schoolEvent: window.openCareerEventComposer,
    employerOpportunity: window.openEmployerCareerOpportunityBuilder,
    employerPartnership: window.openEmployerCareerPartnershipComposer,
    employerEvent: window.openEmployerCareerEventComposer
  };

  function token() {
    const map = {
      school: "schoolToken",
      employer: "employerToken",
      company: "employerToken",
      admin: "adminToken"
    };

    for (const key of [
      map[ROLE],
      "token",
      "schoolToken",
      "employerToken",
      "adminToken"
    ].filter(Boolean)) {
      const stored = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (stored) return stored;
    }

    return "";
  }

  function currentUserId() {
    return String(
      localStorage.getItem("userId") ||
      localStorage.getItem("_id") ||
      sessionStorage.getItem("userId") ||
      ""
    );
  }

  function pageRole() {
    return ROLE === "company" ? "employer" : ROLE;
  }

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function title(value) {
    return String(value || "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function normalizeId(value) {
    if (value && typeof value === "object") {
      return String(value._id || value.id || "");
    }
    return String(value || "");
  }

  function sameId(left, right) {
    const a = normalizeId(left);
    const b = normalizeId(right);
    return Boolean(a && b && a === b);
  }

  function displayName(user, fallback = "AIFT organization") {
    return user?.companyName || user?.schoolName || user?.name || fallback;
  }

  function value(id) {
    return String(document.getElementById(id)?.value || "").trim();
  }

  function checked(id) {
    return document.getElementById(id)?.checked === true;
  }

  function checkedValues(name) {
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)]
      .map(input => input.value);
  }

  function comma(id) {
    return value(id)
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);
  }

  function boolMap(name) {
    const selected = new Set(checkedValues(name));
    return {
      internships: selected.has("internships"),
      jobs: selected.has("jobs"),
      recruitment: selected.has("recruitment"),
      training: selected.has("training"),
      careerEvents: selected.has("careerEvents"),
      scholarships: selected.has("scholarships"),
      mentorship: selected.has("mentorship"),
      research: selected.has("research")
    };
  }

  function formatDate(value, withTime = true) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString([], withTime
      ? { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
      : { year: "numeric", month: "short", day: "numeric" }
    );
  }

  async function api(path, options = {}) {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        Authorization: `Bearer ${token()}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed (${response.status})`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  function lockPageScroll() {
    state.previousDocumentOverflow = document.documentElement.style.overflow;
    state.previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  function unlockPageScroll() {
    document.documentElement.style.overflow = state.previousDocumentOverflow;
    document.body.style.overflow = state.previousBodyOverflow;
  }

  function ensureStyle() {
    if (document.getElementById("aiftCareerCreateStyle")) return;

    const style = document.createElement("style");
    style.id = "aiftCareerCreateStyle";
    style.textContent = `
      .aift-career-create-overlay{
        position:fixed;
        inset:0;
        z-index:999990;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:16px;
        overflow-y:auto;
        overscroll-behavior:contain;
        background:rgba(15,23,42,.48);
        backdrop-filter:blur(5px);
        -webkit-backdrop-filter:blur(5px);
        font-family:Inter,Arial,sans-serif;
      }

      .aift-career-create-overlay[hidden]{display:none!important}

      .aift-career-create-modal{
        width:min(820px,100%);
        height:min(900px,calc(100dvh - 32px));
        max-height:calc(100dvh - 32px);
        min-height:0;
        display:flex;
        flex-direction:column;
        overflow:hidden;
        background:#fff;
        border:1px solid #dfe6ee;
        border-radius:18px;
        box-shadow:0 30px 90px rgba(15,23,42,.28);
      }

      #aiftCareerCreateMount{
        width:100%;
        height:100%;
        min-height:0;
        display:flex;
        flex-direction:column;
      }

      #aiftCareerCreateForm{
        flex:1 1 auto;
        min-height:0;
        display:flex;
        flex-direction:column;
        overflow:hidden;
      }

      .aift-career-create-head{
        flex:0 0 auto;
        display:flex;
        justify-content:space-between;
        gap:18px;
        padding:18px 20px 14px;
        border-bottom:1px solid #e8edf3;
        background:linear-gradient(180deg,#fff,#fbfcfe);
      }

      .aift-career-create-kicker{
        font-size:10px;
        font-weight:850;
        letter-spacing:.08em;
        text-transform:uppercase;
        color:#0a66c2;
      }

      .aift-career-create-head h2{
        margin:5px 0 4px;
        font-size:20px;
        line-height:1.2;
        color:#101828;
      }

      .aift-career-create-head p{
        max-width:620px;
        margin:0;
        color:#667085;
        font-size:11px;
        line-height:1.55;
      }

      .aift-career-create-close{
        width:36px;
        height:36px;
        flex:0 0 36px;
        border:1px solid #e4e7ec;
        border-radius:9px;
        background:#fff;
        color:#667085;
        font-size:22px;
        line-height:1;
        cursor:pointer;
      }

      .aift-career-trust-strip{
        flex:0 0 auto;
        display:grid;
        grid-template-columns:repeat(3,1fr);
        border-bottom:1px solid #e8edf3;
        background:#f8fafc;
      }

      .aift-career-trust-step{
        padding:9px 12px;
        border-right:1px solid #e8edf3;
        color:#667085;
        font-size:9.5px;
        line-height:1.4;
      }

      .aift-career-trust-step:last-child{border-right:0}
      .aift-career-trust-step strong{display:block;margin-bottom:2px;color:#344054;font-size:10px}

      .aift-career-create-body,
      .aift-partnership-workspace-body{
        flex:1 1 auto;
        min-height:0;
        overflow-y:auto;
        overflow-x:hidden;
        overscroll-behavior:contain;
        -webkit-overflow-scrolling:touch;
        padding:18px 20px 24px;
        scrollbar-gutter:stable;
      }

      .aift-career-create-body:after,
      .aift-partnership-workspace-body:after{
        content:"";
        display:block;
        height:12px;
      }

      .aift-career-section{margin-bottom:20px}
      .aift-career-section:last-child{margin-bottom:4px}
      .aift-career-section-title{margin-bottom:11px}
      .aift-career-section-title strong{display:block;color:#101828;font-size:13px}
      .aift-career-section-title span{display:block;margin-top:3px;color:#667085;font-size:10px;line-height:1.5}

      .aift-career-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .aift-career-grid.one{grid-template-columns:1fr}
      .aift-career-field{display:flex;flex-direction:column;gap:5px;min-width:0}
      .aift-career-field.full{grid-column:1/-1}
      .aift-career-field label{font-size:10px;font-weight:800;color:#344054}
      .aift-career-field label b{color:#d92d20}

      .aift-career-field input,
      .aift-career-field select,
      .aift-career-field textarea{
        width:100%;
        border:1px solid #d7dee8;
        border-radius:9px;
        background:#fff;
        color:#101828;
        font:500 12px/1.4 Inter,Arial,sans-serif;
        outline:none;
      }

      .aift-career-field input,
      .aift-career-field select{height:40px;padding:0 11px}
      .aift-career-field textarea{min-height:86px;padding:10px 11px;resize:vertical}

      .aift-career-field input:focus,
      .aift-career-field select:focus,
      .aift-career-field textarea:focus{
        border-color:#80b6e9;
        box-shadow:0 0 0 3px rgba(10,102,194,.08);
      }

      .aift-career-field small{color:#98a2b3;font-size:9px;line-height:1.4}

      .aift-career-choice-grid{
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:8px;
      }

      .aift-career-choice{position:relative}
      .aift-career-choice input{position:absolute;opacity:0;pointer-events:none}
      .aift-career-choice span{
        min-height:40px;
        padding:8px 9px;
        display:flex;
        align-items:center;
        justify-content:center;
        text-align:center;
        border:1px solid #dbe3ec;
        border-radius:9px;
        background:#fff;
        color:#475467;
        font-size:10px;
        font-weight:750;
        cursor:pointer;
      }
      .aift-career-choice input:checked+span{
        border-color:#84b8ea;
        background:#eef6ff;
        color:#0a66c2;
        box-shadow:0 0 0 2px rgba(10,102,194,.05);
      }

      .aift-career-note{
        padding:11px 12px;
        border:1px solid #d7e8f8;
        border-radius:10px;
        background:#f4f9ff;
        color:#34506f;
        font-size:10px;
        line-height:1.55;
      }
      .aift-career-note strong{color:#0a66c2}

      .aift-career-error{
        flex:0 0 auto;
        margin:0 20px 10px;
        padding:10px 12px;
        border:1px solid #f1c6c6;
        border-radius:9px;
        background:#fff5f5;
        color:#b42318;
        font-size:10px;
      }
      .aift-career-error[hidden]{display:none!important}

      .aift-career-create-foot{
        flex:0 0 auto;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        padding:12px 20px calc(12px + env(safe-area-inset-bottom));
        border-top:1px solid #e8edf3;
        background:#fff;
        box-shadow:0 -6px 18px rgba(15,23,42,.04);
      }

      .aift-career-foot-copy{color:#667085;font-size:9px;line-height:1.45}
      .aift-career-foot-actions{display:flex;gap:8px}

      .aift-career-btn{
        min-height:38px;
        padding:0 14px;
        border:1px solid #d7dee8;
        border-radius:9px;
        background:#fff;
        color:#344054;
        font-size:10px;
        font-weight:850;
        cursor:pointer;
      }
      .aift-career-btn.primary{border-color:#0a66c2;background:#0a66c2;color:#fff}
      .aift-career-btn.success{border-color:#15803d;background:#15803d;color:#fff}
      .aift-career-btn.danger{border-color:#efcaca;background:#fff5f5;color:#b42318}
      .aift-career-btn:disabled{opacity:.55;cursor:not-allowed}

      .aift-career-success{
        flex:1;
        min-height:0;
        overflow-y:auto;
        padding:34px 28px 30px;
        text-align:center;
      }
      .aift-career-success-icon{
        width:54px;
        height:54px;
        margin:0 auto 14px;
        display:grid;
        place-items:center;
        border-radius:50%;
        background:#e8f7ee;
        color:#16713c;
        font-size:24px;
        font-weight:900;
      }
      .aift-career-success h3{margin:0 0 7px;color:#101828;font-size:19px}
      .aift-career-success p{max-width:520px;margin:0 auto;color:#667085;font-size:11px;line-height:1.6}
      .aift-career-success-steps{
        margin:20px auto;
        max-width:600px;
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:8px;
        text-align:left;
      }
      .aift-career-success-steps div{
        padding:11px;
        border:1px solid #e4e9f0;
        border-radius:10px;
        background:#fbfcfe;
        color:#667085;
        font-size:9px;
        line-height:1.45;
      }
      .aift-career-success-steps strong{display:block;margin-bottom:3px;color:#344054;font-size:10px}

      .aift-partnership-workspace-headline{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:14px;
        margin-bottom:14px;
      }
      .aift-partnership-workspace-headline h3{margin:0;color:#101828;font-size:17px}
      .aift-partnership-workspace-headline p{margin:4px 0 0;color:#667085;font-size:10px;line-height:1.5}

      .aift-partnership-status{
        flex:0 0 auto;
        padding:6px 9px;
        border-radius:999px;
        background:#eef2ff;
        color:#4338ca;
        font-size:9px;
        font-weight:850;
      }
      .aift-partnership-status.review{background:#fff4dc;color:#9a6500}
      .aift-partnership-status.approved{background:#eaf3ff;color:#0a66c2}
      .aift-partnership-status.active{background:#e8f7ee;color:#16713c}

      .aift-partnership-flow{
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:7px;
        margin-bottom:18px;
      }
      .aift-partnership-flow div{
        padding:9px;
        border:1px solid #e4e9f0;
        border-radius:9px;
        background:#fbfcfe;
        color:#667085;
        font-size:9px;
        line-height:1.4;
      }
      .aift-partnership-flow strong{display:block;margin-bottom:3px;color:#344054;font-size:9.5px}

      .aift-workspace-card{
        margin-bottom:12px;
        padding:14px;
        border:1px solid #e4e9f0;
        border-radius:12px;
        background:#fff;
      }
      .aift-workspace-card-head{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-bottom:10px;
      }
      .aift-workspace-card-head strong{color:#101828;font-size:12px}
      .aift-workspace-card-head span{color:#98a2b3;font-size:9px}

      .aift-workspace-item{
        padding:11px 0;
        border-top:1px solid #eef2f6;
      }
      .aift-workspace-item:first-child{border-top:0;padding-top:0}
      .aift-workspace-item:last-child{padding-bottom:0}
      .aift-workspace-item-top{display:flex;justify-content:space-between;gap:10px}
      .aift-workspace-item strong{display:block;color:#101828;font-size:11px}
      .aift-workspace-item p{margin:4px 0 0;color:#667085;font-size:10px;line-height:1.5}
      .aift-workspace-meta{margin-top:6px;color:#98a2b3;font-size:9px}
      .aift-workspace-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}

      .aift-workspace-chip{
        padding:5px 7px;
        border-radius:999px;
        background:#f2f4f7;
        color:#475467;
        font-size:8.5px;
        font-weight:800;
      }
      .aift-workspace-chip.agreed,.aift-workspace-chip.scheduled{background:#e8f7ee;color:#16713c}
      .aift-workspace-chip.declined{background:#fdeceb;color:#b42318}
      .aift-workspace-chip.proposed,.aift-workspace-chip.requested{background:#fff4dc;color:#9a6500}

      .aift-workspace-split{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:12px;
      }

      .aift-workspace-empty{
        padding:16px;
        border:1px dashed #d8e0ea;
        border-radius:10px;
        background:#fbfcfe;
        color:#667085;
        text-align:center;
        font-size:10px;
        line-height:1.55;
      }

      .aift-workspace-loading{
        flex:1;
        display:grid;
        place-items:center;
        padding:40px;
        color:#667085;
        font-size:11px;
      }

      @media(max-width:700px){
        .aift-career-create-overlay{
          padding:0;
          align-items:flex-end;
          overflow:hidden;
        }

        .aift-career-create-modal{
          width:100%;
          height:calc(100dvh - env(safe-area-inset-top));
          max-height:calc(100dvh - env(safe-area-inset-top));
          border-radius:18px 18px 0 0;
          border-left:0;
          border-right:0;
          border-bottom:0;
        }

        .aift-career-create-head{padding:16px 16px 13px}
        .aift-career-trust-strip{grid-template-columns:1fr}
        .aift-career-trust-step{border-right:0;border-bottom:1px solid #e8edf3;padding:7px 16px}
        .aift-career-trust-step:last-child{border-bottom:0}
        .aift-career-create-body,.aift-partnership-workspace-body{padding:15px 16px 24px}
        .aift-career-grid,.aift-workspace-split{grid-template-columns:1fr}
        .aift-career-field.full{grid-column:auto}
        .aift-career-choice-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .aift-partnership-flow{grid-template-columns:repeat(2,minmax(0,1fr))}
        .aift-career-success-steps{grid-template-columns:1fr}
        .aift-career-create-foot{align-items:stretch;flex-direction:column;padding:10px 16px calc(10px + env(safe-area-inset-bottom))}
        .aift-career-foot-actions{width:100%}
        .aift-career-btn{flex:1}
      }
    `;

    document.head.appendChild(style);
  }

  function ensureModal() {
    ensureStyle();

    if (document.getElementById("aiftCareerCreateOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "aiftCareerCreateOverlay";
    overlay.className = "aift-career-create-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <section
        class="aift-career-create-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aiftCareerCreateTitle"
      >
        <div id="aiftCareerCreateMount"></div>
      </section>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeModal();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !overlay.hidden) closeModal();
    });
  }

  const labels = {
    opportunity: {
      title: "Create an opportunity",
      sub: "Add the important details only. AIFT reviews the opportunity before students can discover it."
    },
    scholarship: {
      title: "Create a scholarship",
      sub: "Keep the scholarship clear and easy to understand. AIFT reviews it before applications open."
    },
    partnership: {
      title: "Request a partnership",
      sub: "Choose the organization and the areas you want to work on. AIFT verifies the introduction before private agreement work begins."
    },
    event: {
      title: "Create a career event",
      sub: "Choose the audience, date and format without typing system codes. AIFT reviews the event before publication."
    }
  };

  function trustStrip(kind) {
    if (kind === "partnership") {
      return `
        <div class="aift-career-trust-strip">
          <div class="aift-career-trust-step"><strong>1. Send proposal</strong>Choose the partner and purpose.</div>
          <div class="aift-career-trust-step"><strong>2. AIFT verifies</strong>The private workspace opens after verification.</div>
          <div class="aift-career-trust-step"><strong>3. Agree & activate</strong>Meet, agree on scope, then approve the relationship.</div>
        </div>
      `;
    }

    return `
      <div class="aift-career-trust-strip">
        <div class="aift-career-trust-step"><strong>1. You submit</strong>Fill in the important details only.</div>
        <div class="aift-career-trust-step"><strong>2. AIFT reviews</strong>The creator cannot self-approve publication.</div>
        <div class="aift-career-trust-step"><strong>3. Goes live</strong>Approved listings become available in Career Hub.</div>
      </div>
    `;
  }

  function shell(kind, body) {
    const copy = labels[kind];

    return `
      <header class="aift-career-create-head">
        <div>
          <div class="aift-career-create-kicker">AIFT Career Hub</div>
          <h2 id="aiftCareerCreateTitle">${esc(copy.title)}</h2>
          <p>${esc(copy.sub)}</p>
        </div>
        <button type="button" class="aift-career-create-close" data-aift-career-close aria-label="Close">×</button>
      </header>

      ${trustStrip(kind)}

      <form id="aiftCareerCreateForm">
        <div class="aift-career-create-body">${body}</div>
        <div id="aiftCareerCreateError" class="aift-career-error" hidden></div>
        <footer class="aift-career-create-foot">
          <div class="aift-career-foot-copy">Track the request from <strong>AIFT Activity</strong>.</div>
          <div class="aift-career-foot-actions">
            <button type="button" class="aift-career-btn" data-aift-career-close>Cancel</button>
            <button id="aiftCareerSubmit" type="submit" class="aift-career-btn primary">Submit to AIFT</button>
          </div>
        </footer>
      </form>
    `;
  }

  function option(optionValue, label) {
    return `<option value="${esc(optionValue)}">${esc(label)}</option>`;
  }

  function choiceInput(name, optionValue, label, selected = false) {
    return `
      <label class="aift-career-choice">
        <input type="checkbox" name="${esc(name)}" value="${esc(optionValue)}" ${selected ? "checked" : ""}>
        <span>${esc(label)}</span>
      </label>
    `;
  }

  function opportunityForm(defaultType = "internship") {
    return shell("opportunity", `
      <section class="aift-career-section">
        <div class="aift-career-section-title">
          <strong>Opportunity</strong>
          <span>What are you offering?</span>
        </div>
        <div class="aift-career-grid">
          <div class="aift-career-field full">
            <label>Title <b>*</b></label>
            <input id="aiftCareerTitle" maxlength="220" required placeholder="Example: Marketing Internship">
          </div>
          <div class="aift-career-field">
            <label>Type</label>
            <select id="aiftCareerType">
              ${option("internship", "Internship")}
              ${option("job", "Job opportunity")}
              ${option("project", "Student project")}
              ${option("placement", "Work placement")}
              ${option("collaboration", "Collaboration")}
              ${option("career_talk", "Career talk")}
            </select>
          </div>
          <div class="aift-career-field">
            <label>Work setup</label>
            <select id="aiftCareerWorkSetup">
              ${option("unspecified", "Not important")}
              ${option("onsite", "On-site")}
              ${option("remote", "Remote")}
              ${option("hybrid", "Hybrid")}
              ${option("flexible", "Flexible")}
            </select>
          </div>
          <div class="aift-career-field full">
            <label>Description</label>
            <textarea id="aiftCareerSummary" maxlength="1000" placeholder="What will the student do and what should they know before applying?"></textarea>
          </div>
        </div>
      </section>

      <section class="aift-career-section">
        <div class="aift-career-section-title">
          <strong>Practical details</strong>
          <span>Optional details can be added later.</span>
        </div>
        <div class="aift-career-grid">
          <div class="aift-career-field"><label>Location</label><input id="aiftCareerLocation" maxlength="500" placeholder="Makati, Remote, Campus..."></div>
          <div class="aift-career-field"><label>Application deadline</label><input id="aiftCareerDeadline" type="date"></div>
          <div class="aift-career-field"><label>Available slots</label><input id="aiftCareerSlots" type="number" min="1" placeholder="Example: 10"></div>
          <div class="aift-career-field">
            <label>Compensation</label>
            <select id="aiftCareerCompensation">
              ${option("not_specified", "Not specified")}
              ${option("paid", "Paid")}
              ${option("allowance", "Allowance")}
              ${option("stipend", "Stipend")}
              ${option("salary", "Salary")}
              ${option("unpaid", "Unpaid")}
              ${option("negotiable", "Negotiable")}
            </select>
          </div>
          <div class="aift-career-field full"><label>Programs / courses</label><input id="aiftCareerPrograms" placeholder="Example: IT, Marketing, Business"></div>
          <div class="aift-career-field full"><label>Skills</label><input id="aiftCareerSkills" placeholder="Example: JavaScript, Communication, Excel"></div>
        </div>
      </section>

      <div class="aift-career-note"><strong>AIFT review:</strong> this opportunity stays private until AIFT approves it for Career Hub publication.</div>
    `).replace(
      `<option value="${esc(defaultType)}">`,
      `<option value="${esc(defaultType)}" selected>`
    );
  }

  function scholarshipForm() {
    return shell("scholarship", `
      <section class="aift-career-section">
        <div class="aift-career-section-title"><strong>Scholarship</strong><span>Keep the offer simple and clear.</span></div>
        <div class="aift-career-grid">
          <div class="aift-career-field full"><label>Scholarship name <b>*</b></label><input id="aiftCareerTitle" maxlength="300" required placeholder="Example: Future Technology Scholarship"></div>
          <div class="aift-career-field">
            <label>Scholarship type</label>
            <select id="aiftScholarshipType">
              ${option("academic", "Academic")}
              ${option("merit", "Merit")}
              ${option("need_based", "Financial need")}
              ${option("leadership", "Leadership")}
              ${option("research", "Research")}
              ${option("athletic", "Athletic")}
              ${option("community", "Community service")}
              ${option("company_sponsored", "Company sponsored")}
              ${option("government", "Government")}
              ${option("international", "International")}
              ${option("other", "Other")}
            </select>
          </div>
          <div class="aift-career-field">
            <label>Funding</label>
            <select id="aiftScholarshipFundingType">
              ${option("full", "Full scholarship")}
              ${option("partial", "Partial scholarship")}
              ${option("fixed_amount", "Fixed amount")}
              ${option("tuition_only", "Tuition only")}
              ${option("allowance", "Allowance")}
              ${option("mixed", "Mixed support")}
            </select>
          </div>
          <div class="aift-career-field full"><label>Description</label><textarea id="aiftCareerSummary" maxlength="1500" placeholder="Who is this scholarship for and what does it support?"></textarea></div>
        </div>
      </section>

      <section class="aift-career-section">
        <div class="aift-career-section-title"><strong>Eligibility & award</strong><span>Only add what students really need to know.</span></div>
        <div class="aift-career-grid">
          <div class="aift-career-field"><label>Amount</label><input id="aiftScholarshipAmount" type="number" min="0" placeholder="PHP"></div>
          <div class="aift-career-field"><label>Number of awards</label><input id="aiftScholarshipAwards" type="number" min="1" placeholder="Example: 5"></div>
          <div class="aift-career-field"><label>Application deadline</label><input id="aiftCareerDeadline" type="date"></div>
          <div class="aift-career-field"><label>Academic year</label><input id="aiftScholarshipYear" placeholder="Example: 2026–2027"></div>
          <div class="aift-career-field full"><label>Eligible programs</label><input id="aiftCareerPrograms" placeholder="Example: Engineering, IT, Business"></div>
          <div class="aift-career-field full"><label>Required documents</label><input id="aiftScholarshipDocuments" placeholder="Example: Grades, Enrollment proof, Essay"></div>
        </div>
      </section>

      <div class="aift-career-note"><strong>AIFT review:</strong> students cannot apply until AIFT approves the scholarship listing.</div>
    `);
  }

  function partnershipForm() {
    return shell("partnership", `
      <section class="aift-career-section">
        <div class="aift-career-section-title"><strong>Who do you want to work with?</strong><span>Choose a verified AIFT School or Company account.</span></div>
        <div class="aift-career-grid">
          <div class="aift-career-field full">
            <label>${pageRole() === "school" ? "Company" : "School"} <b>*</b></label>
            <select id="aiftCareerPartner" required><option value="">Loading organizations...</option></select>
          </div>
          <div class="aift-career-field">
            <label>Partnership type</label>
            <select id="aiftPartnershipType">
              ${option("internship_partnership", "Internships")}
              ${option("job_placement", "Jobs & placement")}
              ${option("recruitment", "Recruitment")}
              ${option("training", "Training")}
              ${option("career_event", "Career events")}
              ${option("scholarship", "Scholarships")}
              ${option("mentorship", "Mentorship")}
              ${option("research", "Research")}
              ${option("industry_linkage", "Industry linkage")}
              ${option("collaboration", "General collaboration")}
            </select>
          </div>
          <div class="aift-career-field"><label>Preferred start</label><input id="aiftPartnershipStart" type="date"></div>
          <div class="aift-career-field full"><label>Partnership title <b>*</b></label><input id="aiftCareerTitle" maxlength="300" required placeholder="Example: Technology Internship & Talent Partnership"></div>
          <div class="aift-career-field full"><label>What do you want to achieve?</label><textarea id="aiftPartnershipObjective" maxlength="3000" placeholder="Example: Give students internship experience and create a hiring pipeline for graduates."></textarea></div>
        </div>
      </section>

      <section class="aift-career-section">
        <div class="aift-career-section-title"><strong>What could you work on together?</strong><span>Select everything you want to discuss. These can still be changed inside the private Partnership Workspace before final approval.</span></div>
        <div class="aift-career-choice-grid">
          ${choiceInput("aiftPartnershipCapability", "internships", "Internships", true)}
          ${choiceInput("aiftPartnershipCapability", "jobs", "Jobs")}
          ${choiceInput("aiftPartnershipCapability", "recruitment", "Recruitment")}
          ${choiceInput("aiftPartnershipCapability", "training", "Training")}
          ${choiceInput("aiftPartnershipCapability", "careerEvents", "Career events")}
          ${choiceInput("aiftPartnershipCapability", "scholarships", "Scholarships")}
          ${choiceInput("aiftPartnershipCapability", "mentorship", "Mentorship")}
          ${choiceInput("aiftPartnershipCapability", "research", "Research")}
        </div>
      </section>

      <section class="aift-career-section">
        <div class="aift-career-grid">
          <div class="aift-career-field full"><label>Target programs / courses</label><input id="aiftCareerPrograms" placeholder="Example: IT, Engineering, Business"></div>
          <div class="aift-career-field full"><label>Initial activities</label><input id="aiftPartnershipActivities" placeholder="Example: Internship intake, campus talk, scholarship program"></div>
        </div>
      </section>

      <div class="aift-career-note"><strong>Private agreement stage:</strong> after AIFT verifies the introduction, both sides can request a meeting, refine these areas, add specific opportunities and agree on terms before the partnership is approved or displayed publicly.</div>
    `);
  }

  function eventForm() {
    return shell("event", `
      <section class="aift-career-section">
        <div class="aift-career-section-title"><strong>Event</strong><span>Give students the essential details.</span></div>
        <div class="aift-career-grid">
          <div class="aift-career-field full"><label>Event title <b>*</b></label><input id="aiftCareerTitle" maxlength="300" required placeholder="Example: Technology Career Fair 2026"></div>
          <div class="aift-career-field">
            <label>Event type</label>
            <select id="aiftEventType">
              ${option("career_fair", "Career fair")}
              ${option("recruitment", "Recruitment")}
              ${option("job_fair", "Job fair")}
              ${option("internship_fair", "Internship fair")}
              ${option("company_talk", "Company talk")}
              ${option("seminar", "Seminar")}
              ${option("webinar", "Webinar")}
              ${option("workshop", "Workshop")}
              ${option("networking", "Networking")}
              ${option("mentorship", "Mentorship")}
              ${option("mock_interview", "Mock interview")}
              ${option("portfolio_review", "Portfolio review")}
              ${option("hackathon", "Hackathon")}
              ${option("other", "Other")}
            </select>
          </div>
          <div class="aift-career-field">
            <label>Format</label>
            <select id="aiftEventFormat">
              ${option("physical", "In person")}
              ${option("online", "Online")}
              ${option("hybrid", "Hybrid")}
            </select>
          </div>
          <div class="aift-career-field full"><label>Description</label><textarea id="aiftCareerSummary" maxlength="1500" placeholder="What will happen and why should people attend?"></textarea></div>
        </div>
      </section>

      <section class="aift-career-section">
        <div class="aift-career-section-title"><strong>Date & place</strong><span>Start and end time are required.</span></div>
        <div class="aift-career-grid">
          <div class="aift-career-field"><label>Starts <b>*</b></label><input id="aiftEventStart" type="datetime-local" required></div>
          <div class="aift-career-field"><label>Ends <b>*</b></label><input id="aiftEventEnd" type="datetime-local" required></div>
          <div class="aift-career-field"><label>Venue / platform</label><input id="aiftEventVenue" placeholder="Campus Hall, Zoom, AIFT Meeting..."></div>
          <div class="aift-career-field"><label>Capacity</label><input id="aiftEventCapacity" type="number" min="1" placeholder="Optional"></div>
        </div>
      </section>

      <section class="aift-career-section">
        <div class="aift-career-section-title"><strong>Who is this for?</strong><span>Click the audiences. You never need to type backend values such as “students”.</span></div>
        <div class="aift-career-choice-grid">
          ${choiceInput("aiftEventAudience", "students", "Students", true)}
          ${choiceInput("aiftEventAudience", "graduates", "Graduates")}
          ${choiceInput("aiftEventAudience", "alumni", "Alumni")}
          ${choiceInput("aiftEventAudience", "job_seekers", "Job seekers")}
          ${choiceInput("aiftEventAudience", "teachers", "Teachers")}
          ${choiceInput("aiftEventAudience", "employers", "Employers")}
          ${choiceInput("aiftEventAudience", "public", "Public")}
        </div>
      </section>

      <div class="aift-career-note"><strong>AIFT review:</strong> the event remains private until AIFT approves publication.</div>
    `);
  }

  function closeModal() {
    const overlay = document.getElementById("aiftCareerCreateOverlay");
    if (overlay) overlay.hidden = true;
    state.kind = "";
    state.workspaceId = "";
    state.workspace = null;
    state.busy = false;
    unlockPageScroll();
  }

  function showError(message) {
    const box = document.getElementById("aiftCareerCreateError");
    if (!box) return;
    box.hidden = false;
    box.textContent = message;
    box.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function wireCloseButtons() {
    document.querySelectorAll("[data-aift-career-close]").forEach(button => {
      button.addEventListener("click", closeModal);
    });
  }

  function openModalWith(content) {
    ensureModal();
    const overlay = document.getElementById("aiftCareerCreateOverlay");
    const mount = document.getElementById("aiftCareerCreateMount");
    if (!overlay || !mount) return;

    mount.innerHTML = content;
    overlay.hidden = false;
    lockPageScroll();
    wireCloseButtons();

    requestAnimationFrame(() => {
      const body = mount.querySelector(".aift-career-create-body, .aift-partnership-workspace-body");
      if (body) body.scrollTop = 0;
    });
  }

  async function loadPartners() {
    const select = document.getElementById("aiftCareerPartner");
    if (!select) return;

    try {
      const type = pageRole() === "school" ? "company" : "school";
      const data = await api(`/api/opportunities/career-hub-directory?type=${encodeURIComponent(type)}`);
      state.partnerItems = Array.isArray(data?.items) ? data.items : [];

      select.innerHTML = `
        <option value="">Choose an organization</option>
        ${state.partnerItems.map(item => {
          const name = displayName(item);
          return `<option value="${esc(item._id)}">${esc(name)}</option>`;
        }).join("")}
      `;
    } catch (error) {
      select.innerHTML = `<option value="">Could not load organizations</option>`;
      showError(error.message);
    }
  }

  function openCreate(kind, defaults = {}) {
    if (!token()) return;

    if (kind === "scholarship" && pageRole() !== "school" && ROLE !== "admin") {
      return;
    }

    state.kind = kind;

    let content = "";
    if (kind === "opportunity") content = opportunityForm(defaults.type || "internship");
    if (kind === "scholarship") content = scholarshipForm();
    if (kind === "partnership") content = partnershipForm();
    if (kind === "event") content = eventForm();
    if (!content) return;

    openModalWith(content);

    const form = document.getElementById("aiftCareerCreateForm");
    form?.addEventListener("submit", submitCreate);

    if (kind === "partnership") loadPartners();
  }

  function createPayload(kind) {
    const common = {
      kind,
      title: value("aiftCareerTitle")
    };

    if (kind === "opportunity") {
      return {
        ...common,
        type: value("aiftCareerType") || "internship",
        workSetup: value("aiftCareerWorkSetup") || "unspecified",
        summary: value("aiftCareerSummary"),
        description: value("aiftCareerSummary"),
        location: value("aiftCareerLocation"),
        deadline: value("aiftCareerDeadline") || null,
        slots: value("aiftCareerSlots") || null,
        compensationType: value("aiftCareerCompensation") || "not_specified",
        programs: comma("aiftCareerPrograms"),
        skills: comma("aiftCareerSkills"),
        visibility: "public",
        allowStudentApplications: true,
        allowSchoolRecommendations: true
      };
    }

    if (kind === "scholarship") {
      return {
        ...common,
        type: value("aiftScholarshipType") || "academic",
        summary: value("aiftCareerSummary"),
        description: value("aiftCareerSummary"),
        fundingType: value("aiftScholarshipFundingType") || "partial",
        fundingAmount: value("aiftScholarshipAmount") || null,
        numberOfAwards: value("aiftScholarshipAwards") || null,
        deadline: value("aiftCareerDeadline") || null,
        academicYear: value("aiftScholarshipYear"),
        programs: comma("aiftCareerPrograms"),
        requiredDocuments: comma("aiftScholarshipDocuments"),
        visibility: "public",
        allowInternalApplications: true
      };
    }

    if (kind === "event") {
      const format = value("aiftEventFormat") || "physical";
      const venue = value("aiftEventVenue");
      return {
        ...common,
        eventType: value("aiftEventType") || "career_fair",
        format,
        shortDescription: value("aiftCareerSummary"),
        description: value("aiftCareerSummary"),
        startAt: value("aiftEventStart"),
        endAt: value("aiftEventEnd"),
        capacity: value("aiftEventCapacity") || null,
        audience: checkedValues("aiftEventAudience"),
        visibility: "public",
        registrationRequired: true,
        location: format === "online" ? {} : { venueName: venue },
        onlinePlatform: format === "physical" ? "" : venue
      };
    }

    if (kind === "partnership") {
      const partnerId = value("aiftCareerPartner");
      const payload = {
        title: common.title,
        type: value("aiftPartnershipType") || "internship_partnership",
        partnershipType: value("aiftPartnershipType") || "internship_partnership",
        objective: value("aiftPartnershipObjective"),
        description: value("aiftPartnershipObjective"),
        proposedStartDate: value("aiftPartnershipStart") || null,
        capabilities: boolMap("aiftPartnershipCapability"),
        targetPrograms: comma("aiftCareerPrograms"),
        activities: comma("aiftPartnershipActivities")
      };

      if (pageRole() === "school") payload.companyId = partnerId;
      else payload.schoolId = partnerId;

      return payload;
    }

    return common;
  }

  function success(kind, data) {
    const mount = document.getElementById("aiftCareerCreateMount");
    if (!mount) return;

    const partnership = kind === "partnership";
    const review = data?.reviewCase;

    mount.innerHTML = `
      <div class="aift-career-success">
        <div class="aift-career-success-icon">✓</div>
        <h3>${partnership ? "Partnership request submitted" : "Sent to AIFT Review"}</h3>
        <p>${esc(data?.message || (partnership
          ? "AIFT will verify the introduction before the School and Company can privately work on the agreement."
          : "AIFT will review the listing before it becomes visible in Career Hub."))}</p>

        <div class="aift-career-success-steps">
          ${partnership ? `
            <div><strong>1. AIFT verifies</strong>The proposal is checked before the other organization can act.</div>
            <div><strong>2. Private workspace</strong>Both sides can meet, choose opportunities and agree on the partnership scope.</div>
            <div><strong>3. Approve & activate</strong>Only an active partnership appears publicly on School and Employer profiles.</div>
          ` : `
            <div><strong>Submitted</strong>Your listing is now in the AIFT review queue.</div>
            <div><strong>Review</strong>AIFT can approve, reject or request more information.</div>
            <div><strong>Publication</strong>Approved listings become visible in Career Hub.</div>
          `}
        </div>

        ${review?.caseNumber ? `<p><strong>Review case:</strong> ${esc(review.caseNumber)}</p>` : ""}
        <div style="margin-top:18px"><button type="button" class="aift-career-btn primary" data-aift-career-close>Done</button></div>
      </div>
    `;

    wireCloseButtons();
  }

  async function submitCreate(event) {
    event.preventDefault();
    if (state.busy) return;

    const kind = state.kind;
    const payload = createPayload(kind);

    if (!payload.title) {
      showError("Add a title before submitting.");
      return;
    }

    if (kind === "partnership") {
      const partnerId = pageRole() === "school" ? payload.companyId : payload.schoolId;
      if (!partnerId) {
        showError(`Choose a ${pageRole() === "school" ? "Company" : "School"} first.`);
        return;
      }
    }

    if (kind === "event" && (!payload.startAt || !payload.endAt)) {
      showError("Choose both the event start and end time.");
      return;
    }

    state.busy = true;
    const button = document.getElementById("aiftCareerSubmit");
    if (button) {
      button.disabled = true;
      button.textContent = "Submitting...";
    }

    try {
      const data = kind === "partnership"
        ? await api("/api/school-company-partnerships", {
            method: "POST",
            body: JSON.stringify(payload)
          })
        : await api("/api/opportunities/career-hub-create", {
            method: "POST",
            body: JSON.stringify(payload)
          });

      success(kind, data);

      window.dispatchEvent(new CustomEvent("aift:activity-updated", {
        detail: { changed: true, source: "career-hub-create", kind }
      }));
    } catch (error) {
      showError(error.message);
      if (button) {
        button.disabled = false;
        button.textContent = "Submit to AIFT";
      }
    } finally {
      state.busy = false;
    }
  }

  function capabilityChoices(capabilities = {}) {
    const options = [
      ["internships", "Internships"],
      ["jobs", "Jobs"],
      ["recruitment", "Recruitment"],
      ["training", "Training"],
      ["careerEvents", "Career events"],
      ["scholarships", "Scholarships"],
      ["mentorship", "Mentorship"],
      ["research", "Research"]
    ];

    return options.map(([key, label]) =>
      choiceInput("aiftWorkspaceCapability", key, label, capabilities?.[key] === true)
    ).join("");
  }

  function workspaceHeader(workspace) {
    const partnership = workspace.partnership || {};
    return `
      <header class="aift-career-create-head">
        <div>
          <div class="aift-career-create-kicker">Private Partnership Workspace</div>
          <h2 id="aiftCareerCreateTitle">${esc(partnership.title || "Partnership agreement")}</h2>
          <p>${esc(displayName(partnership.schoolId, partnership.schoolName || "School"))} × ${esc(displayName(partnership.companyId, partnership.companyName || "Company"))}</p>
        </div>
        <button type="button" class="aift-career-create-close" data-aift-career-close aria-label="Close">×</button>
      </header>
    `;
  }

  function canRespondToItem(item) {
    const proposer = normalizeId(item?.proposedBy);
    const me = currentUserId();
    return item?.status === "proposed" && Boolean(proposer && me && proposer !== me);
  }

  function canRespondToMeeting(item) {
    const requester = normalizeId(item?.requestedBy);
    const me = currentUserId();
    return item?.status === "requested" && Boolean(requester && me && requester !== me);
  }

  function workspaceItems(workspace) {
    const items = Array.isArray(workspace.workItems) ? workspace.workItems : [];

    if (!items.length) {
      return `<div class="aift-workspace-empty">No specific plans yet. Add an internship, job, scholarship, event, training program or another idea you want this partnership to support.</div>`;
    }

    return items.map(item => `
      <div class="aift-workspace-item">
        <div class="aift-workspace-item-top">
          <div>
            <strong>${esc(item.title || "Partnership plan")}</strong>
            <p>${esc(item.description || "")}</p>
          </div>
          <span class="aift-workspace-chip ${esc(item.status)}">${esc(title(item.status))}</span>
        </div>
        <div class="aift-workspace-meta">${esc(title(item.type))} · Proposed by ${esc(displayName(item.proposedBy, "AIFT member"))}</div>
        ${canRespondToItem(item) ? `
          <div class="aift-workspace-actions">
            <button type="button" class="aift-career-btn success" data-work-item-response="agreed" data-item-id="${esc(item._id)}">Agree</button>
            <button type="button" class="aift-career-btn danger" data-work-item-response="declined" data-item-id="${esc(item._id)}">Decline</button>
          </div>
        ` : ""}
      </div>
    `).join("");
  }

  function workspaceMeetings(workspace) {
    const meetings = Array.isArray(workspace.meetingRequests) ? workspace.meetingRequests : [];

    if (!meetings.length) {
      return `<div class="aift-workspace-empty">No meeting requests yet. Either the School or Company can request a private agreement meeting before final approval.</div>`;
    }

    return meetings
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map(item => {
        const meeting = item.meetingId && typeof item.meetingId === "object" ? item.meetingId : null;
        return `
          <div class="aift-workspace-item">
            <div class="aift-workspace-item-top">
              <div>
                <strong>${esc(formatDate(item.preferredAt))}</strong>
                <p>${esc(item.purpose || "Partnership agreement discussion")}</p>
              </div>
              <span class="aift-workspace-chip ${esc(item.status)}">${esc(title(item.status))}</span>
            </div>
            <div class="aift-workspace-meta">${esc(String(item.durationMinutes || 30))} minutes · Requested by ${esc(displayName(item.requestedBy, "AIFT member"))}</div>
            ${canRespondToMeeting(item) ? `
              <div class="aift-workspace-actions">
                <button type="button" class="aift-career-btn success" data-meeting-response="accepted" data-meeting-request-id="${esc(item._id)}">Accept meeting</button>
                <button type="button" class="aift-career-btn danger" data-meeting-response="declined" data-meeting-request-id="${esc(item._id)}">Decline</button>
              </div>
            ` : ""}
            ${meeting?.joinUrl ? `
              <div class="aift-workspace-actions">
                <button type="button" class="aift-career-btn primary" data-join-url="${esc(meeting.joinUrl)}">Open AIFT meeting</button>
              </div>
            ` : ""}
          </div>
        `;
      }).join("");
  }

  function recipientCanApprove(workspace) {
    const partnership = workspace.partnership || {};
    if (partnership.status !== "review") return false;

    const requester = String(partnership.requestedBy || "").toLowerCase();
    return (
      (requester === "school" && workspace.viewerRole === "company") ||
      (["company", "employer"].includes(requester) && workspace.viewerRole === "school") ||
      workspace.viewerRole === "admin"
    );
  }

  function renderWorkspace(workspace) {
    state.workspace = workspace;

    const partnership = workspace.partnership || {};
    const editable = workspace.canEditAgreement === true;
    const requestable = workspace.canRequestMeeting === true;
    const canApprove = recipientCanApprove(workspace);
    const canActivate = partnership.status === "approved";

    const content = `
      ${workspaceHeader(workspace)}

      <div class="aift-partnership-workspace-body">
        <div class="aift-partnership-workspace-headline">
          <div>
            <h3>Build the agreement before it becomes public</h3>
            <p>AIFT has verified the introduction. This workspace is private to the School, Company and AIFT until the partnership is activated.</p>
          </div>
          <span class="aift-partnership-status ${esc(partnership.status)}">${esc(title(partnership.status))}</span>
        </div>

        <div class="aift-partnership-flow">
          <div><strong>1. AIFT verified</strong>The introduction passed the AIFT trust gate.</div>
          <div><strong>2. Agree scope</strong>Choose what both sides will actually work on.</div>
          <div><strong>3. Meet if needed</strong>Either side can request an invite-only AIFT meeting.</div>
          <div><strong>4. Approve & activate</strong>Only then can the partnership appear publicly.</div>
        </div>

        <section class="aift-workspace-card">
          <div class="aift-workspace-card-head">
            <strong>Partnership scope</strong>
            <span>${editable ? "Both sides can refine this before approval" : "Current agreed scope"}</span>
          </div>

          <form id="aiftWorkspaceAgreementForm">
            <div class="aift-career-field full">
              <label>Agreement summary</label>
              <textarea id="aiftWorkspaceAgreementSummary" ${editable ? "" : "disabled"} placeholder="What should this partnership achieve?">${esc(workspace.agreementSummary || partnership.objective || "")}</textarea>
            </div>

            <div class="aift-career-section" style="margin-top:13px">
              <div class="aift-career-section-title"><strong>Areas both sides can work on</strong><span>Select the areas that should belong to this partnership.</span></div>
              <div class="aift-career-choice-grid ${editable ? "" : "aift-workspace-disabled"}">
                ${capabilityChoices(workspace.capabilities || partnership.capabilities || {})}
              </div>
            </div>

            <div class="aift-career-grid">
              <div class="aift-career-field full"><label>Programs / courses</label><input id="aiftWorkspacePrograms" ${editable ? "" : "disabled"} value="${esc((workspace.targetPrograms || []).join(", "))}" placeholder="IT, Engineering, Business"></div>
              <div class="aift-career-field full"><label>Planned activities</label><input id="aiftWorkspaceActivities" ${editable ? "" : "disabled"} value="${esc((workspace.activities || []).join(", "))}" placeholder="Internship intake, campus event, recruitment, training"></div>
            </div>

            ${editable ? `<div class="aift-workspace-actions"><button type="submit" class="aift-career-btn primary">Save agreement</button></div>` : ""}
          </form>
        </section>

        <section class="aift-workspace-card">
          <div class="aift-workspace-card-head"><strong>What can we work on?</strong><span>Turn the partnership into specific plans</span></div>
          ${editable ? `
            <form id="aiftWorkspaceWorkForm" class="aift-career-grid">
              <div class="aift-career-field">
                <label>Plan type</label>
                <select id="aiftWorkspaceWorkType">
                  ${option("internship", "Internship")}
                  ${option("job", "Jobs / hiring")}
                  ${option("recruitment", "Recruitment")}
                  ${option("training", "Training")}
                  ${option("scholarship", "Scholarship")}
                  ${option("career_event", "Career event")}
                  ${option("mentorship", "Mentorship")}
                  ${option("research", "Research")}
                  ${option("student_project", "Student project")}
                  ${option("industry_project", "Industry project")}
                  ${option("other", "Other")}
                </select>
              </div>
              <div class="aift-career-field"><label>Title</label><input id="aiftWorkspaceWorkTitle" required maxlength="220" placeholder="Example: 10 IT internship slots"></div>
              <div class="aift-career-field full"><label>Details</label><textarea id="aiftWorkspaceWorkDescription" maxlength="3000" placeholder="Describe what you want the School and Company to agree on."></textarea></div>
              <div class="aift-career-field full"><button type="submit" class="aift-career-btn">Add proposal</button></div>
            </form>
          ` : ""}
          <div id="aiftWorkspaceItems" style="margin-top:12px">${workspaceItems(workspace)}</div>
        </section>

        <section class="aift-workspace-card">
          <div class="aift-workspace-card-head"><strong>Agreement meeting</strong><span>Meet before final partnership approval</span></div>
          ${requestable ? `
            <form id="aiftWorkspaceMeetingForm" class="aift-career-grid">
              <div class="aift-career-field"><label>Preferred date & time</label><input id="aiftWorkspaceMeetingAt" type="datetime-local" required></div>
              <div class="aift-career-field">
                <label>Duration</label>
                <select id="aiftWorkspaceMeetingDuration">
                  ${option("30", "30 minutes")}
                  ${option("45", "45 minutes")}
                  ${option("60", "1 hour")}
                  ${option("90", "1.5 hours")}
                </select>
              </div>
              <div class="aift-career-field full"><label>What should the meeting cover?</label><textarea id="aiftWorkspaceMeetingPurpose" maxlength="1800" placeholder="Example: Agree on internship slots, screening process and campus schedule."></textarea></div>
              <div class="aift-career-field full"><button type="submit" class="aift-career-btn">Request meeting</button></div>
            </form>
          ` : ""}
          <div id="aiftWorkspaceMeetings" style="margin-top:12px">${workspaceMeetings(workspace)}</div>
        </section>

        <section class="aift-workspace-card">
          <div class="aift-workspace-card-head"><strong>Final partnership decision</strong><span>Public profile display is still locked until activation</span></div>
          <div class="aift-career-note">
            ${partnership.status === "review"
              ? "The agreement is still private. The receiving organization should approve only after both sides are comfortable with the scope."
              : partnership.status === "approved"
                ? "The partnership is approved but not public yet. Activate it when both sides are ready for it to appear on their profiles."
                : partnership.status === "active"
                  ? "This partnership is active and is eligible to appear as an AIFT-verified partnership on both public profiles."
                  : "This partnership is currently in a controlled AIFT stage."}
          </div>
          <div class="aift-workspace-actions">
            ${canApprove ? `<button type="button" class="aift-career-btn success" data-partnership-status="approved">Approve partnership</button><button type="button" class="aift-career-btn danger" data-partnership-status="rejected">Reject</button>` : ""}
            ${canActivate ? `<button type="button" class="aift-career-btn success" data-partnership-status="active">Activate & allow profile display</button>` : ""}
          </div>
        </section>
      </div>

      <div id="aiftCareerCreateError" class="aift-career-error" hidden></div>
      <footer class="aift-career-create-foot">
        <div class="aift-career-foot-copy">Private until the partnership is <strong>active</strong>.</div>
        <div class="aift-career-foot-actions"><button type="button" class="aift-career-btn" data-aift-career-close>Close</button></div>
      </footer>
    `;

    openModalWith(content);
    wireWorkspace();
  }

  async function openPartnershipWorkspace(partnershipId) {
    if (!partnershipId) return openCreate("partnership");

    state.workspaceId = String(partnershipId);

    openModalWith(`
      <header class="aift-career-create-head">
        <div><div class="aift-career-create-kicker">Private Partnership Workspace</div><h2 id="aiftCareerCreateTitle">Loading partnership...</h2><p>Checking the AIFT review stage.</p></div>
        <button type="button" class="aift-career-create-close" data-aift-career-close aria-label="Close">×</button>
      </header>
      <div class="aift-workspace-loading">Loading partnership workspace...</div>
    `);

    try {
      const data = await api(`/api/opportunities/partnership-workspace/${encodeURIComponent(partnershipId)}`);
      renderWorkspace(data.workspace);
    } catch (error) {
      const pending = error.status === 409;
      openModalWith(`
        <header class="aift-career-create-head">
          <div><div class="aift-career-create-kicker">Partnership Process</div><h2 id="aiftCareerCreateTitle">${pending ? "Waiting for AIFT verification" : "Partnership workspace unavailable"}</h2><p>${esc(error.message)}</p></div>
          <button type="button" class="aift-career-create-close" data-aift-career-close aria-label="Close">×</button>
        </header>
        <div class="aift-career-success">
          <div class="aift-career-success-icon">${pending ? "⏳" : "!"}</div>
          <h3>${pending ? "The private workspace opens next" : "Could not open the workspace"}</h3>
          <p>${esc(error.message)}</p>
          ${pending ? `<div class="aift-career-success-steps"><div><strong>Now</strong>AIFT reviews the partnership introduction.</div><div><strong>After verification</strong>The School and Company can privately meet and work on the agreement.</div><div><strong>After agreement</strong>The receiving organization can approve and activate the partnership.</div></div>` : ""}
          <div style="margin-top:18px"><button type="button" class="aift-career-btn" data-aift-career-close>Close</button></div>
        </div>
      `);
    }
  }

  async function reloadWorkspace() {
    if (!state.workspaceId) return;
    const data = await api(`/api/opportunities/partnership-workspace/${encodeURIComponent(state.workspaceId)}`);
    renderWorkspace(data.workspace);
  }

  function wireWorkspace() {
    const agreementForm = document.getElementById("aiftWorkspaceAgreementForm");
    agreementForm?.addEventListener("submit", async event => {
      event.preventDefault();
      try {
        await api(`/api/opportunities/partnership-workspace/${encodeURIComponent(state.workspaceId)}/agreement`, {
          method: "PATCH",
          body: JSON.stringify({
            agreementSummary: value("aiftWorkspaceAgreementSummary"),
            capabilities: boolMap("aiftWorkspaceCapability"),
            activities: comma("aiftWorkspaceActivities"),
            targetPrograms: comma("aiftWorkspacePrograms")
          })
        });
        await reloadWorkspace();
      } catch (error) {
        showError(error.message);
      }
    });

    const workForm = document.getElementById("aiftWorkspaceWorkForm");
    workForm?.addEventListener("submit", async event => {
      event.preventDefault();
      try {
        await api(`/api/opportunities/partnership-workspace/${encodeURIComponent(state.workspaceId)}/work-items`, {
          method: "POST",
          body: JSON.stringify({
            type: value("aiftWorkspaceWorkType"),
            title: value("aiftWorkspaceWorkTitle"),
            description: value("aiftWorkspaceWorkDescription")
          })
        });
        await reloadWorkspace();
      } catch (error) {
        showError(error.message);
      }
    });

    const meetingForm = document.getElementById("aiftWorkspaceMeetingForm");
    meetingForm?.addEventListener("submit", async event => {
      event.preventDefault();
      try {
        await api(`/api/opportunities/partnership-workspace/${encodeURIComponent(state.workspaceId)}/meetings`, {
          method: "POST",
          body: JSON.stringify({
            preferredAt: value("aiftWorkspaceMeetingAt"),
            durationMinutes: Number(value("aiftWorkspaceMeetingDuration") || 30),
            purpose: value("aiftWorkspaceMeetingPurpose")
          })
        });
        await reloadWorkspace();
      } catch (error) {
        showError(error.message);
      }
    });

    document.querySelectorAll("[data-work-item-response]").forEach(button => {
      button.addEventListener("click", async () => {
        try {
          await api(`/api/opportunities/partnership-workspace/${encodeURIComponent(state.workspaceId)}/work-items/${encodeURIComponent(button.dataset.itemId)}/respond`, {
            method: "PATCH",
            body: JSON.stringify({ status: button.dataset.workItemResponse })
          });
          await reloadWorkspace();
        } catch (error) {
          showError(error.message);
        }
      });
    });

    document.querySelectorAll("[data-meeting-response]").forEach(button => {
      button.addEventListener("click", async () => {
        try {
          await api(`/api/opportunities/partnership-workspace/${encodeURIComponent(state.workspaceId)}/meetings/${encodeURIComponent(button.dataset.meetingRequestId)}/respond`, {
            method: "PATCH",
            body: JSON.stringify({ status: button.dataset.meetingResponse })
          });
          await reloadWorkspace();
        } catch (error) {
          showError(error.message);
        }
      });
    });

    document.querySelectorAll("[data-join-url]").forEach(button => {
      button.addEventListener("click", () => {
        const url = button.dataset.joinUrl;
        if (url) location.href = url;
      });
    });

    document.querySelectorAll("[data-partnership-status]").forEach(button => {
      button.addEventListener("click", async () => {
        const next = button.dataset.partnershipStatus;
        try {
          await api(`/api/school-company-partnerships/${encodeURIComponent(state.workspaceId)}`, {
            method: "PATCH",
            body: JSON.stringify({
              status: next,
              statusNote: next === "approved"
                ? "Partnership agreement approved after private School–Company collaboration."
                : next === "active"
                  ? "Partnership activated and eligible for verified public profile display."
                  : "Partnership declined after agreement review."
            })
          });
          await reloadWorkspace();
          window.dispatchEvent(new CustomEvent("aift:activity-updated", {
            detail: { changed: true, source: "partnership-workspace", status: next }
          }));
        } catch (error) {
          showError(error.message);
        }
      });
    });
  }

  function installOverrides() {
    if (PAGE === "school.html") {
      window.openCareerOpportunityComposer = function(type = "internship", id = null) {
        if (id && typeof legacy.schoolOpportunity === "function") return legacy.schoolOpportunity(type, id);
        openCreate("opportunity", { type });
      };

      window.openCareerScholarshipComposer = function(id = null) {
        if (id && typeof legacy.schoolScholarship === "function") return legacy.schoolScholarship(id);
        openCreate("scholarship");
      };

      window.openCareerPartnershipComposer = function(id = null) {
        if (id) return openPartnershipWorkspace(id);
        openCreate("partnership");
      };

      window.editCareerPartnership = function(id) {
        openPartnershipWorkspace(id);
      };

      window.openCareerPartnershipWorkspace = openPartnershipWorkspace;

      window.openCareerEventComposer = function(id = null) {
        if (id && typeof legacy.schoolEvent === "function") return legacy.schoolEvent(id);
        openCreate("event");
      };
    }

    if (PAGE === "employer.html") {
      window.openEmployerCareerOpportunityBuilder = function() {
        openCreate("opportunity", { type: "internship" });
      };

      window.openEmployerCareerPartnershipComposer = function(id = null) {
        if (id) return openPartnershipWorkspace(id);
        openCreate("partnership");
      };

      window.openEmployerCareerPartnership = function(id) {
        openPartnershipWorkspace(id);
      };

      window.editEmployerCareerPartnership = function(id) {
        openPartnershipWorkspace(id);
      };

      window.openEmployerCareerEventComposer = function() {
        openCreate("event");
      };
    }
  }

  ensureModal();
  installOverrides();

  window.AIFTCareerHubCreate = {
    open: openCreate,
    openPartnershipWorkspace,
    close: closeModal
  };
})();
