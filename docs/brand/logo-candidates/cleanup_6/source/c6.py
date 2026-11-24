"""Centre petal on top of option F: a sharp point on the axis, an even RING-wide stroke from the side-petal joins
up to the point (outline = the opening's edge offset by RING), and crisp corners where the opening meets the body.
APEX = 'natural' (the opening's edges keep their own angle into the point) or an inner point angle in degrees.
The outline's point is kept at y = TOP (default 30): the opening's point is placed RING/cos(theta) below it.
usage: c6.py LIBDIR option_F.svg out.svg APEX [RING TOP]"""
import sys, math, re
sys.path.insert(0, sys.argv[1]); from c2lib import *
def load(f): return parse(re.findall(r'\bd="([^"]+)"',open(f).read())[0])
F=load(sys.argv[2]); out_f=sys.argv[3]; APEX=sys.argv[4]
RING=float(sys.argv[5]) if len(sys.argv)>5 else 7.8
TOP=float(sys.argv[6]) if len(sys.argv)>6 else 30.0
AX=105.0
def unit(a,b): x,y=b[0]-a[0],b[1]-a[1]; n=math.hypot(x,y); return (x/n,y/n)
def add(p,v,k=1): return (p[0]+v[0]*k,p[1]+v[1]*k)
def lines_x(p,u,q,v):
    den=u[0]*v[1]-u[1]*v[0]; t=((q[0]-p[0])*v[1]-(q[1]-p[1])*v[0])/den; return add(p,u,t)
def tan_at(seg,t):
    e=1e-5; return unit(bez(seg,max(0,t-e)),bez(seg,min(1,t+e)))
def fit(P0,P3,u,v,pts):
    d=[0]
    for a,b in zip(pts,pts[1:]): d.append(d[-1]+math.dist(a,b))
    tt=[x/d[-1] for x in d]
    for _ in range(10):
        A11=A12=A22=R1=R2=0
        for t,p in zip(tt,pts):
            b0,b1,b2,b3=(1-t)**3,3*t*(1-t)**2,3*t*t*(1-t),t**3
            base=(P0[0]*(b0+b1)+P3[0]*(b2+b3), P0[1]*(b0+b1)+P3[1]*(b2+b3))
            c1=(b1*u[0],b1*u[1]); c2=(-b2*v[0],-b2*v[1]); r=(p[0]-base[0],p[1]-base[1])
            A11+=c1[0]**2+c1[1]**2; A12+=c1[0]*c2[0]+c1[1]*c2[1]; A22+=c2[0]**2+c2[1]**2
            R1+=c1[0]*r[0]+c1[1]*r[1]; R2+=c2[0]*r[0]+c2[1]*r[1]
        det=A11*A22-A12*A12; a=(R1*A22-R2*A12)/det; b=(A11*R2-A12*R1)/det
        seg=(P0,add(P0,u,a),add(P3,v,-b),P3)
        tt=[min((math.dist(bez(seg,k/500),p),k/500) for k in range(501))[1] for p in pts]; tt[0]=0.0; tt[-1]=1.0
    err=max(min(math.dist(bez(seg,k/500),p) for k in range(501)) for p in pts)
    return seg,err
def offset_poly(chain, sign, n=200):
    pts=[]
    for sg in chain:
        for k in range(n+1):
            t=k/n; p=bez(sg,t); u=tan_at(sg,t); nl=(u[1],-u[0]); pts.append(add(p,(nl[0]*sign,nl[1]*sign),RING))
    return pts
def poly_curve_x(poly, seg, N=800):
    Q=[bez(seg,k/N) for k in range(N+1)]
    for i in range(len(poly)-1):
        p0,p1=poly[i],poly[i+1]
        for k in range(N):
            q0,q1=Q[k],Q[k+1]; d1=(p1[0]-p0[0],p1[1]-p0[1]); d2=(q1[0]-q0[0],q1[1]-q0[1]); den=d1[0]*d2[1]-d1[1]*d2[0]
            if abs(den)<1e-12: continue
            a=((q0[0]-p0[0])*d2[1]-(q0[1]-p0[1])*d2[0])/den; b=((q0[0]-p0[0])*d1[1]-(q0[1]-p0[1])*d1[0])/den
            if 0<=a<=1 and 0<=b<=1: return i,(k+b)/N,add(p0,d1,a)
    return None
C=F[6]
s7,s8,s9,s10,s11=C[7],C[8],C[9],C[10],C[11]
# ---------- crisp corner where the opening meets the body (replaces the small hook s8)
Nc=lines_x(s7[3],unit(s7[2],s7[3]),s9[0],unit(s9[1],s9[0]))
s9n=(Nc,add(s9[1],(Nc[0]-s9[0][0],Nc[1]-s9[0][1])),s9[2],s9[3])
print('body corner (%.2f,%.2f), moved %.2f from the old hook'%(Nc[0],Nc[1],math.dist(Nc,s7[3])))
# ---------- the opening's upper edge, from the point on the axis down to the body corner
u_nat=unit(s7[0],s7[1])                                  # the edge's own direction at its top end
theta_nat=math.degrees(math.atan2(u_nat[1],-u_nat[0]))   # angle below horizontal, heading left
theta=theta_nat if APEX=='natural' else 90.0-float(APEX)/2.0
th=math.radians(theta); u0=(-math.cos(th),math.sin(th))
if APEX=='natural':   # the opening's edges simply continue to the axis; the outline point floats to match
    yA=s7[0][1]+(AX-s7[0][0])*u_nat[1]/u_nat[0]
    TOP=yA-RING/math.cos(th)
else:
    yA=TOP+RING/math.cos(th)
A=(AX,yA)
# keep the opening's edge exactly as it is below a split point; redraw only the short piece up to the point
SPLIT_DY=float(sys.argv[7]) if len(sys.argv)>7 else 16.0
tq=min((abs(bez(s7,k/2000)[1]-(yA+SPLIT_DY)),k/2000) for k in range(2001))[1]
up,low=split(s7,tq); Q=up[3]; uQ=tan_at(low,0.0)
tgt=[A]+[bez(up,k/60) for k in range(3,61)]
s7top,e7=fit(A,Q,u0,uQ,tgt)
# extend the lower part to the body corner along its own end direction
vEnd=unit(low[2],low[3]); low=(low[0],low[1],add(low[2],(Nc[0]-low[3][0],Nc[1]-low[3][1])),Nc)
s7n=s7top
# check for an S (reverse curve) on the new edge
def infl(seg):
    a,b,c,e=seg; out=[]
    for k in range(2,99):
        t=k/100; u=1-t
        x1=3*(u*u*(b[0]-a[0])+2*u*t*(c[0]-b[0])+t*t*(e[0]-c[0])); y1=3*(u*u*(b[1]-a[1])+2*u*t*(c[1]-b[1])+t*t*(e[1]-c[1]))
        x2=6*(u*(c[0]-2*b[0]+a[0])+t*(e[0]-2*c[0]+b[0])); y2=6*(u*(c[1]-2*b[1]+a[1])+t*(e[1]-2*c[1]+b[1]))
        out.append(x1*y2-y1*x2)
    sg=[1 if v>1e-6 else -1 if v<-1e-6 else 0 for v in out]; sg=[v for v in sg if v]
    return sum(1 for p,q in zip(sg,sg[1:]) if p!=q)
print('opening point (105, %.2f), inner angle %.1f deg (edge %.1f deg below level); top piece refit error %.3f, reverse bends %d'%(yA,180-2*theta,theta,e7,infl(s7top)))
left=[s7top,low,s9n,s10,s11]                                   # point -> body corner -> body top -> axis (bottom)
right=[tuple((2*AX-p[0],p[1]) for p in s_[::-1]) for s_ in reversed(left)]
Cn=right+left                                            # from the bottom axis, up the right side to the point, down the left
for a,b in zip(Cn,Cn[1:]+Cn[:1]): assert math.dist(a[3],b[0])<1e-6,(a[3],b[0])
# ---------- outline: the opening's edge offset by RING, from the side-petal join up to the point (TOP)
O=F[0]
iL=[i for i,s_ in enumerate(O) if abs(s_[3][0]-AX)<1e-6 and s_[3][1]<40][0]
lft=O[:iL+1]
i6=[i for i,s_ in enumerate(lft) if math.dist(s_[3],(66.08,76.26))<0.05][0]          # side petal's top edge (ends at the join)
off=offset_poly([s7top,low],+1)
# which side is outward: the offset point should be farther from the axis/up than the edge
mid=bez(s7n,0.3); test=off[len(off)*3//10]
if test[0]>mid[0]+0.1 or test[1]>mid[1]+0.1: off=offset_poly([s7top,low],-1)
r=poly_curve_x(off,lft[i6])
seg6=lft[i6]
if r:
    iV,tV,V=r; seg6n,_=split(seg6,tV)
else:
    d=unit(seg6[2],seg6[3]); ext6=(seg6[3],add(seg6[3],d,3),add(seg6[3],d,6),add(seg6[3],d,9))
    r=poly_curve_x(off,ext6); assert r,'centre outline offset misses the side petal top'
    iV,_,V=r; dv=(V[0]-seg6[3][0],V[1]-seg6[3][1]); seg6n=(seg6[0],seg6[1],add(seg6[2],dv),V)
apexO=(AX,TOP)
pts=[apexO]+[p for p in off[:iV+1] if math.dist(p,apexO)>0.4 and math.dist(p,V)>0.4]+[V]
pts=list(reversed(pts))                                   # V -> apex
uV=unit(pts[0],pts[3]); uA=(-u0[0],-u0[1])                # arrive at the apex heading up-right
im=len(pts)//2; Pm=pts[im]; uPm=unit(pts[im-3],pts[im+3])
V=seg6n[3]; pts[0]=V
oa,ea=fit(V,Pm,uV,uPm,pts[:im+1]); ob,eb=fit(Pm,apexO,uPm,uA,pts[im:])
print('outline point (105, %.2f), join with the side petal (%.2f,%.2f), outline refit error %.3f / %.3f'%(TOP,V[0],V[1],ea,eb))
new_left=lft[:i6]+[seg6n,oa,ob]
for a,b in zip(new_left,new_left[1:]): assert math.dist(a[3],b[0])<1e-6,(a[3],b[0])
rgt=[tuple((2*AX-p[0],p[1]) for p in s_[::-1]) for s_ in reversed(new_left)]
new=[list(sp) for sp in F]; new[0]=new_left+rgt; new[6]=Cn
open(out_f,'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 210"><path fill="#DAA236" d="{to_d(new)}"/></svg>\n')
