import sys, math
sys.path.insert(0, sys.argv[1]); from c2lib import *
src=open(sys.argv[2]).read(); d=re.findall(r'\bd="([^"]+)"',src)[0]; subs=parse(d)
L=subs[1]
iA,tA=extreme(L,lambda p:p[0]); iB,tB=extreme(L,lambda p:-p[0])
A=bez(L[iA],tA); B=bez(L[iB],tB)
c1=cut_chain(L,iA,tA,iB,tB); c2=cut_chain(L,iB,tB,iA,tA)
my=lambda c: sum(p[1] for p in sample(c,20))/len(sample(c,20))
bot,top = (c1,c2) if my(c1)>my(c2) else (c2,c1)
# make bottom run A->B
if math.dist(bot[0][0],A)>1e-6: bot=reverse(bot)
M=((A[0]+B[0])/2,(A[1]+B[1])/2)
newtop=rot180(bot,M)          # runs B->A
newL=bot+newtop
print('A',A,'B',B,'M',M)
# tangent check at joins
def tan(s,end):
    p,q=(s[2],s[3]) if end else (s[0],s[1])
    if math.dist(p,q)<1e-9: p,q=(s[1],s[3]) if end else (s[0],s[2])
    return math.degrees(math.atan2(q[1]-p[1],q[0]-p[0]))
print('join at B: in %.2f out %.2f | join at A: in %.2f out %.2f'%(tan(bot[-1],1),tan(newtop[0],0),tan(newtop[-1],1),tan(bot[0],0)))
# bottom-chain end angles (0 deg = horizontal)
print('bottom near root: direction of last 10%% of bottom = %.2f deg'%math.degrees(math.atan2(*(lambda a,b:(b[1]-a[1],b[0]-a[0]))(bez(bot[-1],0.0),bez(bot[-1],1.0)))))
# compare old vs new top
old=sample(top,200); new=sample(newtop,200)
import bisect
def y_at(P,x):
    best=min(P,key=lambda p:abs(p[0]-x)); return best[1]
print(' x    old_top_y  new_top_y  rise(+=opening grows up)')
for x in range(24,98,6):
    print(f'{x:4d}  {y_at(old,x):8.2f}  {y_at(new,x):8.2f}  {y_at(old,x)-y_at(new,x):+6.2f}')
newsubs=list(subs); newsubs[1]=newL; newsubs[2]=reverse(mirror_x(newL))
open(sys.argv[3],'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 210"><path fill="#DAA236" d="{to_d(newsubs)}"/></svg>\n')
json.dump({'newsubs':newsubs},open(sys.argv[3]+'.json','w'))
