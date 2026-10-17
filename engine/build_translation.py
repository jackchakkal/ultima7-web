"""Build the PT-BR USECODE from translation-overrides.json (FUNCTION:index -> text)."""
from pathlib import Path
import os,json
PROJECT=Path(__file__).resolve().parents[1]
ROOT=Path(os.environ.get('U7_GAME_DIR',PROJECT.parent))
from usecode_relocate import rebuild
translations=json.loads((PROJECT/'translation-overrides.json').read_text(encoding='utf-8-sig'))
out=PROJECT/'dist/patch'
out.mkdir(parents=True,exist_ok=True)
blob,report=rebuild((ROOT/'STATIC/USECODE').read_bytes(),translations)
(out/'USECODE').write_bytes(blob)
(out/'USECODE-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(f"Built browser USECODE with {report['translated_strings']} translations.")
