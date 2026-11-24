from build import *
def dbez(s,t):
    a,b,c,d=s; u=1-t
    return (3*u*u*(b[0]-a[0])+6*u*t*(c[0]-b[0])+3*t*t*(d[0]-c[0]), 3*u*u*(b[1]-a[1])+6*u*t*(c[1]-b[1])+3*t*t*(d[1]-c[1]))
def nrm(v):
    L=math.hypot(*v); return (v[0]/L,v[1]/L) if L else (0,0)
def closest(p, segsO):
    # coarse then refine
    best=(1e18,None,None)
    for j,s in enumerate(segsO):
        for k in range(41):
            q=bez(s,k/40); d=(p[0]-q[0])**2+(p[1]-q[1])**2
            if d<best[0]: best=(d,j,k/40)
    d,j,t=best; s=segsO[j]; h=1/40
    for _ in range(30):
        h/=2
        for tt in (t-h,t+h):
            if 0<=tt<=1:
                q=bez(s,tt); dd=(p[0]-q[0])**2+(p[1]-q[1])**2
                if dd<d: d,t=dd,tt
    return bez(s,t), dbez(s,t)
def mid_pt(p,segsO):
    q,_=closest(p,segsO); return ((p[0]+q[0])/2,(p[1]+q[1])/2)
def mid_tan(p,tp,segsO):
    q,tq=closest(p,segsO); a=nrm(tp); b=nrm(tq)
    if a[0]*b[0]+a[1]*b[1]<0: b=(-b[0],-b[1])
    return ((p[0]+q[0])/2,(p[1]+q[1])/2), nrm((a[0]+b[0],a[1]+b[1]))
def fit_seg(P0,P3,u,v,ts,pts):
    # P(t)=B0 P0 + B1(P0+al*u) + B2(P3-be*v) + B3 P3 ; LS for al,be
    C=[[0,0],[0,0]]; X=[0,0]
    for t,p in zip(ts,pts):
        w=1-t; B0=w**3;B1=3*w*w*t;B2=3*w*t*t;B3=t**3
        A1=(u[0]*B1,u[1]*B1); A2=(-v[0]*B2,-v[1]*B2)
        base=((B0+B1)*P0[0]+(B2+B3)*P3[0],(B0+B1)*P0[1]+(B2+B3)*P3[1])
        r=(p[0]-base[0],p[1]-base[1])
        C[0][0]+=A1[0]**2+A1[1]**2; C[0][1]+=A1[0]*A2[0]+A1[1]*A2[1]; C[1][1]+=A2[0]**2+A2[1]**2
        X[0]+=A1[0]*r[0]+A1[1]*r[1]; X[1]+=A2[0]*r[0]+A2[1]*r[1]
    C[1][0]=C[0][1]; det=C[0][0]*C[1][1]-C[0][1]*C[1][0]
    al=(X[0]*C[1][1]-X[1]*C[0][1])/det; be=(C[0][0]*X[1]-C[1][0]*X[0])/det
    return (P0,(P0[0]+al*u[0],P0[1]+al*u[1]),(P3[0]-be*v[0],P3[1]-be*v[1]),P3)
def average(T, O):
    """T: template segments; O: other contour segments (same side, same direction). Returns averaged segs on T's topology."""
    # anchors + tangents
    anc=[]
    for s in T:
        p=s[0]; tp=dbez(s,0)
        if tp==(0.0,0.0): tp=(s[2][0]-s[0][0],s[2][1]-s[0][1])
        anc.append(mid_tan(p,tp,O))
    last=T[-1]; tp=dbez(last,1)
    anc.append(mid_tan(last[3],tp,O))
    out=[]
    for i,s in enumerate(T):
        ts=[k/16 for k in range(1,16)]
        pts=[mid_pt(bez(s,t),O) for t in ts]
        P0,u=anc[i]; P3,v=anc[i+1]
        out.append(fit_seg(P0,P3,u,v,ts,pts))
    return out
def pieces(sub):
    segs=[]
    for s in sub['segs']:
        ts=cross_t(s)
        if ts: a,b=split(s,ts[0]); segs+=[a,b]
        else: segs.append(s)
    idx=[i for i,s in enumerate(segs) if abs(s[0][0]-AX)<1e-6]
    segs=segs[idx[0]:]+segs[:idx[0]]
    k=[i for i,s in enumerate(segs) if abs(s[0][0]-AX)<1e-6][1]
    return segs[:k],segs[k:]
def sym_avg(sub, side):
    h1,h2=pieces(sub)
    mid=lambda h: bez(h[len(h)//2],0.5)[0]
    T,Oth=(h1,h2) if ((mid(h1)<AX)==(side=='L')) else (h2,h1)
    Om=rev([mir_seg(s) for s in Oth])  # mirrored to T's side, same direction as T
    half=average(T,Om)
    # seam: exact axis + horizontal handles
    def fix(p): return (AX,p[1])
    def horiz(p,h): L=math.hypot(h[0]-p[0],h[1]-p[1]); return (p[0]+math.copysign(L,h[0]-p[0]),p[1])
    s0=half[0]; a=fix(s0[0]); half[0]=(a,horiz(a,s0[1]),s0[2],s0[3])
    s1=half[-1]; d=fix(s1[3]); half[-1]=(s1[0],s1[1],horiz(d,s1[2]),d)
    return {'segs':half+rev([mir_seg(s) for s in half])}
def pair_avg(TL, OR):
    Om=rev([mir_seg(s) for s in OR['segs']])
    L=average(TL['segs'],Om)
    return {'segs':L}, {'segs':rev([mir_seg(s) for s in L])}
if __name__=='__main__':
    c=dict(zip(['outer','leaf','petal','body','central'],sys.argv[1].split(','))); out=sys.argv[2]
    S=parse(D)
    outer=sym_avg(S[0],c['outer']); outer=flat_bottom(outer,180.0); outer=snap_y(outer,lambda y:y<40,30.0)
    if c['leaf']=='L': lL,lR=pair_avg(S[1],S[2])
    else: r,l=pair_avg(mirror_sub(S[2]),mirror_sub(S[1])); lL,lR=r,l  # template = right, expressed on left
    if c['petal']=='L': pL,pR=pair_avg(S[4],S[5])
    else: pL,pR=pair_avg(mirror_sub(S[5]),mirror_sub(S[4]))
    body=sym_avg(S[3],c['body']); central=sym_avg(S[6],c['central'])
    head=circle(105,72,11.125)
    new=[outer,lL,lR,body,pL,pR,central,head]
    d=to_d(new)
    open(out,'w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 210"><path fill="#DAA236" d="%s"/></svg>\n'%d)
    print('anchors',sum(len(s['segs']) for s in new),'bytes',len(d))
