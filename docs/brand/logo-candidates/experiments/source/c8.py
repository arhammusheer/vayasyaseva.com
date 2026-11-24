"""E4: crisp corners on the figure: the body bar's outer top corners and the body opening's top corners.
Sides are extended along their own direction, tops are level lines. usage: c8.py LIBDIR in.svg out.svg"""
import sys, math, re
sys.path.insert(0, sys.argv[1]); from c2lib import *
def load(f): return parse(re.findall(r'\bd="([^"]+)"',open(f).read())[0])
M=load(sys.argv[2]); out=sys.argv[3]; AX=105.0
def line(a,b): return (a,(a[0]+(b[0]-a[0])/3,a[1]+(b[1]-a[1])/3),(a[0]+2*(b[0]-a[0])/3,a[1]+2*(b[1]-a[1])/3),b)
def mir(seg): return tuple((2*AX-p[0],p[1]) for p in seg[::-1])
# --- centre opening: left half is the last 5 segments (point -> ... -> body corner -> bar side -> bar top -> axis)
C=M[6]; n=len(C); left=C[n//2:]; s_side,s_top,s_axis=left[2],left[3],left[4]
y_top=s_top[3][1]
dx=(s_side[1][0]-s_side[0][0])/(s_side[1][1]-s_side[0][1])          # side's own lean (x per y) at its lower end
Cc=(s_side[0][0]+dx*(y_top-s_side[0][1]), y_top)
left_new=left[:2]+[line(s_side[0],Cc), line(Cc,s_top[3]), s_axis]
right_new=[mir(s_) for s_ in reversed(left_new)]
M[6]=right_new+left_new
# --- body opening: seg1 is the rounded top-left corner from (104.5,98.92) to the side's top (94.74,106.31)
Bo=M[3]; s1,s2=Bo[1],Bo[2]
dx2=(s2[1][0]-s2[0][0])/(s2[1][1]-s2[0][1]); yb=s1[0][1]
Cb=(s2[0][0]+dx2*(yb-s2[0][1]), yb)
newL=[line(s1[0],Cb), line(Cb,s2[0])]
Bo_new=[Bo[0]]+newL+Bo[2:6]+[mir(s_) for s_ in reversed(newL)]+[Bo[7]]
for a,b in zip(Bo_new,Bo_new[1:]+Bo_new[:1]): assert math.dist(a[3],b[0])<1e-6,(a[3],b[0])
for a,b in zip(M[6],M[6][1:]+M[6][:1]): assert math.dist(a[3],b[0])<1e-6,(a[3],b[0])
M[3]=Bo_new
print('body bar outer corner (%.2f,%.2f); body opening corner (%.2f,%.2f); bar side thickness %.2f, bar top %.2f'%(Cc[0],Cc[1],Cb[0],Cb[1],Cb[0]-Cc[0],yb-y_top))
open(out,'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 210"><path fill="#DAA236" d="{to_d(M)}"/></svg>\n')
