"""Relocate vanilla LINKDEP tables alongside the translated USECODE.

Translation preserves all external calls, so retain the original dependency
lists and replace their file offsets and cache-body lengths. This avoids
changing the original routine-loading order or guessing new dependencies.
"""
from pathlib import Path
import struct
import json
import os

PROJECT=Path(__file__).resolve().parents[1]
ROOT=Path(os.environ.get('U7_GAME_DIR',PROJECT.parent))
ORIGINAL=ROOT/'STATIC'
PATCH=Path(os.environ.get('U7_PATCH_DIR',PROJECT/'dist/patch'))

def functions(blob):
    result={};offset=0
    while offset<len(blob):
        fid,size=struct.unpack_from('<HH',blob,offset)
        if fid>=0xfffe:raise ValueError('Vanilla engine needs 16-bit function headers')
        if offset+size+4>len(blob):raise ValueError('Truncated function')
        result[fid]=(offset,size)
        offset+=size+4
    assert offset==len(blob)
    return result

old=functions((ORIGINAL/'USECODE').read_bytes())
new=functions((PATCH/'USECODE').read_bytes())
assert old.keys()==new.keys(), 'Translation changed the function inventory'
offset_id={offset:fid for fid,(offset,size) in old.items()}
one=bytearray((ORIGINAL/'LINKDEP1').read_bytes())
two=bytearray((ORIGINAL/'LINKDEP2').read_bytes())
ids=[]
for i in range(len(two)//4):
    offset,=struct.unpack_from('<I',two,i*4)
    fid=offset_id[offset]
    ids.append(fid)
    struct.pack_into('<I',two,i*4,new[fid][0])
count=len(one)//4-1
max_size=0;max_functions=0
for fid in range(count):
    start,size=struct.unpack_from('<HH',one,fid*4)
    end,=struct.unpack_from('<H',one,(fid+1)*4)
    if size==0xffff:continue
    linked=ids[start:end]
    assert fid in linked,(fid,linked)
    total=sum(new[x][1] for x in linked)
    assert total<0xffff,(fid,total)
    assert len(linked)<=35,(fid,len(linked))
    struct.pack_into('<H',one,fid*4+2,total)
    max_size=max(max_size,total);max_functions=max(max_functions,len(linked))
(PATCH/'LINKDEP1').write_bytes(one)
(PATCH/'LINKDEP2').write_bytes(two)
report={'functions':len(new),'dependencies':len(ids),'max_linked_functions':max_functions,'max_cache_body_bytes':max_size,'checks':['original dependency order preserved','every dependency points to the same translated function','cache sizes recalculated','16-bit routine cache limits verified']}
(PATCH/'linkdep-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
