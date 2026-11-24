# signed curvature along the side opening's lower edge (from the foot to the tip): an S shows as a sign change
import sys,re,math; sys.path.insert(0,sys.argv[1]); from c2lib import *
sp=parse(re.findall(r'\bd="([^"]+)"',open(sys.argv[2]).read())[0])[4]
segs=[s for s in sp if s[0][0]>60 and s[0][1]>125 and s[3][0]>60]  # lower edge pieces
segs=[s for s in segs if min(s[0][1],s[3][1])>125 and math.dist(s[0],s[3])>4]
def d1(s,t):
    a,b,c,e=s; u=1-t; return (3*(u*u*(b[0]-a[0])+2*u*t*(c[0]-b[0])+t*t*(e[0]-c[0])),3*(u*u*(b[1]-a[1])+2*u*t*(c[1]-b[1])+t*t*(e[1]-c[1])))
def d2(s,t):
    a,b,c,e=s; u=1-t; return (6*(u*(c[0]-2*b[0]+a[0])+t*(e[0]-2*c[0]+b[0])),6*(u*(c[1]-2*b[1]+a[1])+t*(e[1]-2*c[1]+b[1])))
ks=[]
for s in segs:
    for k in range(1,50):
        t=k/50; x1,y1=d1(s,t); x2,y2=d2(s,t); ks.append((x1*y2-y1*x2)/max(1e-9,(x1*x1+y1*y1)**1.5))
sg=[1 if k>1e-4 else (-1 if k<-1e-4 else 0) for k in ks]; sg=[v for v in sg if v]
changes=sum(1 for a,b in zip(sg,sg[1:]) if a!=b)
print('  lower edge: %d pieces, curvature sign changes (S-bends): %d'%(len(segs),changes))
