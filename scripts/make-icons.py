"""Создание автономных PWA-иконок без сторонних библиотек."""
import struct,zlib,pathlib
def inside(x,y,poly):
    hit=False
    for i,p in enumerate(poly):
        q=poly[i-1]
        if (p[1]>y)!=(q[1]>y) and x<(q[0]-p[0])*(y-p[1])/(q[1]-p[1])+p[0]:hit=not hit
    return hit
for size in [192,512]:
    raw=bytearray()
    shapes=[[(143,192),(256,127),(369,192),(369,216),(256,281),(143,216)],[(143,247),(256,312),(369,247),(369,271),(256,336),(143,271)],[(143,302),(256,367),(369,302),(369,326),(256,391),(143,326)]]
    hole=[(167,204),(256,153),(345,204),(256,255)]
    for y in range(size):
        raw.append(0)
        for x in range(size):
            sx,sy=x*512/size,y*512/size
            ink=any(inside(sx,sy,s) for s in shapes) and not inside(sx,sy,hole)
            raw.extend((214,188,130) if ink else (25,62,50))
    def chunk(t,data):return struct.pack('>I',len(data))+t+data+struct.pack('>I',zlib.crc32(t+data)&0xffffffff)
    data=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b'')
    pathlib.Path(f'public/icon-{size}.png').write_bytes(data)
