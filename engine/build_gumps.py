"""Translate the text painted inside GUMPS.VGA (stats panel, spell scroll labels,
yes/no and quit dialogs) and turn the paperdoll panels into key silhouettes.

The labels are part of the bitmaps: the English letters are erased (each pixel
takes the dominant background colour of its row) and the new text is drawn with
the same family of letters the game uses:
  * stats panel and dialogs: FONTS.VGA font 2, the font the engine uses for the
    numbers printed on that panel;
  * spell labels and YES/NO buttons: the 3x5 capitals cut from the labels.
Writes dist/patch/GUMPS.VGA (pt-BR), dist/patch/es/GUMPS.VGA (es) and
dist/patch/en/GUMPS.VGA (English: paperdoll silhouettes only).
"""
from pathlib import Path
from collections import Counter
import json,os,sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from u7shape import read_flx,write_flx,decode_shape,encode_shape,raw_frames

PROJECT=Path(__file__).resolve().parents[1]
ROOT=Path(os.environ.get('U7_GAME_DIR',PROJECT.parent))
SPELLS_EN=('Awaken,Create Food,Destroy Trap,Curse,Conjure,Charm,Cause Fear,Create Gold,Armageddon,'
 'Weather,Cure,Enchant,Heal,Lightning,Dance,Clone,Death Bolt,Death Vortex,'
 'Douse,Detect Trap,Fire Blast,Swarm,Mark,Dispel Field,Fire Ring,Delayed Blast,Mass Death,'
 'Fireworks,Great Douse,Great Light,Protect All,Mass Curse,Explosion,Flame Strike,Energy Field,Invisible All,'
 'Glimmer,Great Ignite,Mass Cure,Paralyze,Recall,Great Heal,Magic Storm,Energy Mist,Resurrect,'
 'Help,Light,Protection,Peer,Reveal,Invisibility,Poison Field,Mass Charm,Summon,'
 'Ignite,Locate,Telekinesis,Poison,Seance,Fire Field,Sleep Field,Mass Might,Swordstrike,'
 'Thunder,Awaken All,Wizard Eye,Sleep,Unlock Magic,Mass Sleep,Tremor,Restoration,Time Stop').split(',')
STAT_BASELINES=[23,32,41,52,61,72,81,92,101,110]
DARK={0}
PAPERDOLL_RECORDS=(57,58,59,60,61,62,63,65,66,67,68)

# Paperdoll panels become flat silhouettes in this palette index, which almost
# no object, font or cursor uses. The page paints the high-resolution panel,
# figure and load text wherever the key is still visible (dist/app.js).
PAPERDOLL_KEY=16

def paperdoll_geometry(records):
    """Silhouette rectangles and slot guide pixels of each original paperdoll,
    for the high-resolution panels the page paints (dist/inventory/panels.json)."""
    panels={}
    for shape in range(57,69):
        if not records[shape]:continue
        px=frame_pixels(records[shape])[0]
        rows={}
        for x,y in px:rows.setdefault(y,[]).append(x)
        rects=[]
        for y in sorted(rows):
            xs=sorted(rows[y]);runs=[];a=b=xs[0]
            for x in xs[1:]:
                if x!=b+1:runs.append((a,b));a=x
                b=x
            runs.append((a,b))
            for a,b in runs:
                match=next((r for r in rects if r[1]==y-1 and r[2]==a and r[3]==b),None)
                if match:match[1]=y
                else:rects.append([y,y,a,b])
        panels[shape]={'rects':rects,'guides':sorted([x,y] for (x,y),c in px.items() if c==77)}
    return panels

# Inventory buttons redrawn as high-resolution icons (dist/inventory/icons):
# halo (protect), save disk, heart (stats), dove / flaming sword (combat).
ICON_RECORDS=(7,24,25,46,72,73)
# Records 72 and 73 are unused by the game; paperdolls draw their close and
# attack-mode buttons from these copies of records 2 and 12 (engine/prepare.py).
BUTTON_COPIES={72:2,73:12}

def icon_geometry(records):
    """Extent of each icon frame left of and above its hot spot."""
    icons={}
    for shape in ICON_RECORDS:
        icons[shape]=[]
        for px in frame_pixels(records[BUTTON_COPIES.get(shape,shape)]):
            xs=[x for x,_ in px];ys=[y for _,y in px]
            icons[shape].append([min(xs),min(ys),max(xs),max(ys)])
    return icons

def flatten_paperdolls(records):
    for copy,source in BUTTON_COPIES.items():records[copy]=records[source]
    for shape in range(57,69):
        if not records[shape]:continue
        frames=frame_pixels(records[shape])
        for px in frames:
            for point in px:px[point]=PAPERDOLL_KEY
        records[shape]=encode_shape(frames)
    # buttons become solid key rectangles: the page draws the whole button
    for shape in ICON_RECORDS:
        frames=frame_pixels(records[shape])
        for px in frames:
            xs=[x for x,_ in px];ys=[y for _,y in px]
            for y in range(min(ys),max(ys)+1):
                for x in range(min(xs),max(xs)+1):px[(x,y)]=PAPERDOLL_KEY
        records[shape]=encode_shape(frames)

def frame_pixels(shape_blob):
    return [f[0] for f in decode_shape(shape_blob)]

def row_background(px,y,x0,x1):
    counts=Counter(c for (x,yy),c in px.items() if yy==y and x0<=x<=x1 and c not in DARK)
    return counts.most_common(1)[0][0] if counts else None

def flatten(px,x0,x1,y0,y1):
    """Paint a button face with its dominant (non-text) colour."""
    counts=Counter(c for (x,y),c in px.items() if x0<=x<=x1 and y0<=y<=y1 and c not in DARK)
    face=counts.most_common(1)[0][0]
    for (x,y) in list(px):
        if x0<=x<=x1 and y0<=y<=y1:px[(x,y)]=face

def erase(px,x0,x1,y0,y1):
    for y in range(y0,y1+1):
        bg=row_background(px,y,x0,x1)
        if bg is None:
            for d in range(1,6):
                bg=row_background(px,y-d,x0,x1) or row_background(px,y+d,x0,x1)
                if bg is not None:break
        for x in range(x0,x1+1):
            if px.get((x,y)) in DARK and bg is not None:px[(x,y)]=bg

# ---- FONTS.VGA glyphs --------------------------------------------------------
class ShapeFont:
    def __init__(self,blob,spacing=1):
        self.frames=decode_shape(blob);self.spacing=spacing
    def glyph(self,ch):
        code=ch.encode('latin1')[0]
        return self.frames[code][0] if code<len(self.frames) else {}
    def advance(self,ch):
        g=self.glyph(ch)
        if not g:
            f=self.frames[ord(' ')];return max(3,f[2]-f[1]+1)
        xs=[x for x,_ in g];return max(xs)+1+self.spacing
    def width(self,text):return sum(self.advance(c) for c in text)-self.spacing
    def draw(self,px,text,x,baseline,colour=0):
        for ch in text:
            for (gx,gy),c in self.glyph(ch).items():px[(x+gx,baseline+gy)]=colour if c==0 or colour is not None else c
            x+=self.advance(ch)

# ---- 3x5 capitals cut from the spell labels ----------------------------------
EXTRA_LETTERS={'J':['..#','..#','..#','#.#','.#.'],'Q':['.#.','#.#','#.#','##.','.##'],'Z':['###','..#','.#.','#..','###']}
ACCENT_ROW={'acute':[(2,-1)],'grave':[(0,-1)],'circ':[(1,-1)],'tilde':[(0,-1),(1,-1),(2,-1)],'cedilla':[(1,5)]}
ACCENTS={'Á':('A','acute'),'À':('A','grave'),'Â':('A','circ'),'Ã':('A','tilde'),'É':('E','acute'),'Ê':('E','circ'),
 'Í':('I','acute'),'Ó':('O','acute'),'Ô':('O','circ'),'Õ':('O','tilde'),'Ú':('U','acute'),'Ç':('C','cedilla'),'Ñ':('N','tilde')}

def segments(cols):
    runs=[];start=prev=cols[0]
    for x in cols[1:]:
        if x!=prev+1:runs.append((start,prev));start=x
        prev=x
    runs.append((start,prev));return runs

class TinyFont:
    """Glyphs keyed by letter: {(dx,dy):colour}, dy 0..4 for the cap height."""
    def __init__(self,spell_records):
        self.glyphs={}
        for index,name in enumerate(SPELLS_EN):
            shape=33+index//9;frame=index%9
            if name in ('Unlock Magic','Mass Sleep'):continue
            px=frame_pixels(spell_records[shape])[frame]
            text=[(x,y) for (x,y),c in px.items() if c in DARK and -14<=y<=-10]
            if not text:continue
            letters=name.upper().replace(' ','')
            runs=segments(sorted({x for x,_ in text}))
            runs=self.cut_icon(runs,len(letters))
            if len(runs)!=len(letters):continue
            for ch,(a,b) in zip(letters,runs):
                if ch in self.glyphs:continue
                self.glyphs[ch]={(x-a,y+14):0 for (x,y) in text if a<=x<=b}
        for ch,rows in EXTRA_LETTERS.items():
            if ch not in self.glyphs:
                self.glyphs[ch]={(x,y):0 for y,row in enumerate(rows) for x,v in enumerate(row) if v=='#'}
        for ch,(base,mark) in ACCENTS.items():
            if base in self.glyphs:
                g=dict(self.glyphs[base]);w=max(x for x,_ in g)
                for dx,dy in ACCENT_ROW[mark]:g[(min(dx,w+1) if w<2 else min(dx,w),dy)]=0
                self.glyphs[ch]=g
    @staticmethod
    def cut_icon(runs,count):
        # the label text ends where a wide gap separates it from an icon
        for i in range(1,len(runs)):
            if runs[i][0]-runs[i-1][1]>5:return runs[:i] if i>=count else runs
        return runs
    def advance(self,ch):
        if ch==' ':return 3
        return max(x for x,_ in self.glyphs[ch])+2
    def width(self,text):return sum(self.advance(c) for c in text)-1
    def draw(self,px,text,x,top,colour=0):
        for ch in text:
            if ch!=' ':
                for (gx,gy),_ in self.glyphs[ch].items():px[(x+gx,top+gy)]=colour
            x+=self.advance(ch)

def text_extent(px,y0,y1,x0=-999,x1=999):
    xs=sorted({x for (x,y),c in px.items() if c in DARK and y0<=y<=y1 and x0<=x<=x1})
    return xs

def word_groups(px,y0,y1,x0=-999,x1=999):
    xs=text_extent(px,y0,y1,x0,x1)
    if not xs:return []
    groups=[]
    for a,b in segments(xs):
        if groups and a-groups[-1][1]<=5:groups[-1][1]=b
        else:groups.append([a,b])
    return groups

def build(language,table,fonts,tiny,blob):
    records=read_flx(blob)
    # stats panel
    px=frame_pixels(records[47])[0]
    for baseline in STAT_BASELINES:erase(px,28,122,baseline-8,baseline+2)
    for baseline,label in zip(STAT_BASELINES,table['stats']):
        fonts[2].draw(px,label,33,baseline)
    records[47]=encode_shape([px])
    flatten_paperdolls(records)
    # spell labels: the name keeps the original position; "|" sends the rest to the right-hand group
    names=table['spells']
    for shape in range(33,41):
        frames=frame_pixels(records[shape]);out=[]
        for frame,px in enumerate(frames):
            index=(shape-33)*9+frame;english=SPELLS_EN[index]
            groups=word_groups(px,-14,-10)
            start=groups[0][0];erase(px,start-1,groups[0][1]+1,-15,-9)
            if english=='Mass Sleep':erase(px,groups[-1][0]-1,groups[-1][1]+1,-15,-9)
            if english=='Unlock Magic':
                second=word_groups(px,-8,-4,x1=-15)
                erase(px,second[0][0]-1,second[0][1]+1,-9,-3)
            name=names[index]
            if '|' in name:
                left,right=name.split('|')
                tiny.draw(px,left,start,-14);tiny.draw(px,right,groups[-1][1]-tiny.width(right)+1,-14)
            else:
                for n,line in enumerate(name.split('\n')):tiny.draw(px,line,start,-14+6*n)
            out.append(px)
        records[shape]=encode_shape(out)
    # dialogs: text only, on a transparent background
    out=[]
    for frame,lines in enumerate(table['dialogs']):
        px={};top=-22 if frame==0 else -26
        for n,line in enumerate(lines):
            w=fonts[2].width(line);fonts[2].draw(px,line,-57-w//2,top+6+8*n+ (0 if frame==0 else 0))
        out.append(px)
    records[52]=encode_shape(out)
    # yes / no buttons and quit
    for shape,word in ((70,table['yes']),(71,table['no'])):
        frames=frame_pixels(records[shape]);out=[]
        for pressed,px in enumerate(frames):
            xs=[x for x,_ in px];flatten(px,min(xs)+2,max(xs)-2,-8,-2)
            w=tiny.width(word);tiny.draw(px,word,(min(xs)+max(xs))//2-w//2+pressed,-7+pressed)
            out.append(px)
        records[shape]=encode_shape(out)
    frames=frame_pixels(records[56]);out=[]
    for px in frames:
        erase(px,-58,-1,-9,-1)
        w=fonts[2].width(table['quit']);fonts[2].draw(px,table['quit'],-30-w//2,-2)
        out.append(px)
    records[56]=encode_shape(out)
    return write_flx(blob,records)

def main():
    blob=(ROOT/'STATIC/GUMPS.VGA').read_bytes();records=read_flx(blob)
    font_blob=read_flx((PROJECT/'dist/patch/FONTS.VGA').read_bytes())
    fonts={2:ShapeFont(font_blob[2]),4:ShapeFont(font_blob[4])}
    tiny=TinyFont(records)
    for language,dest in (('pt-BR',PROJECT/'dist/patch/GUMPS.VGA'),('es',PROJECT/'dist/patch/es/GUMPS.VGA')):
        table=json.loads((PROJECT/f'translations/menu/gumps-{language}.json').read_text(encoding='utf8'))
        assert len(table['spells'])==72 and len(table['stats'])==10
        missing={c for name in table['spells']+[table['yes'],table['no']] for c in name if c not in ' \n|' and c not in tiny.glyphs}
        assert not missing,(language,'letters missing from the 3x5 font',missing)
        dest.write_bytes(build(language,table,fonts,tiny,blob))
        print(f'{dest.relative_to(PROJECT)}: panels, inventory, spell labels and dialogs in {language}.')
    geometry=PROJECT/'dist/inventory/panels.json'
    panels=paperdoll_geometry(read_flx(blob));panels['icons']=icon_geometry(read_flx(blob))
    geometry.write_text(json.dumps(panels,separators=(',',':')))
    print(f'{geometry.relative_to(PROJECT)}: paperdoll silhouettes and slot guides.')
    # English keeps every original label; only the paperdolls change.
    records=read_flx(blob);flatten_paperdolls(records)
    dest=PROJECT/'dist/patch/en/GUMPS.VGA';dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_bytes(write_flx(blob,records))
    print(f'{dest.relative_to(PROJECT)}: paperdoll silhouettes for English.')

if __name__=='__main__':main()
