"""Import the Spanish string catalog without replacing original game logic.

Input files are extracted from Clan DLAN's BG/FoV Final V1 installer, not run.
"""
from pathlib import Path
import argparse,json,os,subprocess,sys
from usecode_relocate import functions,strings,rebuild
project=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser()
ap.add_argument('--usecode',type=Path,required=True)
ap.add_argument('--text',type=Path,required=True)
ap.add_argument('--fonts',type=Path,required=True)
ap.add_argument('--game-dir',type=Path,default=project.parent)
args=ap.parse_args()
original=(args.game_dir/'STATIC/USECODE').read_bytes()
base={f.id:f for f in functions(original)}
spanish={f.id:f for f in functions(args.usecode.read_bytes())}
assert base.keys()==spanish.keys(),'Spanish release has different function IDs'
catalog={}
for fid,f in base.items():
 source=strings(f.data);translated=strings(spanish[fid].data)
 assert len(source)==len(translated),(hex(fid),'different string inventory')
 for index,((_,old),(_,new)) in enumerate(zip(source,translated)):
  if old!=new:catalog[f'{fid:04X}:{index}']=new.decode('latin1')
output,report=rebuild(original,catalog)
dest=project/'dist/patch/es';dest.mkdir(parents=True,exist_ok=True)
(project/'translations').mkdir(exist_ok=True)
(project/'translations/es-overrides.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf8')
(dest/'USECODE').write_bytes(output)
(dest/'TEXT.FLX').write_bytes(args.text.read_bytes())
(dest/'FONTS.VGA').write_bytes(args.fonts.read_bytes())
(dest/'USECODE-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
env=dict(os.environ,U7_GAME_DIR=str(args.game_dir),U7_PATCH_DIR=str(dest))
subprocess.run([sys.executable,str(project/'engine/build_linkdep.py')],env=env,check=True)
print(f'Imported {len(catalog)} Spanish strings; original bytecode and calls preserved.')
