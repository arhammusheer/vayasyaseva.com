import sys,re,math; sys.path.insert(0,sys.argv[1]); from c2lib import *
sp=parse(re.findall(r'\bd="([^"]+)"',open(sys.argv[2]).read())[0])
side=sample(sp[4],300); body=sample(sp[3],300); leaf=sample(sp[1],300)
# neck: min distance from the side opening's stem-side edge (x>80, y>120) to the body opening
seg=[p for p in side if p[0]>85 and p[1]>125]
print('  neck to body opening: min %.2f'%min(min(math.dist(p,q) for q in body) for p in seg), end='')
print('  | side-opening tip lowest y %.1f'%max(p[1] for p in side), end='')
print('  | gap tip->leaf %.2f'%min(min(math.dist(p,q) for q in leaf) for p in seg))
