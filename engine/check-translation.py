"""Validate translation-overrides.json against the original USECODE.

Checks markers (@ * ~ | tabs/newlines), edge whitespace, the PT-BR font
character set, and that every string the bytecode compares with the chosen
answer (cmps/cmpeq) has one translation everywhere and fits ANSWER_SIZE.
Signs, tombstones and plaques (017B, 02CB, 0334) are runic and exempt from
marker counts other than ~.
"""
from pathlib import Path
import collections,json,os,re,sys
from usecode_relocate import functions,strings,instructions,opcode_table

PROJECT=Path(__file__).resolve().parents[1]
ROOT=Path(os.environ.get('U7_GAME_DIR',PROJECT.parent))
RUNIC={'017B','02CB','0334'}
ALLOWED=set(map(chr,range(32,127)))|set('áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ\t\r\n')
CMP={0x07,0x87,0x22,0x1A}  # cmps, cmps32, cmpeq, cmpne

table=opcode_table();blob=(ROOT/'STATIC/USECODE').read_bytes()
en={};keywords=set()
for f in functions(blob):
    st=strings(f.data);idx={o:i for i,(o,_) in enumerate(st)}
    for i,(_,s) in enumerate(st):en[f'{f.id:04X}:{i}']=s.decode('latin1')
    ins=list(instructions(f.code,table))
    for n,(_,_,op,ops) in enumerate(ins):
        if op in(0x1D,0x9D) and n+1<len(ins) and ins[n+1][2] in CMP:
            keywords.add(st[idx[ops[0][3]]][1].decode('latin1'))
pt=json.loads((PROJECT/'translation-overrides.json').read_text(encoding='utf-8-sig'))
errors=[]
for key,text in pt.items():
    if key not in en:errors.append(f'{key}: unknown key');continue
    src=en[key];func=key[:4]
    if set(text)-ALLOWED:errors.append(f'{key}: characters outside the PT-BR font {sorted(set(text)-ALLOWED)}')
    for mark in ('~',) if func in RUNIC else ('@','*','~','|','\t','\r','\n'):
        if src.count(mark)!=text.count(mark):errors.append(f'{key}: {mark!r} count {src.count(mark)} -> {text.count(mark)}')
    if func not in RUNIC and (re.match(r'\s*',src)[0],re.search(r'\s*$',src)[0])!=(re.match(r'\s*',text)[0],re.search(r'\s*$',text)[0]):
        errors.append(f'{key}: leading/trailing whitespace changed')
seen=collections.defaultdict(set)
for key,src in en.items():
    if src in keywords and key[:4] not in RUNIC:seen[src].add(pt.get(key,src))
for src,texts in seen.items():
    if len(texts)>1:errors.append(f'keyword {src!r} has several translations: {sorted(texts)}')
    for text in texts:
        if len(text.encode('latin1'))>29:errors.append(f'keyword {src!r} -> {text!r} exceeds 29 bytes')
print('\n'.join(errors[:200]))
print(f'{len(pt)} translations, {len(keywords)} compared keywords, {len(errors)} problems.')
sys.exit(1 if errors else 0)
