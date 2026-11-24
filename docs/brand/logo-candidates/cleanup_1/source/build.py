from geom import *
import sys
AX=105.0
def split(s,t):
    a,b,c,d=s
    L=lambda p,q,t:(p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t)
    ab=L(a,b,t);bc=L(b,c,t);cd=L(c,d,t);abc=L(ab,bc,t);bcd=L(bc,cd,t);m=L(abc,bcd,t)
    return (a,ab,abc,m),(m,bcd,cd,d)
def cross_t(s):
    # roots of x(t)=AX in (0,1) by sampling+bisection
    ts=[]; N=200
    f=lambda t:bez(s,t)[0]-AX
    prev=f(0)
    for k in range(1,N+1):
        t=k/N; v=f(t)
        if (prev<0)!=(v<0) and prev!=0:
            lo,hi=(k-1)/N,t
            for _ in range(60):
                mid=(lo+hi)/2
                if (f(lo)<0)!=(f(mid)<0): hi=mid
                else: lo=mid
            ts.append((lo+hi)/2)
        prev=v
    return ts
def mir_seg(s): return tuple((2*AX-p[0],p[1]) for p in s)
def rev(segs): return [s[::-1] for s in segs[::-1]]
def halfmirror(sub, side):
    segs=[]
    for s in sub['segs']:
        ts=cross_t(s)
        assert len(ts)<=1, ts
        if ts: a,b=split(s,ts[0]); segs+= [a,b]
        else: segs.append(s)
    # rotate so segs[0] starts at an axis point
    idx=[i for i,s in enumerate(segs) if abs(s[0][0]-AX)<1e-6]
    assert len(idx)==2, idx
    segs=segs[idx[0]:]+segs[:idx[0]]
    k=[i for i,s in enumerate(segs) if abs(s[0][0]-AX)<1e-6][1]
    h1,h2=segs[:k],segs[k:]
    mid=lambda h: bez(h[len(h)//2],0.5)[0]
    half = h1 if ((mid(h1)<AX)==(side=='L')) else h2
    # horizontal handles at the seam points
    def horiz(p,h): L=math.hypot(h[0]-p[0],h[1]-p[1]); return (p[0]+math.copysign(L,h[0]-p[0]),p[1])
    s0=half[0]; half[0]=(s0[0],horiz(s0[0],s0[1]),s0[2],s0[3])
    s1=half[-1]; half[-1]=(s1[0],s1[1],horiz(s1[3],s1[2]),s1[3])
    other=rev([mir_seg(s) for s in half])
    return {'segs':half+other}
def mirror_sub(sub): return {'segs':rev([mir_seg(s) for s in sub['segs']])}
K=0.5522847498
def circle(cx,cy,r):
    k=K*r
    P=[(cx,cy-r),(cx+r,cy),(cx,cy+r),(cx-r,cy)]
    H=[((cx+k,cy-r),(cx+r,cy-k)),((cx+r,cy+k),(cx+k,cy+r)),((cx-k,cy+r),(cx-r,cy+k)),((cx-r,cy-k),(cx-k,cy-r))]
    return {'segs':[(P[i],H[i][0],H[i][1],P[(i+1)%4]) for i in range(4)]}
def snap_y(sub, y_old_pred, y_new):
    """move axis anchor(s) matching predicate plus attached handles to y_new"""
    segs=[list(s) for s in sub['segs']]
    for s in segs:
        for (pi,hi) in ((0,1),(3,2)):
            if abs(s[pi][0]-AX)<1e-6 and y_old_pred(s[pi][1]):
                dy=y_new-s[pi][1]
                s[pi]=(s[pi][0],y_new); s[hi]=(s[hi][0],s[hi][1]+dy)
    return {'segs':[tuple(s) for s in segs]}
def flat_bottom(sub, y):
    # segments whose both ends lie near the baseline and span the axis region: make straight at y
    segs=[list(s) for s in sub['segs']]
    for s in segs:
        if s[0][1]>178 and s[3][1]>178:
            a=(s[0][0],y); d=(s[3][0],y)
            s[:]=[a,(a[0]+(d[0]-a[0])/3,y),(a[0]+2*(d[0]-a[0])/3,y),d]
    # neighbours: snap endpoints that touch baseline anchors and make their handle horizontal
    for i,s in enumerate(segs):
        for (pi,hi) in ((0,1),(3,2)):
            if s[pi][1]>178 and not (s[0][1]>178 and s[3][1]>178):
                s[pi]=(s[pi][0],y); s[hi]=(s[hi][0],y)
    return {'segs':[tuple(s) for s in segs]}
if __name__=='__main__':
    choice=sys.argv[1]  # e.g. "L,L,R,L,R,L" for contours 0,1/2,4/5,3,6
    out=sys.argv[2]
    c=dict(zip(['outer','leaf','petal','body','central'],choice.split(',')))
    S=parse(D)
    outer=halfmirror(S[0],c['outer'])
    outer=flat_bottom(outer,180.0)
    outer=snap_y(outer,lambda y:y<40,30.0)
    if c['leaf']=='L': lL,lR=S[1],mirror_sub(S[1])
    else: lL,lR=mirror_sub(S[2]),S[2]
    if c['petal']=='L': pL,pR=S[4],mirror_sub(S[4])
    else: pL,pR=mirror_sub(S[5]),S[5]
    body=halfmirror(S[3],c['body']); central=halfmirror(S[6],c['central'])
    head=circle(105,72,11.125)
    new=[outer,lL,lR,body,pL,pR,central,head]
    d=to_d(new)
    open(out,'w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 210"><path fill="#DAA236" d="%s"/></svg>\n'%d)
    print('anchors',sum(len(s['segs']) for s in new), 'bytes',len(d))
