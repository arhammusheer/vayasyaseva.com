"""E1 on cleanup_6: the side opening's right side becomes an exact RING offset of its neighbours --
the body opening along the stem, the centre opening along the centre petal's lower side -- with a smooth blend
where the two meet, a crisp knuckle (meets the opening's top edge) and a crisp tip (meets the band).
usage: c7.py LIBDIR cleanup_6.svg out.svg [RING BLEND]"""
import sys, math, re
sys.path.insert(0, sys.argv[1]); from c2lib import *
def load(f): return parse(re.findall(r'\bd="([^"]+)"',open(f).read())[0])
C6=load(sys.argv[2]); out_f=sys.argv[3]
RING=float(sys.argv[4]) if len(sys.argv)>4 else 7.8
BLEND=float(sys.argv[5]) if len(sys.argv)>5 else 4.0     # half-length of the smooth hand-off between the two offsets
def unit(a,b): x,y=b[0]-a[0],b[1]-a[1]; n=math.hypot(x,y); return (x/n,y/n)
def add(p,v,k=1): return (p[0]+v[0]*k,p[1]+v[1]*k)
def tan_at(seg,t):
    e=1e-5; return unit(bez(seg,max(0,t-e)),bez(seg,min(1,t+e)))
def offset_left_of(chain, away_from, n=300):
    """offset each point by RING along the normal pointing AWAY from the point `away_from` side test (x smaller = left)"""
    pts=[]
    for sg in chain:
        for k in range(n+1):
            t=k/n; p=bez(sg,t); u=tan_at(sg,t); nl=(u[1],-u[0])
            if nl[0]>0: nl=(-nl[0],-nl[1])      # the side opening is to the LEFT (smaller x) of both neighbours
            pts.append(add(p,nl,RING))
    return pts
def pp_x(P,Q):
    for i in range(len(P)-1):
        for j in range(len(Q)-1):
            p0,p1,q0,q1=P[i],P[i+1],Q[j],Q[j+1]; d1=(p1[0]-p0[0],p1[1]-p0[1]); d2=(q1[0]-q0[0],q1[1]-q0[1]); den=d1[0]*d2[1]-d1[1]*d2[0]
            if abs(den)<1e-12: continue
            a=((q0[0]-p0[0])*d2[1]-(q0[1]-p0[1])*d2[0])/den; b=((q0[0]-p0[0])*d1[1]-(q0[1]-p0[1])*d1[0])/den
            if 0<=a<=1 and 0<=b<=1: return i,j,add(p0,d1,a)
    return None
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
L=C6[4]; s0,s1,s2,s3,s4=L
body=C6[3]; cen=C6[6]
bseg=[s_ for s_ in body if s_[0][0]<105 and s_[3][0]<105 and max(s_[0][1],s_[3][1])>100]        # body opening's left edge
cseg=[s_ for s_ in cen if s_[0][0]<100 and s_[3][0]<100 and min(bez(s_,k/20)[0] for k in range(21))<80]  # the centre petal's lower-left edge only (not the body bar)
ob=offset_left_of(bseg,None); oc=offset_left_of(cseg,None)
# keep only the parts that face the side opening
ob=[p for p in ob if p[1]>100]; oc=[p for p in oc if 75<p[1]<125]
ob.sort(key=lambda p:p[1]); oc.sort(key=lambda p:p[1])
YB=float(sys.argv[6]) if len(sys.argv)>6 else 126.0   # follow the stem offset up to here
YC=float(sys.argv[7]) if len(sys.argv)>7 else 110.0   # follow the centre-petal offset down to here
# knuckle: where the centre offset meets the opening's top edge (s2), extended back along its own direction
d2=unit(s2[1],s2[0]); topline=[add(s2[0],d2,-12+k*0.2) for k in range(121)]
r=pp_x(oc,topline); assert r,'no knuckle'
K=r[2]; dk=(K[0]-s2[0][0],K[1]-s2[0][1]); s2n=(K,add(s2[1],dk),s2[2],s2[3])
# tip: where the stem offset meets the band (s4)
band=[bez(s4,k/600) for k in range(601)]
r=pp_x(ob,band); assert r,'no tip'
_,jt,Tp=r; tb=jt/600
s4n,_=split(s4,tb); s4n=(s4n[0],s4n[1],s4n[2],Tp)
print('knuckle (%.2f,%.2f) was (%.2f,%.2f);  tip (%.2f,%.2f) was (%.2f,%.2f)'%(K[0],K[1],s2[0][0],s2[0][1],Tp[0],Tp[1],s0[0][0],s0[0][1]))
# keep cleanup_6's own curve through the joint (it clears the corner); exact offsets above and below it
Y_STEM=float(sys.argv[9]) if len(sys.argv)>9 else 136.0    # below this: the stem offset
Y_JL,Y_JH=float(sys.argv[10]) if len(sys.argv)>10 else 128.0, float(sys.argv[11]) if len(sys.argv)>11 else 112.0   # joint: existing curve
Y_SIDE=float(sys.argv[12]) if len(sys.argv)>12 else 104.0   # above this: the centre-petal offset
exist=[bez(s0,k/400) for k in range(401)]+[bez(s1,k/400) for k in range(401)]
stem=sorted([p for p in ob if Tp[1]>=p[1]>=Y_STEM],key=lambda p:-p[1])
joint=sorted([p for p in exist if Y_JL>=p[1]>=Y_JH],key=lambda p:-p[1])
side=sorted([p for p in oc if Y_SIDE>=p[1]>=K[1]],key=lambda p:-p[1])
M=min(exist,key=lambda p:abs(p[1]-(Y_JL+Y_JH)/2)); im=exist.index(M); uM=unit(exist[min(len(exist)-1,im+3)],exist[max(0,im-3)])
if uM[1]>0: uM=(-uM[0],-uM[1])                                     # heading up
uT=unit(Tp,stem[min(4,len(stem)-1)]); uK=unit(side[-5],K)
A_,ea=fit(Tp,M,uT,uM,[Tp]+stem+[p for p in joint if p[1]>=M[1]]+[M])
B_,eb=fit(M,K,uM,uK,[M]+[p for p in joint if p[1]<M[1]]+side+[K])
J_=None
print('right side: lower part (stem + joint) error %.3f, upper part (joint + centre side) error %.3f'%(ea,eb))
L4=[A_,B_,s2n,s3,s4n]
for a,b in zip(L4,L4[1:]+L4[:1]): assert math.dist(a[3],b[0])<1e-6,(a[3],b[0])
new=[list(sp) for sp in C6]; new[4]=L4; new[5]=reverse(mirror_x(L4))
open(out_f,'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 210"><path fill="#DAA236" d="{to_d(new)}"/></svg>\n')
