"""Translate the mouse-cursor messages in POINTERS.SHP (TOO HEAVY, OUT OF RANGE,
OUT OF AMMO, WON'T FIT, BLOCKED).

Letters are cut from the English cursors (fill colours only); the dark drop
shadow is recomputed, so new letters drawn in the same 5-pixel style match.
Writes dist/patch/POINTERS.SHP (pt-BR) and dist/patch/es/POINTERS.SHP (es).
"""
from pathlib import Path
import json,os,sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from u7shape import decode_shape,encode_shape,raw_frames

PROJECT=Path(__file__).resolve().parents[1]
ROOT=Path(os.environ.get('U7_GAME_DIR',PROJECT.parent))
SOURCE={3:['TOO','HEAVY'],4:['OUT OF','RANGE'],5:['OUT OF','AMMO'],6:["WON'T",'FIT'],49:['BLOCKED']}
YELLOW=(50,55);RED=(22,25)
COLOURS={3:YELLOW,4:YELLOW,5:RED,6:RED,49:RED}
EXTRA={  # letters absent from the English cursors, same 5-row style
 'S':['.ooo','o...','.oo.','...o','ooo.'],
 'P':['ooo.','o..o','ooo.','o...','o...'],
 'Q':['.oo.','o..o','o..o','o.o.','.o.o'],
 'Z':['oooo','..o.','.o..','o...','oooo'],
}
MARKS={'Á':('A',[(2,-2),(3,-3)]),'Ã':('A',[(0,-2),(1,-3),(2,-2),(3,-3)]),'Ç':('C',[(2,5),(1,6)]),
 'Ó':('O',[(2,-2),(3,-3)]),'Õ':('O',[(0,-2),(1,-3),(2,-2),(3,-3)]),'É':('E',[(2,-2),(3,-3)]),
 'Í':('I',[(1,-2),(2,-3)]),'Ú':('U',[(2,-2),(3,-3)]),'Ñ':('N',[(0,-2),(1,-3),(2,-2),(3,-3)])}

def lines_of(px,fill):
    rows=sorted({y for (x,y),c in px.items() if c in fill})
    groups=[[rows[0]]]
    for y in rows[1:]:
        (groups[-1].append(y) if y==groups[-1][-1]+1 else groups.append([y]))
    return groups

def alphabet(frames):
    letters={}
    for shape,text in SOURCE.items():
        px=frames[shape][0];fill=COLOURS[shape]
        for rows,line in zip(lines_of(px,fill),text):
            top=rows[0]
            cells=[(x,y,c) for (x,y),c in px.items() if c in fill and y in rows]
            cols=sorted({x for x,_,_ in cells});runs=[];start=prev=cols[0]
            for x in cols[1:]:
                if x!=prev+1:runs.append((start,prev));start=x
                prev=x
            runs.append((start,prev))
            chars=line.replace(' ','')
            if len(runs)!=len(chars):continue
            for ch,(a,b) in zip(chars,runs):
                if ch not in letters:
                    tone=dict(zip(fill,('o','+')))
                    letters[ch]={(x-a,y-top):tone[c] for x,y,c in cells if a<=x<=b}
    for ch,rows in EXTRA.items():
        letters.setdefault(ch,{(x,y):'o' for y,row in enumerate(rows) for x,v in enumerate(row) if v=='o'})
    for ch,(base,extra) in MARKS.items():
        g=dict(letters[base])
        if ch=='Í':g={k:v for k,v in g.items()}
        for p in extra:g[p]='o'
        letters[ch]=g
    return letters

def render(lines,letters,colours):
    tone={'o':colours[0],'+':colours[1]}
    out={}
    height=8*len(lines)-3
    for n,line in enumerate(lines):
        row={};x=0
        for ch in line:
            if ch==' ':x+=3;continue
            g=letters[ch]
            for (dx,dy),t in g.items():row[(x+dx,dy)]=tone[t]
            x+=max(dx for dx,_ in g)+2
        shift=-((x-1)//2);top=n*8-height//2
        for (dx,dy),c in row.items():out[(dx+shift,dy+top)]=c
    shadow={}
    for (x,y),c in out.items():
        if (x-1,y+1) not in out:shadow[(x-1,y+1)]=0
    shadow.update(out)
    return shadow

def main():
    blob=(ROOT/'STATIC/POINTERS.SHP').read_bytes();frames=decode_shape(blob);letters=alphabet(frames)
    for language,dest in (('pt-BR',PROJECT/'dist/patch/POINTERS.SHP'),('es',PROJECT/'dist/patch/es/POINTERS.SHP')):
        table=json.loads((PROJECT/f'translations/menu/pointers-{language}.json').read_text(encoding='utf8'))
        out=list(raw_frames(blob))
        for shape,lines in table.items():
            missing={c for l in lines for c in l if c!=' ' and c not in letters}
            assert not missing,(language,shape,missing)
            out[int(shape)]=render(lines,letters,COLOURS[int(shape)])
        dest.write_bytes(encode_shape(out))
        print(f'{dest.relative_to(PROJECT)}: cursor messages in {language}.')

if __name__=='__main__':main()
