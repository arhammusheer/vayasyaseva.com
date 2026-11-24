# how far each side-opening curve strays to both sides of its own chord: a visible S has both sides clearly > 0
import sys,re,math; sys.path.insert(0,sys.argv[1]); from c2lib import *
sp=parse(re.findall(r'\bd="([^"]+)"',open(sys.argv[2]).read())[0])[4]
out=[]
for i,s in enumerate(sp):
    a,d=s[0],s[3]; ux,uy=d[0]-a[0],d[1]-a[1]; L=math.hypot(ux,uy)
    dev=[((p[0]-a[0])*uy-(p[1]-a[1])*ux)/L for p in [bez(s,k/300) for k in range(301)]]
    out.append('%d:(%.2f,%.2f)'%(i,min(dev),max(dev)))
print('  chord offsets per segment (neg, pos):',' '.join(out))
