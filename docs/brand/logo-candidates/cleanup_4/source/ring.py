import sys,re,math; sys.path.insert(0,sys.argv[1]); from c2lib import *
subs=parse(re.findall(r'\bd="([^"]+)"',open(sys.argv[2]).read())[0])
names=['outer','leafL','leafR','body','sideL','sideR','centre','head']
O=sample(subs[1],600); A=min(O,key=lambda p:p[0]); Bp=max(O,key=lambda p:p[0]); ux,uy=Bp[0]-A[0],Bp[1]-A[1]
others=[(k,p) for k in range(8) if k!=1 for p in sample(subs[k],300)]
def near(p):
    best=min(others,key=lambda kp:math.dist(kp[1],p)); return math.dist(best[1],p),names[best[0]]
for side in ('top','bottom'):
    pts=[p for p in O if ((p[0]-A[0])*uy-(p[1]-A[1])*ux>0)==(side=='top')]
    print(f'--- {side} edge of the left leaf opening: stroke width to the nearest other edge')
    for x in range(20,100,5):
        p=min(pts,key=lambda q:abs(q[0]-x)); d,n=near(p); print(f'  x={x:3d} y={p[1]:6.1f}  width {d:5.2f}  (vs {n})')
print('outer tip of the silhouette (leftmost points):')
OUT=sample(subs[0],800); L=sorted(OUT,key=lambda p:p[0])[:6]; print('  ',[(round(p[0],2),round(p[1],2)) for p in L])
print('opening ends: outer', (round(A[0],2),round(A[1],2)), ' root', (round(Bp[0],2),round(Bp[1],2)))
