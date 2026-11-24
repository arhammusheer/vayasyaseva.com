"""cleanup_3 step 2: rebuild where the side petal meets the lower leaf, smoothly.
- Outer silhouette: cleanup_1's (crisp notch where the side petal lands on the leaf).
- Side opening: cleanup_1's lower sweep (petal inner edge -> bottom edge) lifted as one smooth shape:
  constant lift D (= the leaf's rise at the foot) along the band, fading to 0 up the petal (y W0..W1),
  easing linearly along the bottom edge into the tip's slide along the stem edge. Refit as smooth cubics.
- Tip and stem edge: cleanup_1's tip slid along the stem edge (shape unchanged), so the neck keeps its width.
usage: c3u.py LIBDIR cleanup_1.svg cleanup_2.svg out.svg [W0 W1]"""
import sys, math, re
sys.path.insert(0, sys.argv[1]); from c2lib import *
def load(f): return parse(re.findall(r'\bd="([^"]+)"',open(f).read())[0])
C1=load(sys.argv[2]); C2=load(sys.argv[3]); out_f=sys.argv[4]
W0=float(sys.argv[5]) if len(sys.argv)>5 else 105.0
W1=float(sys.argv[6]) if len(sys.argv)>6 else 128.0
def topedge(sp):
    P=sample(sp,400); A=min(P,key=lambda p:p[0]); B=max(P,key=lambda p:p[0]); ux,uy=B[0]-A[0],B[1]-A[1]
    return [p for p in P if (p[0]-A[0])*uy-(p[1]-A[1])*ux>0]
To,Tn=topedge(C1[1]),topedge(C2[1])
def yat(T,x): return min(T,key=lambda p:abs(p[0]-x))[1]
def ss(t): t=min(1,max(0,t)); return t*t*(3-2*t)
def unit(a,b): x,y=b[0]-a[0],b[1]-a[1]; n=math.hypot(x,y); return (x/n,y/n)
old=C1[4]; seg7,seg8=old[7],old[8]
foot=seg8[0]; D=yat(To,foot[0])-yat(Tn,foot[0])            # the leaf's rise at the foot
e0,e1=old[2][0],old[2][3]; ux,uy=unit(e0,e1); s=D/abs(uy)   # tip slides along the stem edge, same vertical lift
slide=(ux*s,uy*s); sh=lambda p:(p[0]+slide[0],p[1]+slide[1])
tip0=tuple(sh(p) for p in old[0]); tip1=tuple(sh(p) for p in old[1]); seg2=(sh(old[2][0]),sh(old[2][1]),old[2][2],old[2][3])
ts=[k/80 for k in range(81)]
t7=[(lambda p:(p[0],p[1]-D*ss((p[1]-W0)/(W1-W0))))(bez(seg7,t)) for t in ts]
t8=[(lambda p,t:(p[0]+t*slide[0], p[1]-D*(1-t)+t*slide[1]))(bez(seg8,t),t) for t in ts]
def fit(P0,P3,u,v,pts):
    d=[0]
    for a,b in zip(pts,pts[1:]): d.append(d[-1]+math.dist(a,b))
    tt=[x/d[-1] for x in d]
    for _ in range(8):
        A11=A12=A22=R1=R2=0
        for t,p in zip(tt,pts):
            b0,b1,b2,b3=(1-t)**3,3*t*(1-t)**2,3*t*t*(1-t),t**3
            base=(P0[0]*(b0+b1)+P3[0]*(b2+b3), P0[1]*(b0+b1)+P3[1]*(b2+b3))
            c1=(b1*u[0],b1*u[1]); c2=(-b2*v[0],-b2*v[1]); r=(p[0]-base[0],p[1]-base[1])
            A11+=c1[0]**2+c1[1]**2; A12+=c1[0]*c2[0]+c1[1]*c2[1]; A22+=c2[0]**2+c2[1]**2
            R1+=c1[0]*r[0]+c1[1]*r[1]; R2+=c2[0]*r[0]+c2[1]*r[1]
        det=A11*A22-A12*A12; a=(R1*A22-R2*A12)/det; b=(A11*R2-A12*R1)/det
        seg=(P0,(P0[0]+a*u[0],P0[1]+a*u[1]),(P3[0]-b*v[0],P3[1]-b*v[1]),P3)
        tt=[min((math.dist(bez(seg,k/500),p),k/500) for k in range(501))[1] for p in pts]; tt[0]=0.0; tt[-1]=1.0
    err=max(min(math.dist(bez(seg,k/500),p) for k in range(501)) for p in pts)
    return seg,err
M=t8[0]; Pend=tip0[0]
u7=unit(seg7[0],seg7[1]); uM=unit(t7[-3],t8[2]); vEnd=unit(old[0][0],old[0][1])   # tip keeps its direction
n7,e7=fit(seg7[0],M,u7,uM,t7); n8,e8=fit(M,Pend,uM,vEnd,t8)
print('lift D=%.2f  tip slide %.2f  refit error: petal edge %.3f  bottom edge %.3f'%(D,s,e7,e8))
L4=[tip0,tip1,seg2]+old[3:7]+[n7,n8]
for a,b in zip(L4,L4[1:]+L4[:1]): assert math.dist(a[3],b[0])<1e-6
new=[list(sp) for sp in C2]; new[0]=C1[0]; new[4]=L4; new[5]=reverse(mirror_x(L4))
open(out_f,'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 210"><path fill="#DAA236" d="{to_d(new)}"/></svg>\n')
