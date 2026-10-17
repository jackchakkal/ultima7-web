"""Apply extra PT-BR entries to dist/patch/TEXT.FLX, keeping the FLX header and order.

Entries are keyed by record index; text is encoded as Latin-1 with a NUL terminator.
"""
from pathlib import Path
import json,struct

PROJECT=Path(__file__).resolve().parents[1]
FLX=PROJECT/'dist/patch/TEXT.FLX'
extra=json.loads((PROJECT/'translations/textflx-pt-extra.json').read_text(encoding='utf8'))
blob=FLX.read_bytes()
count,=struct.unpack_from('<I',blob,0x54)
records=[]
for i in range(count):
    offset,size=struct.unpack_from('<II',blob,0x80+8*i)
    records.append(blob[offset:offset+size] if size else b'')
for key,text in extra.items():
    index=int(key);assert 0<=index<count and records[index],key
    records[index]=text.encode('latin1')+b'\0'
table=bytearray();body=bytearray();base=0x80+8*count
for data in records:
    table+=struct.pack('<II',base+len(body) if data else 0,len(data));body+=data
FLX.write_bytes(blob[:0x80]+bytes(table)+bytes(body))
print(f'TEXT.FLX: {len(extra)} extra entries applied to {count} records.')
