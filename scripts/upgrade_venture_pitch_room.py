from pathlib import Path
import re

p = Path('venture.html')
s = p.read_text(encoding='utf-8')

# 1) Replace the fake AIFT wordmark with the real AIFT logo and remove the redundant Ventures label.
old_brand = '''<span
  class="venture-brand-mark"
  id="ventureBrandLogo"
  aria-label="AIFT"
>
  <span class="venture-brand-mark-icon">
    A
  </span>

  <span class="venture-brand-mark-word">
    AIFT
  </span>
</span>

        <span
          class="venture-brand-divider"
          aria-hidden="true"
        ></span>

        <span class="venture-brand-section">
          Ventures
        </span>'''
new_brand = '''<img
          class="venture-brand-logo"
          id="ventureBrandLogo"
          src="images/aift-logo.png"
          alt="AIFT"
          width="92"
          height="46"
        >'''
if old_brand not in s:
    raise SystemExit('Venture fake brand block not found')
s = s.replace(old_brand, new_brand, 1)

# 2) Add a centered inner shell to make the topbar align with the content below.
header_open = '''  <header class="venture-topbar">\n\n    <div class="venture-brand">'''
header_open_new = '''  <header class="venture-topbar">\n\n    <div class="venture-topbar-inner">\n\n    <div class="venture-brand">'''
if header_open not in s:
    raise SystemExit('Venture topbar opening block not found')
s = s.replace(header_open, header_open_new, 1)

header_close = '''    </div>\n\n  </header>\n\n\n  <!-- =====================================================\n       INITIAL LOADING SCREEN'''
header_close_new = '''    </div>\n\n    </div>\n\n  </header>\n\n\n  <!-- =====================================================\n       INITIAL LOADING SCREEN'''
if header_close not in s:
    raise SystemExit('Venture topbar closing block not found')
s = s.replace(header_close, header_close_new, 1)

# 3) Final authoritative header styling. Put this at the end of the style block so earlier legacy rules cannot override it.
style_marker = '''    /* =====================================================\n       END AIFT VENTURE PITCH ROOM STYLES\n    ====================================================== */\n\n  </style>'''
style_add = '''    /* =====================================================
       PRODUCTION TOP BAR — AUTHORITATIVE
       Aligns the header with the centered Venture content.
    ====================================================== */

    .venture-topbar{
      padding:0!important;
      display:block!important;
    }

    .venture-topbar-inner{
      width:min(var(--venture-max),calc(100% - 48px));
      height:100%;
      margin:0 auto;
      display:grid;
      grid-template-columns:170px minmax(360px,620px) max-content;
      align-items:center;
      justify-content:space-between;
      gap:24px;
    }

    .venture-brand{
      min-width:0;
      justify-self:start;
    }

    .venture-brand-link{
      min-height:46px;
      padding:0;
      display:inline-flex;
      align-items:center;
    }

    .venture-brand-logo{
      width:92px!important;
      height:46px!important;
      object-fit:contain!important;
      object-position:left center!important;
    }

    .venture-brand-mark,
    .venture-brand-divider,
    .venture-brand-section{
      display:none!important;
    }

    .venture-top-search{
      width:100%!important;
      max-width:620px!important;
      justify-self:center!important;
    }

    .venture-top-actions{
      justify-self:end!important;
    }

    @media(max-width:1180px){
      .venture-topbar-inner{
        width:calc(100% - 32px);
        grid-template-columns:130px minmax(260px,1fr) max-content;
        gap:14px;
      }
      .venture-brand-logo{
        width:82px!important;
      }
    }

    @media(max-width:760px){
      .venture-topbar-inner{
        width:100%;
        padding:0 13px;
        display:grid;
        grid-template-columns:minmax(0,1fr) max-content;
        gap:10px;
      }
      .venture-brand-logo{
        width:72px!important;
        height:38px!important;
      }
      .venture-top-search{
        display:none!important;
      }
    }

    /* =====================================================
       END AIFT VENTURE PITCH ROOM STYLES
    ====================================================== */

  </style>'''
if style_marker not in s:
    raise SystemExit('Final Venture style marker not found')
s = s.replace(style_marker, style_add, 1)

# 4) Make back/fallback navigation aware of Family/Investor users and remove dead career-hub.html fallback.
old_nav = '''      if(\n        ownerRole ===\n        "student"\n      ){\n\n        return "student.html?section=career";\n\n      }\n\n\n      return "career-hub.html";'''
new_nav = '''      if(\n        ownerRole ===\n        "student"\n      ){\n\n        return "student.html?section=career";\n\n      }\n\n\n      if(\n        ownerRole ===\n        "family"\n      ){\n\n        return "family.html";\n\n      }\n\n\n      if(\n        ownerRole ===\n        "admin"\n      ){\n\n        return "home.html";\n\n      }\n\n\n      return "home.html";'''
if old_nav not in s:
    raise SystemExit('Venture role navigation block not found')
s = s.replace(old_nav, new_nav, 1)

# 5) Add production search routing to the real role-specific Venture discovery surfaces.
nav_marker = '''    function goBackFromVenture(){'''
search_helpers = r'''    function ventureViewerRole(){

      return ventureSafeString(
        ventureState.venture?.viewerRole ||
        ventureState.venture?.currentUserRole ||
        localStorage.getItem("role") ||
        localStorage.getItem("userRole") ||
        ""
      ).toLowerCase();

    }


    function ventureSearchDestination(query){

      const q = ventureSafeString(query);
      const encoded = encodeURIComponent(q);
      const role = ventureViewerRole();

      if(role === "student"){
        return `student.html?section=career&career=ventures&q=${encoded}`;
      }

      if(role === "school"){
        return `school.html?section=career&q=${encoded}`;
      }

      if(role === "employer"){
        return `employer.html?section=career&q=${encoded}`;
      }

      if(role === "family"){
        return `family.html?mode=investor&page=investor-discover&q=${encoded}`;
      }

      return `home.html?search=${encoded}`;

    }


    function initializeVentureGlobalSearch(){

      const search = ventureElement("ventureGlobalSearch");

      if(!search){
        return;
      }

      search.addEventListener(
        "keydown",
        event => {

          if(event.key !== "Enter"){
            return;
          }

          event.preventDefault();

          const query = ventureSafeString(search.value);

          if(!query){
            return;
          }

          window.location.href = ventureSearchDestination(query);

        }
      );

    }


'''
if search_helpers.strip() not in s:
    if nav_marker not in s:
        raise SystemExit('goBackFromVenture marker not found')
    s = s.replace(nav_marker, search_helpers + nav_marker, 1)

# 6) Initialize the search once with the existing navigation listeners.
init_marker = '''    initializeVentureNavigation();\n\n    initializeVentureShareModal();'''
init_new = '''    initializeVentureNavigation();\n\n    initializeVentureGlobalSearch();\n\n    initializeVentureShareModal();'''
if init_marker not in s:
    raise SystemExit('Venture navigation initialization marker not found')
s = s.replace(init_marker, init_new, 1)

p.write_text(s, encoding='utf-8')
