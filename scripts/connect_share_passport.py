from pathlib import Path

def patch_student():
    p=Path('student.html')
    s=p.read_text(encoding='utf-8')
    old='''<script src="student.js"></script>\n\n<script src="student-career-production.js"></script>'''
    new='''<script src="student.js"></script>\n<script src="aift-share-panel.js"></script>\n<script src="student-passport.js"></script>'''
    if old in s:
        s=s.replace(old,new,1)
    elif 'aift-share-panel.js' not in s:
        marker='<script src="student.js"></script>'
        if marker not in s:
            raise SystemExit('student.js script tag not found')
        s=s.replace(marker,marker+'\n<script src="aift-share-panel.js"></script>\n<script src="student-passport.js"></script>',1)
    else:
        s=s.replace('\n<script src="student-career-production.js"></script>','')
    p.write_text(s,encoding='utf-8')

def patch_venture():
    p=Path('venture.html')
    s=p.read_text(encoding='utf-8')
    if 'src="aift-share-panel.js"' not in s:
        marker='</body>'
        if marker not in s:
            raise SystemExit('venture body close not found')
        s=s.replace(marker,'  <script src="aift-share-panel.js"></script>\n\n'+marker,1)
    p.write_text(s,encoding='utf-8')

patch_student()
patch_venture()
