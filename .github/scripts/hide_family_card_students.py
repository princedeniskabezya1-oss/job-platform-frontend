from pathlib import Path

p = Path('home.html')
s = p.read_text(encoding='utf-8')

old = '<section class="family-advantage-card" aria-labelledby="familyAdvantageTitle">'
new = '<section id="familyAdvantageCard" class="family-advantage-card" aria-labelledby="familyAdvantageTitle">'
if old in s:
    s = s.replace(old, new, 1)
elif 'id="familyAdvantageCard"' not in s:
    raise SystemExit('Family Advantage card block not found')

marker = '''function renderMe(){

  const me = state.me || {};'''
replacement = '''function syncFamilyAdvantageVisibility(){
  const card = document.getElementById("familyAdvantageCard");
  if(!card) return;

  const currentRole = String(
    state.me?.role ||
    role() ||
    ""
  ).trim().toLowerCase();

  card.classList.toggle("hidden", currentRole === "student");
}

function renderMe(){

  const me = state.me || {};'''

if 'function syncFamilyAdvantageVisibility(){' not in s:
    if marker not in s:
        raise SystemExit('renderMe marker not found')
    s = s.replace(marker, replacement, 1)

render_start = s.index('function renderMe(){')
call_marker = '''  updateDashboardButtons();
}'''
call_replacement = '''  updateDashboardButtons();
  syncFamilyAdvantageVisibility();
}'''
call_pos = s.index(call_marker, render_start)
block = s[render_start:call_pos + len(call_marker)]
if 'syncFamilyAdvantageVisibility();' not in block:
    s = s[:call_pos] + call_replacement + s[call_pos + len(call_marker):]

p.write_text(s, encoding='utf-8')
