"""Translate U7 string tables and relocate only real string operands.

Instruction lengths and operand types come from Exult's u7opcodes.data.
Branches, function calls, local/external tables and all non-string operands
are preserved byte for byte. Unknown instructions fail closed.
"""
from dataclasses import dataclass
from pathlib import Path
import argparse
import csv
import hashlib
import json
import re
import struct

ROOT=Path(__file__).resolve().parent


def opcode_table():
    text=(ROOT/'source/reference/exult-8b6ab6b/u7opcodes.data').read_text(encoding='utf8')
    text=re.sub(r'<!--.*?-->','',text,flags=re.S)
    entries=re.split(r'<(0x[0-9A-Fa-f]+)>',text)
    result={}
    sizes={'byte':1,'short':2,'long':4,'flag':2,'extoffset':2,'dataoffset':2,
           'varoffset':2,'offset':2,'dataoffset32':4,'offset32':4,'flag32':4}
    for key,body in zip(entries[1::2],entries[2::2]):
        count=int(re.search(r'<num_bytes>\s*(\d+)',body)[1])
        p=re.search(r'<param_types>\s*\{([^}]*)\}',body)
        types=[t.strip() for t in p[1].split(',') if t.strip()] if p else []
        assert all(t in sizes for t in types),(key,types)
        assert sum(sizes[t] for t in types)==count,(key,count,types)
        result[int(key,16)]=(count,[(t,sizes[t]) for t in types])
    return result


@dataclass
class Function:
    id:int
    header:bytes
    data:bytes
    signature:bytes
    code:bytes
    raw:bytes
    width:int


def functions(blob):
    pos=0
    while pos<len(blob):
        begin=pos
        marker,=struct.unpack_from('<H',blob,pos)
        if marker==0xfffe:
            fid,size=struct.unpack_from('<II',blob,pos+2);hlen=10;w=4
        elif marker==0xffff:
            fid,size=struct.unpack_from('<HI',blob,pos+2);hlen=8;w=4
        else:
            fid,size=struct.unpack_from('<HH',blob,pos);hlen=4;w=2
        end=pos+hlen+size
        assert pos<end<=len(blob),(fid,pos,size)
        ds=int.from_bytes(blob[pos+hlen:pos+hlen+w],'little')
        datastart=pos+hlen+w
        sig=datastart+ds
        assert sig+6<=end,(fid,'bad function header')
        ext,=struct.unpack_from('<H',blob,sig+4)
        code=sig+6+2*ext
        assert code<=end
        yield Function(fid,blob[pos:datastart],blob[datastart:sig],blob[sig:code],blob[code:end],blob[begin:end],w)
        pos=end
    assert pos==len(blob)


def strings(data):
    result=[]; pos=0
    while pos<len(data):
        end=data.find(b'\0',pos)
        assert end>=0,'unterminated string'
        result.append((pos,data[pos:end])); pos=end+1
    return result


def instructions(code,table):
    pos=0
    while pos<len(code):
        opcode=code[pos]
        assert opcode in table, f'Unknown opcode 0x{opcode:02X} at 0x{pos:X}'
        length,params=table[opcode]; end=pos+1+length
        assert end<=len(code),'truncated instruction'
        cursor=pos+1; operands=[]
        for typ,size in params:
            value=int.from_bytes(code[cursor:cursor+size],'little',signed=typ in ('offset','offset32'))
            operands.append((typ,cursor,size,value));cursor+=size
        yield pos,end,opcode,operands
        pos=end
    assert pos==len(code)


def verify_function(f,table):
    ins=list(instructions(f.code,table)); boundaries={p for p,e,o,a in ins}|{len(f.code)}
    for start,end,op,params in ins:
        for typ,pos,size,value in params:
            if typ in ('offset','offset32'):
                assert end+value in boundaries,(hex(f.id),hex(start),'branch into instruction',end+value)
            elif typ in ('dataoffset','dataoffset32'):
                assert 0<=value<len(f.data) and f.data.find(b'\0',value)>=0,(hex(f.id),'bad string ref',value)
    return ins


def rebuild(blob,overrides):
    table=opcode_table(); result=[]; changes=[]; modified=[];seen=set();refcount=0;count=0
    for f in functions(blob):
        count+=1
        ins=verify_function(f,table)
        prefix=f'{f.id:04X}:'
        edits={int(k.split(':')[1]):v for k,v in overrides.items() if k.startswith(prefix)}
        original=strings(f.data)
        assert all(0<=i<len(original) for i in edits),(prefix,'unknown string index')
        if not edits:
            result.append(f.raw);continue
        newdata=bytearray(); offsets={}; translated={}
        for i,(oldoffset,oldtext) in enumerate(original):
            key=prefix+str(i)
            newtext=edits[i].encode('latin1') if i in edits else oldtext
            assert b'\0' not in newtext,(key,'NUL in translation')
            offsets[oldoffset]=len(newdata);translated[oldoffset]=newtext
            newdata+=newtext+b'\0'
            if i in edits:
                seen.add(key)
                changes.append({'key':key,'original':oldtext.decode('latin1'),'translation':edits[i],
                                'old_bytes':len(oldtext),'new_bytes':len(newtext)})
        code=bytearray(f.code);mask=bytearray(b'\xff'*len(code));nrefs=0
        for start,end,op,params in ins:
            for typ,pos,size,oldoffset in params:
                if typ not in ('dataoffset','dataoffset32'):continue
                assert oldoffset in offsets,(prefix,'interior string reference requires manual handling',oldoffset)
                newoffset=offsets[oldoffset]
                assert newoffset<(1<<(8*size)),(prefix,'string offset exceeds opcode field')
                code[pos:pos+size]=newoffset.to_bytes(size,'little')
                mask[pos:pos+size]=b'\0'*size
                assert bytes(newdata[newoffset:]).split(b'\0',1)[0]==translated[oldoffset]
                nrefs+=1
        # All command and branch bytes remain identical. Only data pointers differ.
        assert bytes(a&m for a,m in zip(f.code,mask))==bytes(a&m for a,m in zip(code,mask))
        header=bytearray(f.header);size=f.width+len(newdata)+len(f.signature)+len(code)
        assert size<(1<<(8*f.width)),(prefix,'function exceeds its length field; no truncation performed')
        header[-f.width:]=len(newdata).to_bytes(f.width,'little')
        sizepos=len(header)-2*f.width
        header[sizepos:sizepos+f.width]=size.to_bytes(f.width,'little')
        packed=bytes(header+newdata+f.signature+code)
        reread=list(functions(packed));assert len(reread)==1
        verify_function(reread[0],table)
        assert reread[0].signature==f.signature and len(reread[0].code)==len(f.code)
        result.append(packed);refcount+=nrefs
        modified.append({'id':f'{f.id:04X}','old_bytes':len(f.raw),'new_bytes':len(packed),'string_references':nrefs})
    assert set(overrides)==seen,('unknown override keys',set(overrides)-seen)
    output=b''.join(result)
    assert len(list(functions(output)))==count
    return output,{'functions_checked':count,'modified_functions':modified,'translated_strings':len(changes),
       'relocated_references':refcount,'translations_longer_than_original':sum(c['new_bytes']>c['old_bytes'] for c in changes),
       'old_size':len(blob),'new_size':len(output),'sha256':hashlib.sha256(output).hexdigest(),
       'checks':['All original instructions decoded using Exult opcode metadata',
          'All branch targets remain instruction boundaries','All string references point at the expected translated string',
          'Unmodified functions preserved byte for byte','All bytes outside string operands preserved in modified bytecode',
          'Function signatures, locals and external calls preserved'],'changes':changes}


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--input',type=Path,default=ROOT.parent/'STATIC/USECODE')
    ap.add_argument('--overrides',type=Path,default=ROOT/'source/usecode/ptbr-overrides-reflow.json')
    ap.add_argument('--output',type=Path,required=True);args=ap.parse_args()
    raw=args.input.read_bytes();ov=json.loads(args.overrides.read_text(encoding='utf-8-sig'))
    # No-translation build must be byte-identical before processing user edits.
    identity,_=rebuild(raw,{})
    assert identity==raw
    output,report=rebuild(raw,ov)
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_bytes(output)
    args.output.with_name(args.output.name+'-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
    summary={k:v for k,v in report.items() if k!='changes'};print(json.dumps(summary,indent=2))


if __name__=='__main__':main()
