from geom import *
import sys
def getd(f): 
    t=open(f).read(); return t.split(' d="')[1].split('"')[0]
O=parse(D); 
def seglist(subs,n=8):
    out=[]
    for s in subs:
        P=flatten(s,n); out.append(P)
    return out
def dpp(p,Q):
    best=1e9
    for k in range(len(Q)):
        a=Q[k]; b=Q[(k+1)%len(Q)]
        dx=b[0]-a[0]; dy=b[1]-a[1]; L=dx*dx+dy*dy
        t=0 if L==0 else max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L))
        d=(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2
        if d<best: best=d
    return math.sqrt(best)
for f in sys.argv[1:]:
    N=parse(getd(f))
    gO=raster([flatten(s) for s in O]); gN=raster([flatten(s) for s in N])
    PO=seglist(O,30); PN=seglist(N,30)
    # contour-wise hausdorff (same order of subpaths)
    mx=0; where=(0,0); tot=[]
    for a,b in zip(PO,PN):
        for p in b[::3]:
            d=dpp(p,a); tot.append(d)
            if d>mx: mx,where=d,p
        for p in a[::3]:
            d=dpp(p,b); tot.append(d)
            if d>mx: mx,where=d,p
    tot.sort()
    print(f,'area %.1f (orig %.1f) mirrorXOR %.2f | xor vs orig %.1f | dev max %.2f at (%.1f,%.1f) p95 %.2f median %.2f'%(area(gN),area(gO),2*mirror_mismatch(gN),xor(gO,gN),mx,where[0],where[1],tot[int(.95*len(tot))],tot[len(tot)//2]))
