"""Rebuild the original main-menu button graphics (MAINSHP.FLX) in Brazilian Portuguese.

The buttons are pre-drawn bitmaps. Letters are cut from the original buttons
(frame 0 = lit, frame 1 = dim) and recomposed; accents are drawn in the same
palette. Writes dist/patch/MAINSHP.FLX.
"""
from pathlib import Path
import os,sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from u7shape import read_flx,write_flx,decode_shape,encode_shape,raw_frames
import json

PROJECT=Path(__file__).resolve().parents[1]
ROOT=Path(os.environ.get('U7_GAME_DIR',PROJECT.parent))
SOURCE={4:'VIEW INTRODUCTION',5:'START NEW GAME',6:'VIEW CREDITS',7:'RETURN TO MENU',8:'JOURNEY ONWARD',
        10:'SEX:',12:'NAME:',17:'VIEW QUOTES',18:'VIEW ENDGAME',22:'MALE',23:'FEMALE'}
TARGET={4:'VER INTRODUÇÃO',5:'NOVO JOGO',6:'VER CRÉDITOS',7:'VOLTAR AO MENU',8:'SEGUIR JORNADA',
        10:'SEXO:',12:'NOME:',17:'VER CITAÇÕES',18:'VER O FINAL',22:'MASCULINO',23:'FEMININO'}
DIM={135:133,136:133,132:131,133:132,134:132}
BRIGHT,MID,SHADOW=136,135,132
ACCENTS={  # base letter, extra pixels relative to the glyph's left/top: (dx, dy, colour)
 'É':('E',[(4,-2,BRIGHT),(3,-1,BRIGHT)]),
 'Ã':('A',[(1,-1,BRIGHT),(2,-2,BRIGHT),(3,-2,BRIGHT),(4,-1,BRIGHT),(5,-1,BRIGHT),(6,-2,BRIGHT)]),
 'Õ':('O',[(1,-1,BRIGHT),(2,-2,BRIGHT),(3,-2,BRIGHT),(4,-1,BRIGHT),(5,-1,BRIGHT),(6,-2,BRIGHT)]),
 'Ç':('C',[(3,8,BRIGHT),(4,9,BRIGHT),(3,10,BRIGHT),(2,10,MID)]),
 'Ó':('O',[(4,-2,BRIGHT),(3,-1,BRIGHT)]),
 'Ú':('U',[(4,-2,BRIGHT),(3,-1,BRIGHT)]),
}
TARGET_ES={4:'VER INTRODUCCIÓN',5:'NUEVO JUEGO',6:'VER CRÉDITOS',7:'VOLVER AL MENÚ',8:'CONTINUAR VIAJE',
        10:'SEXO:',12:'NOMBRE:',17:'VER CITAS',18:'VER EL FINAL',22:'MASCULINO',23:'FEMENINO'}
SPACE=5

def segments(pixels):
    cols=sorted({x for x,_ in pixels});runs=[];start=prev=cols[0]
    for x in cols[1:]:
        if x!=prev+1:runs.append((start,prev));start=x
        prev=x
    runs.append((start,prev));return runs

def alphabet(records):
    letters={}
    for shape,text in SOURCE.items():
        lit,dim=[f[0] for f in decode_shape(records[shape])[:2]]
        chars=text.replace(' ','')
        runs=segments(lit);assert len(runs)==len(chars),(shape,text)
        for ch,(a,b) in zip(chars,runs):
            if ch in letters:continue
            letters[ch]=({(x-a,y):c for (x,y),c in lit.items() if a<=x<=b},
                         {(x-a,y):c for (x,y),c in dim.items() if a<=x<=b})
    # B does not occur in the English buttons: the bowl of R over the bottom of D
    r_lit,r_dim=letters['R'];d_lit,d_dim=letters['D']
    letters['B']=({k:v for k,v in r_lit.items() if k[1]<=3}|{k:v for k,v in d_lit.items() if k[1]>=4},
                  {k:v for k,v in r_dim.items() if k[1]<=3}|{k:v for k,v in d_dim.items() if k[1]>=4})
    for ch,(base,extra) in ACCENTS.items():
        lit,dim=(dict(g) for g in letters[base])
        for dx,dy,c in extra:lit[(dx,dy)]=c;dim[(dx,dy)]=DIM[c]
        letters[ch]=(lit,dim)
    return letters

def compose(text,letters):
    lit={};dim={};x=0
    for ch in text:
        if ch==' ':x+=SPACE;continue
        a,b=letters[ch];width=max(px for px,_ in a)+1
        for (px,py),c in a.items():lit[(x+px,py)]=c
        for (px,py),c in b.items():dim[(x+px,py)]=c
        x+=width+1
    return lit,dim

# Accented letters are stored in unused low frames of the menu/intro fonts.
# Codes 1-2 (©), 9/10/13 (tab/line breaks) and 26 (DOS EOF) are avoided.
ACCENTED='áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ'
CODES=[3,4,5,6,7,8,11,12,14,15,16,17,18,19,20,21,22,23,24,25,27,28,29,30]
CODE_MAP=dict(zip(ACCENTED,CODES))
MARKS={'á':'acute','é':'acute','í':'acute','ó':'acute','ú':'acute','à':'grave','â':'circ','ê':'circ','ô':'circ',
       'ã':'tilde','õ':'tilde','ç':'cedilla'}
BASE={'á':'a','à':'a','â':'a','ã':'a','é':'e','ê':'e','í':'i','ó':'o','ô':'o','õ':'o','ú':'u','ç':'c'}
SHAPES={'acute':[(0,-2),(1,-3)],'grave':[(0,-2),(-1,-3)],'circ':[(-1,-2),(0,-3),(1,-2)],
        'tilde':[(-2,-2),(-1,-3),(0,-2),(1,-3)],'cedilla':[(0,1),(-1,2)]}

def encode_text(text):
    return ''.join(chr(CODE_MAP[c]) if c in CODE_MAP else c for c in text).encode('latin1')

def accented_glyph(frames,char):
    lower=char.lower();base=BASE[lower];base=base.upper() if char.isupper() else base
    pixels=dict(frames[ord(base)][0])
    if base=='i':  # drop the dot of the i before adding the accent
        rows=sorted({y for _,y in pixels})
        for a,b in zip(rows,rows[1:]):
            if b>a+1:
                pixels={k:v for k,v in pixels.items() if k[1]>a};break
    colours=[c for c in pixels.values() if c]
    main=max(set(colours),key=colours.count) if colours else 0
    xs=[x for x,_ in pixels];ys=[y for _,y in pixels]
    cx=(min(xs)+max(xs))//2;mark=MARKS[lower]
    anchor=max(ys) if mark=='cedilla' else min(ys)
    for dx,dy in SHAPES[mark]:pixels[(cx+dx,anchor+dy)]=main
    return pixels

def add_accents(shape_blob):
    frames=decode_shape(shape_blob);pixels=list(raw_frames(shape_blob))
    for char,code in CODE_MAP.items():
        if ord(BASE[char.lower()].upper() if char.isupper() else BASE[char.lower()])<len(frames):
            pixels[code]=accented_glyph(frames,char)
    return encode_shape(pixels)

def text_record(name):
    text=(PROJECT/'translations/menu'/name).read_text(encoding='utf8')
    return encode_text(text.replace('\r\n','\n').replace('\n','\r\n'))

def caption_frames(font_blob,captions):
    """Redraw the intro's sentence images with the intro's gothic font, two colours like the originals."""
    frames=decode_shape(font_blob);result={}
    for key,lines in captions.items():
        rendered=[];
        for line in lines:
            px={};x=0
            for ch in line:
                g=frames[ord(ch)][0] if ord(ch)<len(frames) and ch not in CODE_MAP else (accented_glyph(frames,ch) if ch in CODE_MAP else {})
                if ch==' ' or not g:x+=4;continue
                gx=[a for a,_ in g]
                for (a,b),c in g.items():px[(x+a-min(gx),b)]=0 if c==0 else 11
                x+=max(gx)-min(gx)+1-1
            rendered.append((px,x))
        width=max(w for _,w in rendered);height=13
        scale=min(2.0,318/width,47/(height*len(lines)))
        out={};top=0
        for px,w in rendered:
            left=-int(w*scale)//2
            for (a,b),c in px.items():
                for sx in range(int(a*scale),int((a+1)*scale)):
                    for sy in range(int((b+10)*scale),int((b+11)*scale)):
                        out[(left+sx,top+sy)]=c
            top+=int(height*scale)+1
        result[int(key)]=out
    return result

def main():
    blob=(ROOT/'STATIC/MAINSHP.FLX').read_bytes();records=read_flx(blob);letters=alphabet(records)
    for shape,text in TARGET.items():
        frames=compose(text,letters)
        records[shape]=encode_shape(list(frames))
    # shape 11: the male/female toggle, one frame each
    records[11]=encode_shape([compose(TARGET[22],letters)[0],compose(TARGET[23],letters)[0]])
    records[3]=add_accents(records[3]);records[9]=add_accents(records[9])
    records[13]=text_record('intro-subtitles.txt');records[14]=text_record('credits.txt')
    records[16]=text_record('quotes.txt');records[21]=text_record('desert-ending.txt')
    out=PROJECT/'dist/patch/MAINSHP.FLX';out.write_bytes(write_flx(blob,records))
    ends=(ROOT/'STATIC/ENDSHAPE.FLX').read_bytes();endrec=read_flx(ends)
    captions=json.loads((PROJECT/'translations/menu/intro-captions.json').read_text(encoding='utf8'))
    for key,pixels in caption_frames(records[3],captions).items():endrec[key]=encode_shape([pixels])
    (PROJECT/'dist/patch/ENDSHAPE.FLX').write_bytes(write_flx(ends,endrec))
    # Spanish: menu buttons only (the subtitles and credits stay in the original language)
    es=read_flx(blob)
    for shape,text in TARGET_ES.items():es[shape]=encode_shape(list(compose(text,letters)))
    es[11]=encode_shape([compose(TARGET_ES[22],letters)[0],compose(TARGET_ES[23],letters)[0]])
    (PROJECT/'dist/patch/es/MAINSHP.FLX').write_bytes(write_flx(blob,es))
    print('es/MAINSHP.FLX: menu buttons in Spanish.')
    print('ENDSHAPE.FLX: intro captions redrawn in PT-BR.')
    print(f'MAINSHP.FLX: {len(TARGET)+1} menu labels rebuilt in PT-BR.')

if __name__=='__main__':main()
