import sys,re,math; sys.path.insert(0,sys.argv[1]); from c2lib import *
subs=parse(re.findall(r'\bd="([^"]+)"',open(sys.argv[2]).read())[0])
samp={k:sample(subs[k],300) for k in range(8)}
ds=[]
for p in samp[4]:
    if p[0]>105.5: continue
    near=min((math.dist(p,r),k) for k in samp if k!=4 for r in samp[k][::2])
    if near[1]==1 and near[0]<14: ds.append(near[0])
ds.sort()
sp=subs[4]
def infl(seg):
    a,b,c,e=seg; out=[]
    for k in range(2,99):
        t=k/100; u=1-t
        x1=3*(u*u*(b[0]-a[0])+2*u*t*(c[0]-b[0])+t*t*(e[0]-c[0])); y1=3*(u*u*(b[1]-a[1])+2*u*t*(c[1]-b[1])+t*t*(e[1]-c[1]))
        x2=6*(u*(c[0]-2*b[0]+a[0])+t*(e[0]-2*c[0]+b[0])); y2=6*(u*(c[1]-2*b[1]+a[1])+t*(e[1]-2*c[1]+b[1]))
        out.append(x1*y2-y1*x2)
    sg=[1 if v>1e-6 else -1 if v<-1e-6 else 0 for v in out]; sg=[v for v in sg if v]
    return sum(1 for p,q in zip(sg,sg[1:]) if p!=q)
print('band min %.2f median %.2f | side-opening reverse bends %s'%(ds[0],ds[len(ds)//2],[infl(s) for s in sp]))
