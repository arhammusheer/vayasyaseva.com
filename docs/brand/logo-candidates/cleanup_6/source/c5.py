"""cleanup_5 variants: the middle leaves (side petals) get the lower leaves' treatment.
- Side opening: sharp top tip (TIP='natural': the top edge and outer edge simply extended to meet;
  TIP='right': top edge refit to arrive level so the tip is an exact right angle) and, if BOTTOM='point',
  a sharp tip at the stem (band edge and stem edge extended to meet) instead of the small round.
- Silhouette: the petal's outer edge and top edge are the opening's edges offset by RING; the outer corner is
  where those offsets meet; the outer edge meets the leaf's flat top, and the top edge meets the centre petal, crisply.
usage: c5.py LIBDIR cleanup_4.svg out.svg TIP BOTTOM [RING [KNUCKLE]]
  TIP: natural | right | <degrees> (tip angle with a curved top edge); KNUCKLE: round | sharp"""
import sys, math, re
sys.path.insert(0, sys.argv[1]); from c2lib import *
def load(f): return parse(re.findall(r'\bd="([^"]+)"',open(f).read())[0])
C4=load(sys.argv[2]); out_f=sys.argv[3]; TIP=sys.argv[4]; BOTTOM=sys.argv[5]
RING=float(sys.argv[6]) if len(sys.argv)>6 else 7.8
def unit(a,b): x,y=b[0]-a[0],b[1]-a[1]; n=math.hypot(x,y); return (x/n,y/n)
def add(p,v,k=1): return (p[0]+v[0]*k,p[1]+v[1]*k)
def lines_x(p,u,q,v):
    den=u[0]*v[1]-u[1]*v[0]; t=((q[0]-p[0])*v[1]-(q[1]-p[1])*v[0])/den; return add(p,u,t)
def tan_at(seg,t):
    e=1e-5; return unit(bez(seg,max(0,t-e)),bez(seg,min(1,t+e)))
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
        seg=(P0,add(P0,u,a),add(P3,v,-b),P3)
        tt=[min((math.dist(bez(seg,k/500),p),k/500) for k in range(501))[1] for p in pts]; tt[0]=0.0; tt[-1]=1.0
    err=max(min(math.dist(bez(seg,k/500),p) for k in range(501)) for p in pts)
    return seg,err
def offset_poly(chain, sign, n=160):
    """offset to the LEFT of travel (sign=+1) or RIGHT (sign=-1), screen coords (y down)"""
    pts=[]
    for sg in chain:
        for k in range(n+1):
            t=k/n; p=bez(sg,t); u=tan_at(sg,t); nl=(u[1],-u[0])   # left of travel in y-down coords
            pts.append(add(p,(nl[0]*sign,nl[1]*sign),RING))
    return pts
def poly_curve_x(poly, seg, N=600):
    Q=[bez(seg,k/N) for k in range(N+1)]
    for i in range(len(poly)-1):
        p0,p1=poly[i],poly[i+1]
        for k in range(N):
            q0,q1=Q[k],Q[k+1]; d1=(p1[0]-p0[0],p1[1]-p0[1]); d2=(q1[0]-q0[0],q1[1]-q0[1]); den=d1[0]*d2[1]-d1[1]*d2[0]
            if abs(den)<1e-12: continue
            a=((q0[0]-p0[0])*d2[1]-(q0[1]-p0[1])*d2[0])/den; b=((q0[0]-p0[0])*d1[1]-(q0[1]-p0[1])*d1[0])/den
            if 0<=a<=1 and 0<=b<=1: return i,(k+b)/N,add(p0,d1,a)
    return None
L=C4[4]; s2,s3,s4,s5,s6,s7,s8=L[2],L[3],L[4],L[5],L[6],L[7],L[8]
KNUCKLE=sys.argv[7] if len(sys.argv)>7 else 'round'
if KNUCKLE=='sharp':
    # the opening's top-right turn (where its top edge turns down into the centre petal) becomes a crisp corner
    K=lines_x(s3[3],unit(s3[2],s3[3]),s5[0],unit(s5[1],s5[0]))
    dk=(K[0]-s3[3][0],K[1]-s3[3][1]); s3=(s3[0],s3[1],add(s3[2],dk),K)
    dk=(K[0]-s5[0][0],K[1]-s5[0][1]); s5=(K,add(s5[1],dk),s5[2],s5[3])
    s4=None
    print('opening top-right corner (%.2f,%.2f), angle %.1f deg'%(K[0],K[1],math.degrees(math.acos(sum(a*b for a,b in zip(unit(K,s3[2]),unit(K,s5[1])))))))
# ---------- side opening: top tip
if TIP=='natural':
    P=lines_x(s5[3],unit(s5[2],s5[3]),s7[0],unit(s7[1],s7[0]))
    d5=(P[0]-s5[3][0],P[1]-s5[3][1]); s5n=(s5[0],s5[1],add(s5[2],d5),P)
else:   # right angle (or a given tip angle): top edge refit to arrive at that angle, outer edge leaves vertical
    phi=90.0 if TIP=='right' else float(TIP); th=math.radians(90.0-phi)
    vin=(-math.cos(th),-math.sin(th))
    best=None
    tg=[bez(s5,k/80) for k in range(81)]
    for k in range(0,81):
        yP=70.0+k*0.1; P=(s7[0][0],yP)
        tgt=tg[:-6]+[P]
        seg,err=fit(s5[0],P,unit(s5[0],s5[1]),vin,tgt)
        if best is None or err<best[0]: best=(err,seg,P)
    err,s5n,P=best; print('right-angle tip at (%.2f,%.2f), top edge refit error %.3f'%(P[0],P[1],err))
d7=(P[0]-s7[0][0],P[1]-s7[0][1]); s7n=(P,add(s7[1],d7),s7[2],s7[3])
# ---------- side opening: bottom tip by the stem
if BOTTOM=='point':
    P2=lines_x(s8[3],unit(s8[2],s8[3]),s2[0],unit(s2[1],s2[0]))
    d8=(P2[0]-s8[3][0],P2[1]-s8[3][1]); s8n=(s8[0],s8[1],add(s8[2],d8),P2)
    d2=(P2[0]-s2[0][0],P2[1]-s2[0][1]); s2n=(P2,add(s2[1],d2),s2[2],s2[3])
    L4=[s2n,s3]+([s4] if s4 else [])+[s5n,s7n,s8n]
    print('stem tip (%.2f,%.2f), angle %.1f deg'%(P2[0],P2[1],math.degrees(math.acos(sum(a*b for a,b in zip(unit(P2,s8n[2]),unit(P2,s2n[1])))))))
else:
    L4=[L[0],L[1],s2,s3]+([s4] if s4 else [])+[s5n,s7n,s8]
for a,b in zip(L4,L4[1:]+L4[:1]): assert math.dist(a[3],b[0])<1e-6,(a[3],b[0])
ang=math.degrees(math.acos(sum(a*b for a,b in zip(unit(P,s7n[1]),unit(P,s5n[2])))))
print('top tip (%.2f,%.2f), angle %.1f deg'%(P[0],P[1],ang))
# ---------- silhouette: offsets of the opening's outer edge (s7n, P->down) and top edge (P->right: reversed s5n, then s4)
outer_edge=[s7n]                                     # travel P -> (65,134): opening interior is to the LEFT (east)? check below
top_edge=[tuple(reversed(s5n))]+([tuple(reversed(s4))] if s4 else [])                  # P -> (61.5,82.3) -> (65.1,87.7)
def interior_side_any(contour,chain):
    p=bez(chain[0],0.5); u=tan_at(chain[0],0.5); q=add(p,(u[1],-u[0]),0.6)
    poly=sample(contour,200); wn=0
    for (x1,y1),(x2,y2) in zip(poly,poly[1:]+poly[:1]):
        if (y1<=q[1]<y2) or (y2<=q[1]<y1):
            xi=x1+(q[1]-y1)*(x2-x1)/(y2-y1)
            if xi>q[0]: wn+=1
    return wn%2==1
def interior_side(chain):
    # sample a point just left of travel and test if it's inside the opening (winding of L4 polygon)
    p=bez(chain[0],0.5); u=tan_at(chain[0],0.5); q=add(p,(u[1],-u[0]),0.6)
    poly=sample(L4,200); wn=0
    for (x1,y1),(x2,y2) in zip(poly,poly[1:]+poly[:1]):
        if (y1<=q[1]<y2) or (y2<=q[1]<y1):
            xi=x1+(q[1]-y1)*(x2-x1)/(y2-y1)
            if xi>q[0]: wn+=1
    return wn%2==1     # True: left of travel is inside
so=offset_poly(outer_edge, -1 if interior_side(outer_edge) else +1)
st=offset_poly(top_edge, -1 if interior_side(top_edge) else +1)
# corner = miter of the two offset lines at P
uo=tan_at(s7n,0.0); ut=tan_at(top_edge[0],0.0)
Tc=lines_x(so[0],uo,st[0],ut)
print('outer corner (%.2f,%.2f)'%Tc)
O=C4[0]
iL=[i for i,s_ in enumerate(O) if abs(s_[3][0]-105)<1e-6 and s_[3][1]<40][0]
left=O[:iL+1]
i3=[i for i,s_ in enumerate(left) if math.dist(s_[3],(45.27,128.75))<0.05][0]   # leaf flat top (tip -> notch)
i9=[i for i,s_ in enumerate(left) if math.dist(s_[0],(66.89,73.69))<0.05][0]    # centre petal outer edge
# leaf's flat top = the leaf opening's top edge offset by RING (as in cleanup_4), run to where the petal's outer-edge offset meets it
L1=C4[1]; topchain=L1[3:]                              # cleanup_4 leaf opening: 3 bottom segments then the 3 turned-around top segments
lt=offset_poly(topchain, -1 if interior_side_any(L1,topchain) else +1)
Tleaf=left[i3][0]
def poly_poly_x(P,Q):
    for i in range(len(P)-1):
        for j in range(len(Q)-1):
            p0,p1,q0,q1=P[i],P[i+1],Q[j],Q[j+1]; d1=(p1[0]-p0[0],p1[1]-p0[1]); d2=(q1[0]-q0[0],q1[1]-q0[1]); den=d1[0]*d2[1]-d1[1]*d2[0]
            if abs(den)<1e-12: continue
            a_=((q0[0]-p0[0])*d2[1]-(q0[1]-p0[1])*d2[0])/den; b_=((q0[0]-p0[0])*d1[1]-(q0[1]-p0[1])*d1[0])/den
            if 0<=a_<=1 and 0<=b_<=1: return i,j,add(p0,d1,a_)
    return None
r=poly_poly_x(so,lt); assert r,'outer-edge offset misses the leaf top offset'
iN,jN,N=r
ltp=sorted([p for p in lt if Tleaf[0]+0.3<p[0]<N[0]-0.3],key=lambda p:p[0])
uTl=unit(left[i3][0],left[i3][1]); uNl=unit(ltp[-3],N)
leaftop,el=fit(Tleaf,N,uTl,uNl,[Tleaf]+ltp+[N])
print('leaf top refit error %.3f'%el)
c9=left[i9]
r=poly_curve_x(st,c9)
if r:
    iV,tV,V=r; _,cen=split(c9,tV)
else:   # meets the centre petal's edge just below where it starts: extend that edge along its own direction
    d=unit(c9[1],c9[0]); ext=(c9[0],add(c9[0],d,4),add(c9[0],d,8),add(c9[0],d,12))
    r=poly_curve_x(st,ext); assert r,'top edge offset misses the centre petal even extended'
    iV,_,V=r; dv=(V[0]-c9[0][0],V[1]-c9[0][1]); cen=(V,add(c9[1],dv),c9[2],c9[3])
    print('centre petal edge extended by %.2f'%math.dist(V,c9[0]))
print('notch (%.2f,%.2f)  junction with centre petal (%.2f,%.2f)'%(N[0],N[1],V[0],V[1]))
# petal outer edge: from the notch up to the corner, following the outer-edge offset (2 cubics)
po=[N]+list(reversed([p for p in so[:iN+1] if math.dist(p,N)>0.3 and math.dist(p,Tc)>0.3]))+[Tc]
uN=unit(so[iN+1],so[max(0,iN-2)]) if iN>=2 else unit(N,po[2])
im=len(po)//2; Pm=po[im]; uPm=unit(po[im-2],po[im+2])
pa,ea=fit(N,Pm,uN,uPm,po[:im+1]); pb,eb=fit(Pm,Tc,uPm,(-uo[0],-uo[1]),po[im:])
# petal top edge: from the corner to the centre petal, following the top-edge offset
pt=[Tc]+[p for p in st[:iV+1] if math.dist(p,Tc)>0.3 and math.dist(p,V)>0.3]+[V]
uV=unit(st[max(0,iV-2)],st[iV+1])
tp,et=fit(Tc,V,ut,uV,pt)
print('fit error: outer edge %.3f / %.3f  top edge %.3f'%(ea,eb,et))
new_left=left[:i3]+[leaftop,pa,pb,tp,cen]+left[i9+1:]
for a,b in zip(new_left,new_left[1:]): assert math.dist(a[3],b[0])<1e-6,(a[3],b[0])
right=[tuple((210-p[0],p[1]) for p in s_[::-1]) for s_ in reversed(new_left)]
new=[list(sp) for sp in C4]
new[0]=new_left+right; new[4]=L4; new[5]=reverse(mirror_x(L4))
open(out_f,'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 210"><path fill="#DAA236" d="{to_d(new)}"/></svg>\n')
