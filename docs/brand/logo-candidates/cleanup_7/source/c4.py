"""cleanup_4: pointed lower leaves with an even stroke all round.
- Leaf opening: cleanup_1's floor curve, trimmed at the root where it still runs flat (seg4 t=TB) and extended at the
  outer end along its own 63.5-degree direction up to y=YA; top = that chain turned 180 degrees -> two sharp points.
- Ring: every edge around the leaf is the opening's edge offset by RING (outer bowl, outer flat top, band under the
  side petal). Outer tip = where the two offsets meet (pointed). Notch = where the top offset meets the petal's edge.
- Side opening: petal edge lifted to meet the band (c3u method), bottom edge = the band's offset up to x=XQ, then a
  smooth blend into cleanup_1's tip, slid along the stem edge.
usage: c4.py LIBDIR cleanup_1.svg cleanup_3.svg out.svg [RING YA TB XQ]"""
import sys, math, re
sys.path.insert(0, sys.argv[1]); from c2lib import *
def load(f): return parse(re.findall(r'\bd="([^"]+)"',open(f).read())[0])
C1=load(sys.argv[2]); C3=load(sys.argv[3]); out_f=sys.argv[4]
RING=float(sys.argv[5]) if len(sys.argv)>5 else 7.8
YA=float(sys.argv[6]) if len(sys.argv)>6 else 136.1
TB=float(sys.argv[7]) if len(sys.argv)>7 else 0.8
XQ=float(sys.argv[8]) if len(sys.argv)>8 else 80.0
def unit(a,b): x,y=b[0]-a[0],b[1]-a[1]; n=math.hypot(x,y); return (x/n,y/n)
def ss(t): t=min(1,max(0,t)); return t*t*(3-2*t)
def line_seg(a,b): return (a,(a[0]+(b[0]-a[0])/3,a[1]+(b[1]-a[1])/3),(a[0]+2*(b[0]-a[0])/3,a[1]+2*(b[1]-a[1])/3),b)
def herm(a,ua,b,ub,k=1/3):
    L=math.dist(a,b)*k; return (a,(a[0]+ua[0]*L,a[1]+ua[1]*L),(b[0]-ub[0]*L,b[1]-ub[1]*L),b)
def tan_at(seg,t):
    e=1e-5; p=bez(seg,max(0,t-e)); q=bez(seg,min(1,t+e)); return unit(p,q)
# ---------- 1. leaf opening
L=C1[1]; seg3,seg4=L[3],L[4]
u3=unit(seg3[0],seg3[1]); s=(seg3[0][1]-YA)/u3[1]; A=(seg3[0][0]-u3[0]*s, YA)
ext=line_seg(A,seg3[0])
s4,_=split(seg4,TB); Bp=s4[3]
bottom=[ext,seg3,s4]                                   # A -> B'
M=((A[0]+Bp[0])/2,(A[1]+Bp[1])/2)
top=rot180(bottom,M)                                   # B' -> A
leaf=bottom+top
angA=math.degrees(math.acos(sum(a*b for a,b in zip(u3,tan_at(top[-1],1.0)[::1] and (-tan_at(top[-1],1.0)[0],-tan_at(top[-1],1.0)[1])))))
print('opening: outer point (%.2f,%.2f)  root point (%.2f,%.2f)  point angle %.1f deg  top slope at outer point %.2f deg'%(
      A[0],A[1],Bp[0],Bp[1],angA, math.degrees(math.atan2(-(tan_at(top[-1],1.0)[1]),-(tan_at(top[-1],1.0)[0])))))
# ---------- 2. offsets of the opening's edges (RING away from the opening)
def offset_poly(chain, side, n=120):
    pts=[]
    for sg in chain:
        for k in range(n):
            t=k/n; p=bez(sg,t); u=tan_at(sg,t); nx,ny=(u[1],-u[0]) if side>0 else (-u[1],u[0])
            pts.append((p[0]+nx*RING,p[1]+ny*RING))
    p=bez(chain[-1],1.0); u=tan_at(chain[-1],1.0); nx,ny=(u[1],-u[0]) if side>0 else (-u[1],u[0]); pts.append((p[0]+nx*RING,p[1]+ny*RING))
    return pts
# which side is "away" for the bottom (travelling A->B', the opening is above = to the left in screen coords)
botoff=offset_poly(bottom,-1); topoff=offset_poly(top,-1)
# sanity: bottom offset should be below the floor (y bigger), top offset above the top
assert botoff[len(botoff)//2][1]>bez(bottom[1],0.5)[1], 'bottom offset on wrong side'
# ---------- 3. outer tip = miter of the two offset lines at A
uB=unit(A,seg3[0]); uT=(-tan_at(top[-1],1.0)[0],-tan_at(top[-1],1.0)[1])         # leaving A along bottom / along top
nB=(-uB[1],uB[0]); nT=(uT[1],-uT[0])                                                # outward normals (away from opening)
def side_ok(n,u):  # make normal point away from the opening interior (interior lies between the two edges)
    mid=(uB[0]+uT[0],uB[1]+uT[1]); return n if n[0]*mid[0]+n[1]*mid[1]<0 else (-n[0],-n[1])
nB=side_ok(nB,uB); nT=side_ok(nT,uT)
P1=(A[0]+nB[0]*RING,A[1]+nB[1]*RING); P2=(A[0]+nT[0]*RING,A[1]+nT[1]*RING)
den=uB[0]*uT[1]-uB[1]*uT[0]; tt=((P2[0]-P1[0])*uT[1]-(P2[1]-P1[1])*uT[0])/den
T=(P1[0]+uB[0]*tt,P1[1]+uB[1]*tt)
print('outer tip (%.2f,%.2f)'%T)
def fit(P0,P3,u,v,pts):
    d=[0]
    for a,b in zip(pts,pts[1:]): d.append(d[-1]+math.dist(a,b))
    tt=[x/d[-1] for x in d]
    for _ in range(8):
        A11=A12=A22=R1=R2=0
        for t,p in zip(tt,pts):
            b0,b1,b2,b3=(1-t)**3,3*t*(1-t)**2,3*t*t*(1-t),t**3
            base=(P0[0]*(b0+b1)+P3[0]*(b2+b3), P0[1]*(b0+b1)+P3[1]*(b2+b3))
            c1=(b1*u[0],b1*u[1]); c2=(-b2*v[0],-b2*v[1]); r=(p[0]-base[0],p[1]-base[1])
            A11+=c1[0]**2+c1[1]**2; A12+=c1[0]*c2[0]+c1[1]*c2[1]; A22+=c2[0]**2+c2[1]**2
            R1+=c1[0]*r[0]+c1[1]*r[1]; R2+=c2[0]*r[0]+c2[1]*r[1]
        det=A11*A22-A12*A12; a=(R1*A22-R2*A12)/det; b=(A11*R2-A12*R1)/det
        seg=(P0,(P0[0]+a*u[0],P0[1]+a*u[1]),(P3[0]-b*v[0],P3[1]-b*v[1]),P3)
        tt=[min((math.dist(bez(seg,k/500),p),k/500) for k in range(501))[1] for p in pts]; tt[0]=0.0; tt[-1]=1.0
    err=max(min(math.dist(bez(seg,k/500),p) for k in range(501)) for p in pts)
    return seg,err
# ---------- 4. outer silhouette, left half (from the base on the axis up to the apex), then mirrored
O=C1[0]
k_apex=[i for i,s_ in enumerate(O) if abs(s_[3][0]-105)<1e-6 and s_[3][1]<40][0]
left=O[:k_apex+1]
i_bowl=[i for i,s_ in enumerate(left) if math.dist(s_[3],(8.39,131.77))<0.05][0]          # bowl ends at the old blunt tip
i_pet=[i for i,s_ in enumerate(left) if math.dist(s_[0],(44.16,127.30))<0.05][0]         # petal's outer edge starts at the notch
bowl=left[i_bowl]; pet=left[i_pet]
# bowl': from its start (where it leaves the flat base) to T, following the bottom offset
b0=bowl[0]; ub0=unit(bowl[0],bowl[1])
tgt=[p for p in botoff if p[0]<=b0[0]+1e-9]; tgt=sorted(tgt,key=lambda p:-p[0])
# trim target to the part beyond the start, ending at T
tgt=[b0]+[p for p in tgt if p[0]<b0[0]-0.5 and math.dist(p,T)>0.3]+[T]
XB=float(sys.argv[9]) if len(sys.argv)>9 else 30.0   # extra anchor on the bowl
im=min(range(len(tgt)),key=lambda i:abs(tgt[i][0]-XB)); Pm=tgt[im]; uPm=unit(tgt[im-2],tgt[im+2])
bA,ebA=fit(b0,Pm,ub0,uPm,tgt[:im+1]); bB,ebB=fit(Pm,T,uPm,(-uB[0],-uB[1]),tgt[im:]); eb=max(ebA,ebB)
# notch: where the top offset meets the petal's outer edge
def poly_seg_x(poly, seg):
    best=None
    for i in range(len(poly)-1):
        for k in range(400):
            t0,t1=k/400,(k+1)/400; q0,q1=bez(seg,t0),bez(seg,t1); p0,p1=poly[i],poly[i+1]
            d1=(p1[0]-p0[0],p1[1]-p0[1]); d2=(q1[0]-q0[0],q1[1]-q0[1]); den=d1[0]*d2[1]-d1[1]*d2[0]
            if abs(den)<1e-12: continue
            a=((q0[0]-p0[0])*d2[1]-(q0[1]-p0[1])*d2[0])/den; b=((q0[0]-p0[0])*d1[1]-(q0[1]-p0[1])*d1[0])/den
            if 0<=a<=1 and 0<=b<=1: return i,a,t0+b*(t1-t0),(p0[0]+a*d1[0],p0[1]+a*d1[1])
    return None
topoff_lr=list(reversed(topoff))                     # from the outer tip side (A) to the root side
r=poly_seg_x(topoff_lr,pet)
if r:
    iN,aN,tN,N=r; _,pet_rest=split(pet,tN)
else:
    # the band edge passes just below the petal edge's end: extend the petal edge along its own direction to meet it
    d=unit(pet[1],pet[0]); ext_end=(pet[0][0]+d[0]*12,pet[0][1]+d[1]*12)
    r=poly_seg_x(topoff_lr,line_seg(pet[0],ext_end)); assert r,'no notch even after extending'
    iN,aN,_,N=r
    pet_rest=(N,(pet[1][0]+(N[0]-pet[0][0]),pet[1][1]+(N[1]-pet[0][1])),pet[2],pet[3])
    print('petal edge extended by %.2f to reach the band'%math.dist(N,pet[0]))
print('notch (%.2f,%.2f)'%N)
flat_tgt=[T]+[p for p in topoff_lr[:iN+1] if math.dist(p,T)>0.3]+[N]
uTN=unit(topoff_lr[max(0,iN-3)],topoff_lr[iN+1])
top_new,et=fit(T,N,uT,uTN,flat_tgt)
new_left=left[:i_bowl]+[bA,bB,top_new,pet_rest]+left[i_pet+1:]
for a,b in zip(new_left,new_left[1:]): assert math.dist(a[3],b[0])<1e-6,(a[3],b[0])
right=[tuple((210-p[0],p[1]) for p in s_[::-1]) for s_ in reversed(new_left)]
outer=new_left+right
print('fit error: bowl %.3f  flat top %.3f'%(eb,et))
# ---------- 5. side opening: petal edge lifted to meet the band, bottom edge = band offset, blend into the slid tip
old=C1[4]; seg7,seg8=old[7],old[8]
def y_on(poly,x): return min(poly,key=lambda p:abs(p[0]-x))[1]
xf=seg8[0][0]; D=seg8[0][1]-y_on(topoff_lr,xf)
W0,W1=105.0,128.0
ts=[k/80 for k in range(81)]
t7=[(lambda p:(p[0],p[1]-D*ss((p[1]-W0)/(W1-W0))))(bez(seg7,t)) for t in ts]
Mf=(xf, y_on(topoff_lr,xf))
band=[p for p in topoff_lr if xf<=p[0]<=XQ]
# tip: cleanup_1's tip slid along the stem edge by TIP (vertical; - = down)
e0,e1=old[2][0],old[2][3]; ux,uy=unit(e0,e1)
TIP=float(sys.argv[10]) if len(sys.argv)>10 else -2.0
sl=-TIP/uy   # vertical change of the tip = -TIP (TIP<0 moves it down)
slide=(ux*sl,uy*sl); sh=lambda p:(p[0]+slide[0],p[1]+slide[1])
tip0=tuple(sh(p) for p in old[0]); tip1=tuple(sh(p) for p in old[1]); seg2=(sh(old[2][0]),sh(old[2][1]),old[2][2],old[2][3])
# bottom edge: follow the band offset from the foot up to X0, then one smooth curve into the tip (fixed direction).
X0=float(sys.argv[11]) if len(sys.argv)>11 else 62.0
HK=float(sys.argv[12]) if len(sys.argv)>12 else 0.38          # handle length factor of the closing curve
band=[p for p in topoff_lr if xf<=p[0]<=X0] if X0>xf else []
vEnd=unit(old[0][0],old[0][1])
uM=unit(t7[-3],t7[-1])
if band and len(band)>6:
    uMb=unit(band[0],band[3]); uM=unit((0,0),(uM[0]+uMb[0],uM[1]+uMb[1]))
    Qm=band[-1]; i_=topoff_lr.index(Qm); uQ=unit(topoff_lr[i_-2],topoff_lr[i_+2])
    n8a,e8=fit(Mf,Qm,uM,uQ,band); tail=[herm(Qm,uQ,tip0[0],vEnd,HK)]; head=[n8a]
else:
    e8=0.0; head=[]; tail=[herm(Mf,uM,tip0[0],vEnd,HK)]
n7,e7=fit(seg7[0],Mf,unit(seg7[0],seg7[1]),uM,t7[:-1]+[Mf])
print('side opening: lift at foot %.2f, tip moved %.2f along the stem, fit error petal %.3f bottom edge %.3f'%(D,math.hypot(*slide),e7,e8))
L4=[tip0,tip1,seg2]+old[3:7]+[n7]+head+tail
for a,b in zip(L4,L4[1:]+L4[:1]): assert math.dist(a[3],b[0])<1e-6
new=[list(sp) for sp in C3]
new[0]=outer; new[1]=leaf; new[2]=reverse(mirror_x(leaf)); new[4]=L4; new[5]=reverse(mirror_x(L4))
open(out_f,'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 210"><path fill="#DAA236" d="{to_d(new)}"/></svg>\n')
