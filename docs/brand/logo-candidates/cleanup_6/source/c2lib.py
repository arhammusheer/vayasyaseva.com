import re, math, json
def parse(d):
    tok=re.findall(r'[MmCcLlZz]|-?\d*\.?\d+(?:e[-+]?\d+)?',d); subs=[];cur=None;x=y=0;sx=sy=0;i=0;cmd=None
    def num():
        nonlocal i; v=float(tok[i]); i+=1; return v
    while i<len(tok):
        t=tok[i]
        if re.match(r'[A-Za-z]',t): cmd=t;i+=1
        if cmd in 'Zz': subs.append(cur);cur=None;x,y=sx,sy;continue
        if cmd in 'Mm':
            a,b=num(),num()
            if cmd=='m': a+=x;b+=y
            x,y=sx,sy=a,b;cur=[];cmd='L' if cmd=='M' else 'l';continue
        if cmd in 'Cc':
            p=[num() for _ in range(6)]
            if cmd=='c': p=[p[0]+x,p[1]+y,p[2]+x,p[3]+y,p[4]+x,p[5]+y]
            cur.append(((x,y),(p[0],p[1]),(p[2],p[3]),(p[4],p[5])));x,y=p[4],p[5];continue
        if cmd in 'Ll':
            a,b=num(),num()
            if cmd=='l': a+=x;b+=y
            cur.append(((x,y),(x+(a-x)/3,y+(b-y)/3),(x+2*(a-x)/3,y+2*(b-y)/3),(a,b)));x,y=a,b;continue
    return subs
def bez(s,t):
    a,b,c,e=s;u=1-t
    return (u**3*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t**3*e[0],u**3*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t**3*e[1])
def split(s,t):
    a,b,c,d=s; L=lambda p,q:(p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t)
    ab,bc,cd=L(a,b),L(b,c),L(c,d); abc,bcd=L(ab,bc),L(bc,cd); m=L(abc,bcd)
    return (a,ab,abc,m),(m,bcd,cd,d)
def extreme(sp,key):
    best=None
    for i,s in enumerate(sp):
        for k in range(2001):
            t=k/2000; v=key(bez(s,t))
            if best is None or v<best[0]: best=(v,i,t)
    # refine
    v,i,t=best; lo,hi=max(0,t-1/2000),min(1,t+1/2000)
    for _ in range(80):
        m1,m2=lo+(hi-lo)/3,hi-(hi-lo)/3
        if key(bez(sp[i],m1))<key(bez(sp[i],m2)): hi=m2
        else: lo=m1
    return i,(lo+hi)/2
def cut_chain(sp,iA,tA,iB,tB):
    """segments of closed contour sp going forward from (iA,tA) to (iB,tB)"""
    n=len(sp); out=[]
    i=iA; s=sp[i]
    if iA==iB and tB>tA:
        a=split(s,tA)[1]; return [split(a,(tB-tA)/(1-tA))[0]]
    out.append(split(s,tA)[1]); i=(i+1)%n
    while i!=iB: out.append(sp[i]); i=(i+1)%n
    out.append(split(sp[iB],tB)[0]); return [x for x in out if abs(x[0][0]-x[3][0])+abs(x[0][1]-x[3][1])>1e-9 or True]
def rot180(segs,M): 
    R=lambda p:(2*M[0]-p[0],2*M[1]-p[1]); return [tuple(R(p) for p in s) for s in segs]
def mirror_x(segs,ax=105.0): return [tuple((2*ax-p[0],p[1]) for p in s) for s in segs]
def reverse(segs): return [s[::-1] for s in segs[::-1]]
def fmt(v): s=f'{v:.3f}'.rstrip('0').rstrip('.'); return '0' if s in ('-0','') else s
def to_d(subs):
    out=[]
    for sp in subs:
        out.append(f'M{fmt(sp[0][0][0])} {fmt(sp[0][0][1])}')
        for s in sp: out.append('C'+' '.join(f'{fmt(p[0])} {fmt(p[1])}' for p in s[1:]))
        out.append('Z')
    return ''.join(out)
def sample(sp,n=120): return [bez(s,k/n) for s in sp for k in range(n)]
