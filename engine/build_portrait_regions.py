"""Where each portrait is likely needed: every place an NPC's schedule takes it
(SCHEDULE.DAT), for the page to preload the portraits of the people near the
Avatar. Writes dist/portraits/regions.json as [[face, tile_x, tile_y], ...]."""
from pathlib import Path
import json,os,struct
PROJECT=Path(__file__).resolve().parents[1]
ROOT=Path(os.environ.get('U7_GAME_DIR',PROJECT.parent))

def schedule():
    # From the game installation if there is one, otherwise from the packed game data.
    path=ROOT/'STATIC/SCHEDULE.DAT'
    if path.exists():return path.read_bytes()
    manifest=json.loads((PROJECT/'dist/game-data/manifest.json').read_text())
    entry=next(f for f in manifest['files'] if f['name']=='SCHEDULE.DAT')
    with open(PROJECT/'dist'/manifest['url'],'rb') as pack:
        pack.seek(entry['offset']);return pack.read(entry['size'])

def main():
    data=schedule()
    count=struct.unpack_from('<i',data,0)[0]
    offsets=[struct.unpack_from('<H',data,4+2*i)[0] for i in range(count)]
    base=4+2*count;total=(len(data)-base)//4
    faces=set(json.loads((PROJECT/'dist/portraits/faces/manifest.json').read_text())['ids'])
    points=set()
    for npc in range(1,count+1):   # schedule entries of NPC n run from offsets[n-1] to offsets[n]
        if npc not in faces:continue
        start=offsets[npc-1];end=offsets[npc] if npc<count else total
        for k in range(start,end):
            e=data[base+4*k:base+4*k+4];chunk=e[3]
            x=(chunk%12)*256+e[1];y=(chunk//12)*256+e[2]
            points.add((npc,x//16*16+8,y//16*16+8))
    out=PROJECT/'dist/portraits/regions.json'
    out.write_text(json.dumps(sorted(points),separators=(',',':')))
    print(f'{out.relative_to(PROJECT)}: {len(points)} schedule places for {len({p[0] for p in points})} portraits.')

if __name__=='__main__':main()
