"""Install redrawn portraits and report what is still missing.

    python engine/register_portraits.py            # install and report
    python engine/register_portraits.py --check    # report only

New art goes in dist/portraits/incoming/<face>.png (or .webp/.jpg), one file per
face listed under "redrawNeeded" in dist/portraits/faces/manifest.json; the
brief for each face is docs/portraits/REDRAW.md. Each file is cropped to 2:3,
resized to 512 x 768, saved as WebP (quality 85, no metadata) in
dist/portraits/faces/, and the face moves from redrawNeeded to ids, in the
manifest and in dist/app.js. The portrait regions and the release stamp are
then rebuilt. Requires Pillow (pip install pillow).
"""
from pathlib import Path
import json,re,subprocess,sys
from PIL import Image

PROJECT=Path(__file__).resolve().parents[1]
FACES=PROJECT/'dist/portraits/faces'
INCOMING=PROJECT/'dist/portraits/incoming'
MANIFEST=FACES/'manifest.json'
APP=PROJECT/'dist/app.js'
SIZE=(512,768)

def incoming(face):
    for ext in ('png','webp','jpg','jpeg'):
        path=INCOMING/f'{face}.{ext}'
        if path.exists():return path

def encode(source,target):
    image=Image.open(source).convert('RGB')
    w,h=image.size;want=SIZE[0]/SIZE[1]
    if w/h>want:cut=int(h*want);image=image.crop(((w-cut)//2,0,(w-cut)//2+cut,h))
    elif w/h<want:cut=int(w/want);image=image.crop((0,0,w,cut))   # keep the head: trim the bottom
    if image.width<384:raise SystemExit(f'{source.name}: too small ({image.width} px wide); use at least 512 x 768')
    image.resize(SIZE,Image.LANCZOS).save(target,'WEBP',quality=85,method=6)

def main():
    check='--check' in sys.argv
    manifest=json.loads(MANIFEST.read_text())
    pending=list(manifest.get('redrawNeeded',[]))
    stray=[p.name for p in INCOMING.glob('*') if p.is_file() and not (p.stem.isdigit() and int(p.stem) in pending)] if INCOMING.exists() else []
    installed=[]
    if not check:
        for face in pending:
            source=incoming(face)
            if not source:continue
            encode(source,FACES/f'{face}.webp');source.unlink();installed.append(face)
        if installed:
            manifest['ids']=sorted(set(manifest['ids'])|set(installed))
            manifest['redrawNeeded']=[f for f in pending if f not in installed]
            MANIFEST.write_text(json.dumps(manifest,indent=2)+'\n')
            app=APP.read_text()
            app=re.sub(r'const portraitIds=new Set\(\[[0-9,]+\]\);','const portraitIds=new Set(['+','.join(map(str,manifest['ids']))+']);',app,count=1)
            APP.write_text(app)
            subprocess.run([sys.executable,str(PROJECT/'engine/build_portrait_regions.py')],check=True)
            subprocess.run(['node',str(PROJECT/'engine/stamp-release.mjs')],check=True)
    left=manifest.get('redrawNeeded',[])
    if installed:print('Installed:',', '.join(map(str,installed)))
    print('Still to redraw:',', '.join(map(str,left)) if left else 'none')
    if stray:print('Ignored files in dist/portraits/incoming (not a pending face):',', '.join(stray))
    missing=[f for f in manifest['ids'] if not (FACES/f'{f}.webp').exists()]
    if missing:raise SystemExit(f'Listed but missing: {missing}')

if __name__=='__main__':main()
