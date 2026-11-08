# ingest.py id[:cx]=<screenshot path> ...   crops each saved 800x447 screenshot to card aspect, keeps the raw, rebuilds art_gen.js
import sys, os, subprocess, json
from PIL import Image
os.makedirs('gen/raw',exist_ok=True)
for spec in sys.argv[1:]:
    idc,_,path=spec.partition('='); cid,_,cx=idc.partition(':'); cx=float(cx) if cx else 0.5
    im=Image.open(path).convert('RGB'); assert im.size[0]>=700, (cid, im.size)
    im.save(f'gen/raw/{cid}.jpg','JPEG',quality=92)
    W,H=im.size; tw=int(H*300/220); x0=max(0,min(W-tw,int((W-tw)*cx)))
    im.crop((x0,0,x0+tw,H)).resize((600,440),Image.LANCZOS).save(f'gen/{cid}.webp','WEBP',quality=80,method=6)
    print('ok',cid)
subprocess.run(["python3","gen_art.py"],check=True)
