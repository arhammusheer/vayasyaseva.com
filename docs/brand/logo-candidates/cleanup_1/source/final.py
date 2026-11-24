from avg import *
def refit_snapped(before, after):
    """for each segment whose endpoints/handles changed by the snap, refit handle lengths to the pre-snap curve with the new end constraints"""
    out=[]
    for b,a in zip(before['segs'],after['segs']):
        if b==a: out.append(a); continue
        straight = abs(a[0][1]-a[3][1])<1e-9 and abs(a[1][1]-a[0][1])<1e-9 and abs(a[2][1]-a[0][1])<1e-9 and a[0][1]>179
        if straight: out.append(a); continue
        ts=[k/24 for k in range(1,24)]; pts=[bez(b,t) for t in ts]
        u=nrm((a[1][0]-a[0][0],a[1][1]-a[0][1])); v=nrm((a[3][0]-a[2][0],a[3][1]-a[2][1]))
        out.append(fit_seg(a[0],a[3],u,v,ts,pts))
    return {'segs':out}
S=parse(D)
outer0=sym_avg(S[0],'L')
print('pre-snap bottom anchors',[s[3] for s in outer0['segs'] if s[3][1]>179], 'apex', [s[0] for s in outer0['segs'] if s[0][0]==105])
o1=flat_bottom(outer0,180.0); o1=refit_snapped(outer0,o1)
o2=snap_y(o1,lambda y:y<40,30.0)
lL,lR=pair_avg(S[1],S[2]); pL,pR=pair_avg(mirror_sub(S[5]),mirror_sub(S[4]))
body=sym_avg(S[3],'L'); central=sym_avg(S[6],'R'); head=circle(105,72,11.125)
new=[o2,lL,lR,body,pL,pR,central,head]
d=to_d(new)
import sys
open(sys.argv[1],'w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 210"><path fill="#DAA236" d="%s"/></svg>\n'%d)
print('anchors',sum(len(s['segs']) for s in new),'bytes',len(d))
