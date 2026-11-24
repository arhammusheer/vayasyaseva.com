import sys,re,math; sys.path.insert(0,sys.argv[1]); from c2lib import *
subs=parse(re.findall(r'\bd="([^"]+)"',open(sys.argv[2]).read())[0])
samp={k:sample(subs[k],300) for k in range(len(subs))}
for a,b,nm in ((4,6,'centre petal lower side'),(4,3,'stem beside body'),(1,0,'lower leaf ring'),(6,3,'body bar')):
    ds=[]
    for p in samp[a]:
        if p[0]>105.5: continue
        near=min((math.dist(p,r),k) for k in samp if k!=a for r in samp[k][::2])
        if near[1]==b and near[0]<14: ds.append(near[0])
    ds.sort(); print(f'  {nm:26s} min {ds[0]:5.2f} median {ds[len(ds)//2]:5.2f} max {ds[-1]:5.2f}')
