"""Small-size cut: thicken every stroke of the mark by moving each edge R units away from the ink.
Corners stay crisp (offsets meet by intersection), smooth joins stay smooth, and any rounded corner tighter than R
that would fold over is dropped so its neighbours meet in a point. The head keeps its size (+HEAD).
usage: c9.py LIBDIR in.svg out.svg R [HEAD]"""
import sys, math, re
sys.path.insert(0, sys.argv[1]); from c2lib import *
def load(f): return parse(re.findall(r'\bd="([^"]+)"',open(f).read())[0])
M=load(sys.argv[2]); out_f=sys.argv[3]; R=float(sys.argv[4]); HEAD=float(sys.argv[5]) if len(sys.argv)>5 else 0.0
def unit(a,b): x,y=b[0]-a[0],b[1]-a[1]; n=math.hypot(x,y); return (x/n,y/n) if n>1e-12 else (1.0,0.0)
def add(p,v,k=1): return (p[0]+v[0]*k,p[1]+v[1]*k)
def tan_at(seg,t):
    e=1e-5; return unit(bez(seg,max(0,t-e)),bez(seg,min(1,t+e)))
def pip(q,poly):
    c=False
    for (x1,y1),(x2,y2) in zip(poly,poly[1:]+poly[:1]):
        if (y1>q[1])!=(y2>q[1]) and q[0]<x1+(q[1]-y1)*(x2-x1)/(y2-y1): c=not c
    return c
def seg_x(p0,p1,q0,q1):
    d1=(p1[0]-p0[0],p1[1]-p0[1]); d2=(q1[0]-q0[0],q1[1]-q0[1]); den=d1[0]*d2[1]-d1[1]*d2[0]
    if abs(den)<1e-12: return None
    a=((q0[0]-p0[0])*d2[1]-(q0[1]-p0[1])*d2[0])/den; b=((q0[0]-p0[0])*d1[1]-(q0[1]-p0[1])*d1[0])/den
    return (a,b) if 0<=a<=1 and 0<=b<=1 else None
def fit(P0,P3,u,v,pts):
    d=[0]
    for a,b in zip(pts,pts[1:]): d.append(d[-1]+math.dist(a,b))
    if d[-1]<1e-9: return (P0,P0,P3,P3),0.0
    tt=[x/d[-1] for x in d]
    for _ in range(8):
        A11=A12=A22=R1=R2=0
        for t,p in zip(tt,pts):
            b0,b1,b2,b3=(1-t)**3,3*t*(1-t)**2,3*t*t*(1-t),t**3
            base=(P0[0]*(b0+b1)+P3[0]*(b2+b3), P0[1]*(b0+b1)+P3[1]*(b2+b3))
            c1=(b1*u[0],b1*u[1]); c2=(-b2*v[0],-b2*v[1]); r=(p[0]-base[0],p[1]-base[1])
            A11+=c1[0]**2+c1[1]**2; A12+=c1[0]*c2[0]+c1[1]*c2[1]; A22+=c2[0]**2+c2[1]**2
            R1+=c1[0]*r[0]+c1[1]*r[1]; R2+=c2[0]*r[0]+c2[1]*r[1]
        det=A11*A22-A12*A12
        if abs(det)<1e-12: L=d[-1]/3; return (P0,add(P0,u,L),add(P3,v,-L),P3),0.0
        a=(R1*A22-R2*A12)/det; b=(A11*R2-A12*R1)/det
        if a<=0 or b<=0: L=d[-1]/3; a=b=L
        seg=(P0,add(P0,u,a),add(P3,v,-b),P3)
        tt=[min((math.dist(bez(seg,k/300),p),k/300) for k in range(301))[1] for p in pts]; tt[0]=0.0; tt[-1]=1.0
    err=max(min(math.dist(bez(seg,k/300),p) for k in range(301)) for p in pts)
    return seg,err
def fit_poly(pts, depth=0):
    if len(pts)<4: return [ (pts[0],add(pts[0],unit(pts[0],pts[-1]),math.dist(pts[0],pts[-1])/3),add(pts[-1],unit(pts[0],pts[-1]),-math.dist(pts[0],pts[-1])/3),pts[-1]) ]
    u=unit(pts[0],pts[min(3,len(pts)-1)]); v=unit(pts[max(0,len(pts)-4)],pts[-1])
    seg,err=fit(pts[0],pts[-1],u,v,pts)
    if err<=0.12 or depth>=3 or len(pts)<12: return [seg]
    m=len(pts)//2
    a=fit_poly(pts[:m+1],depth+1); b=fit_poly(pts[m:],depth+1)
    # make the split point smooth: share the tangent
    t=unit(pts[m-2],pts[m+2]); la=math.dist(a[-1][2],a[-1][3]); lb=math.dist(b[0][0],b[0][1])
    a[-1]=(a[-1][0],a[-1][1],add(pts[m],t,-la),pts[m]); b[0]=(pts[m],add(pts[m],t,lb),b[0][2],b[0][3])
    return a+b
def decross(pts, marks):
    """remove self-intersection loops from a closed polyline; returns [(point, is_piece_boundary)]"""
    P=[(q, i in marks) for i,q in enumerate(pts)]
    def bbox(a,b): return (min(a[0],b[0]),min(a[1],b[1]),max(a[0],b[0]),max(a[1],b[1]))
    changed=True; guard=0
    while changed and guard<200:
        changed=False; guard+=1; n=len(P)
        boxes=[bbox(P[i][0],P[(i+1)%n][0]) for i in range(n)]
        for i in range(n):
            bi=boxes[i]
            for j in range(i+2,n):
                if i==0 and j==n-1: continue
                bj=boxes[j]
                if bi[2]<bj[0] or bj[2]<bi[0] or bi[3]<bj[1] or bj[3]<bi[1]: continue
                h=seg_x(P[i][0],P[(i+1)%n][0],P[j][0],P[(j+1)%n][0])
                if not h: continue
                X=add(P[i][0],(P[(i+1)%n][0][0]-P[i][0][0],P[(i+1)%n][0][1]-P[i][0][1]),h[0])
                inner=P[i+1:j+1]; outer=P[j+1:]+P[:i+1]
                Li=sum(math.dist(inner[k][0],inner[k+1][0]) for k in range(len(inner)-1)) if len(inner)>1 else 0
                Lo=sum(math.dist(outer[k][0],outer[k+1][0]) for k in range(len(outer)-1)) if len(outer)>1 else 0
                if Li<=Lo: P=P[:i+1]+[(X,True)]+P[j+1:]          # drop the loop between i and j; the crossing becomes a corner
                else:     P=[(X,True)]+P[i+1:j+1]
                changed=True; break
            if changed: break
    return P
def offset_contour(segs, r, away_from_interior):
    poly=[bez(s_,k/40) for s_ in segs for k in range(40)]
    # which side of travel is the contour's interior?
    s0=segs[0]; p=bez(s0,0.5); u=tan_at(s0,0.5); nl=(u[1],-u[0])
    left_inside=pip(add(p,nl,0.3),poly)
    sign=(-1 if left_inside else 1) if away_from_interior else (1 if left_inside else -1)
    N=60; offs=[]
    for s_ in segs:
        pts=[]
        for k in range(N+1):
            t=k/N; p=bez(s_,t); u=tan_at(s_,t); nl=(u[1],-u[0]); pts.append(add(p,nl,sign*r))
        ch=unit(s_[0],s_[3]) if math.dist(s_[0],s_[3])>1e-6 else tan_at(s_,0.5)
        co=(pts[-1][0]-pts[0][0],pts[-1][1]-pts[0][1])
        collapsed = (co[0]*ch[0]+co[1]*ch[1])<=0.0 and math.dist(s_[0],s_[3])<6*r
        offs.append(None if collapsed else pts)
    keep=[o for o in offs if o is not None]
    n=len(keep); res=[list(o) for o in keep]
    # join consecutive offset pieces: smooth joins meet already; corners meet where the extended pieces cross
    for i in range(n):
        A=res[i]; Bp=res[(i+1)%n]
        if math.dist(A[-1],Bp[0])<1e-3: continue
        ua=unit(A[-2],A[-1]); ub=unit(Bp[0],Bp[1]); L=6*r+20
        Ae=A+[add(A[-1],ua,L)]; Be=[add(Bp[0],ub,-L)]+Bp
        best=None
        for ia in range(len(Ae)-1,max(-1,len(Ae)-40),-1):
            for ib in range(0,min(len(Be)-1,40)):
                h=seg_x(Ae[ia-1] if ia>0 else Ae[0],Ae[ia],Be[ib],Be[ib+1])
                if h and ia>0:
                    X=add(Ae[ia-1],(Ae[ia][0]-Ae[ia-1][0],Ae[ia][1]-Ae[ia-1][1]),h[0])
                    best=(ia,ib,X); break
            if best: break
        if best:
            ia,ib,X=best; res[i]=Ae[:ia]+[X]; res[(i+1)%n]=[X]+Be[ib+1:]
        else:
            mid=((A[-1][0]+Bp[0][0])/2,(A[-1][1]+Bp[0][1])/2); res[i]=A[:-1]+[mid]; res[(i+1)%n]=[mid]+Bp[1:]
    # one closed polyline with piece boundaries marked, then cut out any loops where the offset crosses itself
    flat=[]; marks=set()
    for pts in res:
        marks.add(len(flat)); flat+=pts[:-1]
    flat=decross(flat,marks)
    res=[]; cur=[]
    for q,mk in flat:
        if mk and cur: cur.append(q); res.append(cur); cur=[q]
        else: cur.append(q)
    if cur:
        if res: res[0]=cur+res[0][1:]
        else: res=[cur+[cur[0]]]
    out=[]
    for pts in res:
        clean=[pts[0]]
        for q in pts[1:]:
            if math.dist(q,clean[-1])>0.05: clean.append(q)
        if len(clean)<2: continue
        out+=fit_poly(clean)
    # close exactly
    for i in range(len(out)):
        a=out[i]; b=out[(i+1)%len(out)]
        if math.dist(a[3],b[0])>1e-9: out[(i+1)%len(out)]=(a[3],add(b[1],(a[3][0]-b[0][0],a[3][1]-b[0][1])),b[2],b[3])
    return out
def symmetrize(segs, ax=105.0):
    """rebuild a self-symmetric contour from its left half (x <= ax), split exactly at the axis crossings"""
    cuts=[]
    for i,sg in enumerate(segs):
        f=lambda t: bez(sg,t)[0]-ax
        prev=f(0.0)
        for k in range(1,401):
            t=k/400; v=f(t)
            if (prev<0)!=(v<0) or (abs(v)<1e-9 and k<400):
                lo,hi=(k-1)/400,t
                for _ in range(60):
                    m=(lo+hi)/2
                    if (f(lo)<0)!=(f(m)<0): hi=m
                    else: lo=m
                cuts.append((i,(lo+hi)/2)); break
            prev=v
    # also accept segments that start exactly on the axis
    for i,sg in enumerate(segs):
        if abs(sg[0][0]-ax)<1e-6 and not any(c[0]==i and c[1]<1e-6 for c in cuts): cuts.append((i,0.0))
    cuts=sorted(set(cuts))
    if len(cuts)<2: return segs
    # walk the contour from each cut to the next; keep the stretch that lies left of the axis
    n=len(segs)
    def piece(c0,c1):
        (i0,t0),(i1,t1)=c0,c1; out=[]; i=i0; t=t0
        while True:
            sg=segs[i]
            if i==i1 and (t<=t1 or (i==i0 and t0<t1)) and not (i==i0 and t0>=t1 and len(out)==0 and c0!=c1 and False):
                a=split(sg,t)[1] if t>0 else sg
                tt=(t1-t)/(1-t) if t<1 else 0
                if tt>1e-9: out.append(split(a,tt)[0])
                return out
            out.append(split(sg,t)[1] if t>0 else sg); i=(i+1)%n; t=0.0
            if len(out)>n+1: return out
    best=None
    for a in range(len(cuts)):
        pc=piece(cuts[a],cuts[(a+1)%len(cuts)])
        xs=[bez(sg,k/10)[0] for sg in pc for k in range(11)]
        if xs and max(xs)<=ax+1e-6:
            if best is None or len(pc)>len(best): best=pc
    if not best: return segs
    for sg in best:
        pass
    a0=best[0][0]; a1=best[-1][3]
    best[0]=((ax,a0[1]),)+best[0][1:]; best[-1]=best[-1][:3]+((ax,a1[1]),)
    mirrored=[tuple((2*ax-q[0],q[1]) for q in sg[::-1]) for sg in reversed(best)]
    return best+mirrored
names=['outer','leafL','leafR','body','sideL','sideR','centre','head']
new=[]
for k,c in enumerate(M):
    if k==7:
        if HEAD==0: new.append(c); continue
        new.append(offset_contour(c,HEAD,True)); continue
    new.append(offset_contour(c,R,k==0))     # outer grows outward; every opening shrinks
# exact symmetry: the right-hand openings are mirrors of the left-hand ones
new[2]=reverse(mirror_x(new[1])); new[5]=reverse(mirror_x(new[4]))
for k in (0,3,6): new[k]=symmetrize(new[k])
open(out_f,'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 210"><path fill="#DAA236" d="{to_d(new)}"/></svg>\n')
print('segments per contour', [len(c) for c in new])
