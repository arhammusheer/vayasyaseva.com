import sys,re,math; sys.path.insert(0,sys.argv[1]); from c2lib import *
subs=parse(re.findall(r'\bd="([^"]+)"',open(sys.argv[2]).read())[0])
names=['outer','leafL','leafR','body','sideL','sideR','centre','head']
P=sample(subs[4],300); others=[(k,p) for k in range(8) if k!=4 for p in sample(subs[k],300)]
groups={}
for p in P[::4]:
    q=min(others,key=lambda kp:math.dist(kp[1],p)); groups.setdefault(names[q[0]],[]).append(math.dist(q[1],p))
print('  stroke around the side opening, by neighbour:', '  '.join('%s %.1f-%.1f'%(k,min(v),max(v)) for k,v in groups.items()))
def kinks(sp):
    out=[]
    for a,b in zip(sp,sp[1:]+sp[:1]):
        def d(p,q): x,y=q[0]-p[0],q[1]-p[1]; n=math.hypot(x,y); return (x/n,y/n) if n>1e-9 else None
        tin=d(a[2],a[3]) or d(a[1],a[3]); tout=d(b[0],b[1]) or d(b[0],b[2])
        ang=math.degrees(math.acos(max(-1,min(1,tin[0]*tout[0]+tin[1]*tout[1]))))
        if ang>0.5: out.append((round(ang),(round(a[3][0],1),round(a[3][1],1))))
    return out
print('  sharp corners: outer', [c for c in kinks(subs[0]) if c[1][0]<106], ' side opening', kinks(subs[4]))
