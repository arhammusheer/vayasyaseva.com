"""cleanup_2 step 2: keep the band above each lower leaf at cleanup_1's weight by moving a few anchors rigidly (anchor + both handles)."""
import sys, json, math, re
sys.path.insert(0, sys.argv[1]); from c2lib import *
def load(f): return parse(re.findall(r'\bd="([^"]+)"',open(f).read())[0])
old=load(sys.argv[2]); new=json.load(open(sys.argv[3]+'.json'))['newsubs']
new=[[list(list(p) for p in s) for s in sp] for sp in new]
def topedge(sp):
    P=sample(sp,400); A=min(P,key=lambda p:p[0]); B=max(P,key=lambda p:p[0]); ux,uy=B[0]-A[0],B[1]-A[1]
    return [p for p in P if (p[0]-A[0])*uy-(p[1]-A[1])*ux>0]
To,Tn=topedge(old[1]),topedge([tuple(tuple(p) for p in s) for s in new[1]])
def yat(T,x): return min(T,key=lambda p:abs(p[0]-x))[1]
def rise(x): return yat(To,x)-yat(Tn,x)
def move_anchor(sp,i,dx,dy):
    n=len(sp); prev=sp[(i-1)%n]; cur=sp[i]
    for p in (cur[0],cur[1],prev[2],prev[3]): p[0]+=dx; p[1]+=dy
def find(sp,pt):
    return min(range(len(sp)),key=lambda i:math.dist(sp[i][0],pt))
k=float(sys.argv[5]) if len(sys.argv)>5 else 1.0
# side-petal opening (left = subpath 4)
L4=new[4]
i_foot=find(L4,(65.04,133.50)); dy=k*rise(65.04); move_anchor(L4,i_foot,0,-dy)
e0=L4[find(L4,(94.27,148.81))][0]; e1=(80.44,119.97); ux,uy=e1[0]-e0[0],e1[1]-e0[1]; n=math.hypot(ux,uy); ux,uy=ux/n,uy/n
r=k*rise(93.0); s=r/abs(uy)
for pt in ((91.96,149.05),(94.50,150.40),(94.27,148.81)):
    move_anchor(L4,find(L4,pt),ux*s,uy*s)
new[4]=L4; new[5]=[list(list(p) for p in s) for s in reverse(mirror_x([tuple(tuple(p) for p in s) for s in L4]))]
# outer notch where the side petal rises out of the leaf (both sides)
O=new[0]; c0=(44.16,127.30); c1=(31.72,90.29); vx,vy=c1[0]-c0[0],c1[1]-c0[1]; n=math.hypot(vx,vy); vx,vy=vx/n,vy/n
r=k*rise(44.16); s=r/abs(vy)
move_anchor(O,find(O,c0),vx*s,vy*s); move_anchor(O,find(O,(210-c0[0],c0[1])),-vx*s,vy*s)
out=[[tuple(tuple(p) for p in s) for s in sp] for sp in new]
open(sys.argv[4],'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 210"><path fill="#DAA236" d="{to_d(out)}"/></svg>\n')
print('moved: foot anchor up %.2f, tip anchors %.2f along stem edge, outer notch %.2f along petal edge'%(dy, k*rise(93.0)/abs(uy), k*rise(44.16)/abs(vy)))
