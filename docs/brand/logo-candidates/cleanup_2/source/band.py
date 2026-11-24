import sys, json, math, re
sys.path.insert(0, sys.argv[1]); from c2lib import *
def load(f):
    t=open(f).read(); return parse(re.findall(r'\bd="([^"]+)"',t)[0])
old=load(sys.argv[2]); new=load(sys.argv[3])
def band(subs):
    L=sample(subs[1],300); others=sample(subs[0],300)+sample(subs[4],300)+sample(subs[3],200)
    # top edge of leaf opening only: points above the tip-to-root line
    A=min(L,key=lambda p:p[0]); B=max(L,key=lambda p:p[0])
    ux,uy=B[0]-A[0],B[1]-A[1]
    top=[p for p in L if (p[0]-A[0])*uy-(p[1]-A[1])*ux>0]
    res=[]
    for x in range(24,98,6):
        p=min(top,key=lambda q:abs(q[0]-x))
        q=min(others,key=lambda o:math.dist(o,p)); res.append((x,math.dist(p,q)))
    return res
for (x,a),(_,b) in zip(band(old),band(new)): print(f'x={x:3d}  band above leaf: cleanup_1 {a:5.2f}   step1 {b:5.2f}')
