import sys,re,math; sys.path.insert(0,sys.argv[1]); from c2lib import *
def ld(f): return parse(re.findall(r'\bd="([^"]+)"',open(f).read())[0])
for f in sys.argv[2:]:
    subs=ld(f); name=f.split('/')[-1]
    holes=[k for k in range(1,len(subs)) if k!=7 and k<len(subs)]
    # ink run through the centre: at each height, the solid width around x=105 (distance between nearest openings left/right)
    def runs(y):
        xs=[]
        for k in range(len(subs)):
            P=sample(subs[k],600)
            for (x1,y1),(x2,y2) in zip(P,P[1:]+P[:1]):
                if (y1<=y<y2) or (y2<=y<y1): xs.append(x1+(y-y1)*(x2-x1)/(y2-y1))
        xs.sort(); left=max([x for x in xs if x<105-0.01],default=None); right=min([x for x in xs if x>105+0.01],default=None)
        return left,right
    row=[]
    for y in (150,155,160,165,170,175):
        l,r=runs(y); row.append(f'y{y}: {r-l:5.1f}' if l and r else f'y{y}: -')
    # body V tip and leaf-opening root points
    body=sample(subs[3],600); tip=max(body,key=lambda p:p[1])
    lf=sample(subs[1],600); rootpt=max(lf,key=lambda p:p[0])
    # largest solid disc in the root zone: max over points of distance to nearest edge, region x 90..120, y 150..178
    edges=[p for k in range(len(subs)) for p in sample(subs[k],400)]
    best=0;bp=None
    for x in [90+i*0.5 for i in range(61)]:
        for y in [150+j*0.5 for j in range(57)]:
            q=(x,y)
            # inside ink? crude: skip if inside body V or leaf openings or side openings (inside hole polygons)
            def pip(q,poly):
                c=False
                for (x1,y1),(x2,y2) in zip(poly,poly[1:]+poly[:1]):
                    if (y1>q[1])!=(y2>q[1]) and q[0]<x1+(q[1]-y1)*(x2-x1)/(y2-y1): c=not c
                return c
            if any(pip(q,sample(subs[k],80)) for k in (1,2,3,4,5)): continue
            if not pip(q,sample(subs[0],200)): continue
            d=min(math.dist(q,e) for e in edges)
            if d>best: best,bp=d,q
    print(f'{name:22s} solid width through centre  '+'  '.join(row)+f'\n{"":22s} body V tip y {tip[1]:.1f} | leaf opening root end x {rootpt[0]:.1f} | thickest root disc {2*best:.1f} at ({bp[0]:.1f},{bp[1]:.1f})')
