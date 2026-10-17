"""Read and write Ultima VII FLX archives and RLE shapes (Exult's shape format)."""
import struct

def read_flx(blob):
    count,=struct.unpack_from('<I',blob,0x54)
    records=[]
    for i in range(count):
        offset,size=struct.unpack_from('<II',blob,0x80+8*i)
        records.append(blob[offset:offset+size] if size else b'')
    return records

def write_flx(header,records):
    base=0x80+8*len(records);table=bytearray();body=bytearray()
    for data in records:
        table+=struct.pack('<II',base+len(body) if data else 0,len(data));body+=data
    head=bytearray(header[:0x80]);struct.pack_into('<I',head,0x54,len(records))
    return bytes(head)+bytes(table)+bytes(body)

def decode_frame(data):
    """Return (pixels dict {(x,y):color}, xleft, xright, yabove, ybelow)."""
    xright,xleft,yabove,ybelow=struct.unpack_from('<hhhh',data,0)
    pos=8;pixels={}
    while True:
        scan,=struct.unpack_from('<H',data,pos);pos+=2
        if scan==0:break
        length=scan>>1;encoded=scan&1
        x,y=struct.unpack_from('<hh',data,pos);pos+=4
        if not encoded:
            for i in range(length):pixels[(x+i,y)]=data[pos+i]
            pos+=length
        else:
            i=0
            while i<length:
                b=data[pos];pos+=1;n=b>>1
                if b&1:
                    c=data[pos];pos+=1
                    for j in range(n):pixels[(x+i+j,y)]=c
                else:
                    for j in range(n):pixels[(x+i+j,y)]=data[pos+j]
                    pos+=n
                i+=n
    return pixels,xleft,xright,yabove,ybelow

def decode_shape(data):
    first,=struct.unpack_from('<I',data,4);count=(first-4)//4
    offsets=[struct.unpack_from('<I',data,4+4*i)[0] for i in range(count)]+[len(data)]
    return [decode_frame(data[offsets[i]:offsets[i+1]]) for i in range(count)]

def encode_frame(pixels):
    """Encode {(x,y):color} relative to the hot spot as an unencoded-run frame."""
    if not pixels:
        return struct.pack('<hhhh',0,0,0,0)+b'\0\0'
    xs=[x for x,_ in pixels];ys=[y for _,y in pixels]
    out=bytearray(struct.pack('<hhhh',max(xs),-min(xs),-min(ys),max(ys)))
    for y in sorted(set(ys)):
        row=sorted(x for x,yy in pixels if yy==y)
        start=prev=row[0];runs=[]
        for x in row[1:]:
            if x==prev+1:prev=x;continue
            runs.append((start,prev));start=prev=x
        runs.append((start,prev))
        for a,b in runs:
            n=b-a+1
            while n>0:
                k=min(n,0x7fff)
                out+=struct.pack('<Hhh',k<<1,a,y)+bytes(pixels[(a+i,y)] for i in range(k))
                a+=k;n-=k
    out+=b'\0\0'
    return bytes(out)

def raw_frames(data):
    first,=struct.unpack_from('<I',data,4);count=(first-4)//4
    offsets=[struct.unpack_from('<I',data,4+4*i)[0] for i in range(count)]+[len(data)]
    return [data[offsets[i]:offsets[i+1]] for i in range(count)]

def encode_shape(frames):
    """frames: pixel dicts, or bytes for frames kept exactly as they were."""
    blobs=[f if isinstance(f,bytes) else encode_frame(f) for f in frames]
    table_size=4+4*len(blobs);offsets=[];pos=table_size
    for b in blobs:offsets.append(pos);pos+=len(b)
    return struct.pack('<I',pos)+b''.join(struct.pack('<I',o) for o in offsets)+b''.join(blobs)
