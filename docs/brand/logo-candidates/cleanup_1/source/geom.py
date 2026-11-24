import re, math
def parse(d):
    toks = re.findall(r'[MmCcLlZzHhVv]|-?[\d.]+(?:e-?\d+)?', d)
    i=0; cmd=None; subs=[]; cur=None; cx=cy=0; start=None
    def num():
        nonlocal i; v=float(toks[i]); i+=1; return v
    while i<len(toks):
        t=toks[i]
        if re.match(r'[A-Za-z]',t): cmd=t; i+=1
            
        if cmd in 'Zz':
            subs.append(cur); cur=None; cx,cy=start; cmd=None; continue
        if cmd in 'Mm':
            x,y=num(),num()
            if cmd=='m': x+=cx; y+=cy
            cx,cy=x,y; start=(x,y); cur={'start':(x,y),'segs':[]}
            cmd = 'l' if cmd=='m' else 'L'; continue
        if cmd in 'Cc':
            p=[num() for _ in range(6)]
            if cmd=='c': p=[p[0]+cx,p[1]+cy,p[2]+cx,p[3]+cy,p[4]+cx,p[5]+cy]
            cur['segs'].append(((cx,cy),(p[0],p[1]),(p[2],p[3]),(p[4],p[5])))
            cx,cy=p[4],p[5]; continue
        if cmd in 'Ll':
            x,y=num(),num()
            if cmd=='l': x+=cx;y+=cy
            cur['segs'].append(((cx,cy),(cx,cy),(x,y),(x,y))); cx,cy=x,y; continue
        raise Exception(cmd)
    return subs
def bez(s,t):
    a,b,c,d=s; u=1-t
    return (u**3*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t**3*d[0], u**3*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t**3*d[1])
def flatten(sub,n=40):
    pts=[]
    for s in sub['segs']:
        for k in range(n): pts.append(bez(s,k/n))
    return pts
def raster(polys,res=0.1,W=210,H=210):
    # even-odd scanline, returns list of sets of filled x-indices? return 2D bytearray rows
    nx=int(W/res); ny=int(H/res)
    grid=[bytearray(nx) for _ in range(ny)]
    edges=[]
    for P in polys:
        for k in range(len(P)):
            a=P[k]; b=P[(k+1)%len(P)]
            if a[1]!=b[1]: edges.append((a,b))
    for j in range(ny):
        y=(j+0.5)*res
        xs=[]
        for a,b in edges:
            if (a[1]<=y)!=(b[1]<=y):
                xs.append(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]))
        xs.sort()
        row=grid[j]
        for k in range(0,len(xs)-1,2):
            x0=int(math.ceil(xs[k]/res-0.5)); x1=int(math.floor(xs[k+1]/res-0.5))
            for x in range(max(x0,0),min(x1,nx-1)+1): row[x]=1
    return grid
def area(g,res=0.1): return sum(sum(r) for r in g)*res*res
def mirror_mismatch(g,res=0.1,axis=105):
    nx=len(g[0]); tot=0
    # mirror index: x center (i+0.5)*res -> 2*axis - that
    for r in g:
        for i in range(nx):
            m=int(round(2*axis/res))-1-i # index whose center mirrors
            v2 = r[m] if 0<=m<nx else 0
            if r[i]!=v2: tot+=1
    return tot*res*res/2  # count each mismatched pair once
def xor(g1,g2,res=0.1):
    return sum(sum(1 for a,b in zip(r1,r2) if a!=b) for r1,r2 in zip(g1,g2))*res*res
def fmt(v): 
    s=('%.3f'%v).rstrip('0').rstrip('.'); return '0' if s in('-0','') else s
def to_d(subs):
    out=[]
    for sub in subs:
        s=sub['segs']; out.append('M%s %s'%(fmt(s[0][0][0]),fmt(s[0][0][1])))
        for a,b,c,d in s: out.append('C%s %s %s %s %s %s'%tuple(fmt(v) for v in (b[0],b[1],c[0],c[1],d[0],d[1])))
        out.append('Z')
    return ''.join(out)
D=open('orig.svg').read().split(' d="')[1].split('"')[0]
