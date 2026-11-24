import sys,re
g=lambda f: re.findall(r'\bd="([^"]+)"',open(f).read())[0]
ORIG,NEW=g(sys.argv[1]),g(sys.argv[2]); OUT=sys.argv[3]
GOLD='#DAA236'; INK='#111111'; PAPER='#FFFFFF'; BOARD='#F3F2EE'; MUTED='#6B7280'; LINE='#E2E0DA'
FONT="Helvetica Neue, Helvetica, Arial, sans-serif"
def mark(d,x,y,w,h,fill=GOLD,pad=0.0):
    # fits the 210 canvas mark (content x 6..204, y 28..180) into the box, centred
    return f'<svg x="{x}" y="{y}" width="{w}" height="{h}" viewBox="{4-pad} {26-pad} {202+2*pad} {156+2*pad}" preserveAspectRatio="xMidYMid meet"><path d="{d}" fill="{fill}"/></svg>'
def sq(d,x,y,s,fill=GOLD,pad=6):
    return f'<svg x="{x}" y="{y}" width="{s}" height="{s}" viewBox="{-pad+4} {-pad+26-23} {202+2*pad} {202+2*pad}"><path d="{d}" fill="{fill}"/></svg>'
def text(x,y,t,size=12,weight='normal',fill=INK,anchor='start',ls=0):
    return f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}" letter-spacing="{ls}">{t}</text>'
def rect(x,y,w,h,fill,r=0,stroke=None):
    st=f' stroke="{stroke}" stroke-width="1"' if stroke else ''
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"{st}/>'
def board(parts,title,sub):
    head=[rect(0,0,1000,1000,BOARD),text(48,64,'VAYASYA SEVA · MARK REFINEMENT',11,'bold',MUTED,ls=2),text(48,96,title,26,'bold'),text(48,120,sub,13,'normal',MUTED)]
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="2000" height="2000">{"".join(head+parts)}<line x1="48" y1="956" x2="952" y2="956" stroke="{LINE}"/>{text(48,978,"Gold #DAA236 · Ink #111111",10,"normal",MUTED)}{text(952,978,"Original = live mark · Refined = cleanup_8",10,"normal",MUTED,"end")}</svg>'
# ---------------- board 1: primary
p=[]
for i,(lab,d) in enumerate((('Original',ORIG),('Refined',NEW))):
    x=48+i*462
    p+= [text(x,170,lab.upper(),12,'bold',INK,ls=1.5)]
    p+= [rect(x,184,442,360,PAPER,6,LINE), mark(d,x+46,184+50,350,260)]
    p+= [rect(x,560,442,360,INK,6), mark(d,x+46,560+50,350,260)]
open(f'{OUT}/1-primary.svg','w').write(board(p,'Primary mark, light and dark','The same artwork on white and on ink. Refined keeps the gesture; tips, joins and stroke are now consistent.'))
# ---------------- board 2: colour & reversal
p=[]; cols=[('Gold on white',PAPER,GOLD,True),('Gold on ink',INK,GOLD,False),('White on gold',GOLD,PAPER,False),('Ink on white',PAPER,INK,True),('White on ink',INK,PAPER,False)]
tw=170; gap=10
for j,(cl,bg,fg,border) in enumerate(cols):
    x=48+j*(tw+gap); p.append(text(x,176,cl,11,'bold',MUTED))
for i,(lab,d) in enumerate((('Original',ORIG),('Refined',NEW))):
    y=200+i*370
    p.append(text(48,y-6+0,'',1))
    for j,(cl,bg,fg,border) in enumerate(cols):
        x=48+j*(tw+gap)
        p.append(rect(x,y,tw,330,bg,6,LINE if border else None)); p.append(mark(d,x+18,y+105,tw-36,120,fg))
        if j==0: p.append(text(x+12,y+24,lab.upper(),11,'bold',INK if bg!=INK else PAPER,ls=1.5))
open(f'{OUT}/2-colour.svg','w').write(board(p,'Colour and reversal','Brand gold, one-colour ink, and reversed. The mark has to survive all five without changes.'))
# ---------------- board 3: sizes & usage
p=[]
sizes=[128,64,48,32,24,16]
p.append(text(48,170,'SIZE LADDER',12,'bold',INK,ls=1.5))
for i,(lab,d) in enumerate((('Original',ORIG),('Refined',NEW))):
    y=186+i*172
    p.append(rect(48,y,446,160,PAPER,6,LINE)); p.append(rect(506,y,446,160,INK,6))
    p.append(text(60,y+20,lab.upper(),10,'bold',MUTED,ls=1.5)); p.append(text(518,y+20,lab.upper(),10,'bold','#9CA3AF',ls=1.5))
    for side,(x0,fill) in enumerate(((60,GOLD),(518,GOLD))):
        x=x0
        for s in sizes:
            h=s*156/202; p.append(mark(d,x,y+30+(128*156/202-h)/2+8,s,h,fill)); 
            p.append(text(x+s/2,y+150,f'{s}',9,'normal',MUTED if side==0 else '#9CA3AF','middle'))
            x+=s+16
p.append(text(48,560,'IN USE',12,'bold',INK,ls=1.5))
# browser tabs with favicons (16 px)
for i,(lab,d) in enumerate((('Original',ORIG),('Refined',NEW))):
    y=576+i*58
    p.append(rect(48,y,452,48,'#DEDCD6',8))
    p.append(f'<path d="M60 {y+48} L60 {y+14} Q60 {y+8} 66 {y+8} L276 {y+8} Q282 {y+8} 282 {y+14} L282 {y+48} Z" fill="{PAPER}"/>')
    p.append(sq(d,72,y+19,18,GOLD,4)); p.append(text(98,y+32,'Vayasya Seva — Workforce',12,'normal',INK))
    p.append(text(490,y+32,lab,10,'bold',MUTED,'end'))
# app icons and avatars
for i,(lab,d) in enumerate((('Original',ORIG),('Refined',NEW))):
    x=540+i*212; y=576
    p.append(text(x,y+10,lab.upper(),10,'bold',MUTED,ls=1.5))
    p.append(rect(x,y+22,88,88,GOLD,20)); p.append(sq(d,x+6,y+28,76,PAPER,22))
    p.append(rect(x+104,y+22,88,88,INK,20)); p.append(sq(d,x+110,y+28,76,GOLD,22))
    p.append(f'<circle cx="{x+44}" cy="{y+170}" r="44" fill="{INK}"/>'); p.append(sq(d,x+10,y+136,68,GOLD,30))
    p.append(f'<circle cx="{x+148}" cy="{y+170}" r="44" fill="{PAPER}" stroke="{LINE}"/>'); p.append(sq(d,x+114,y+136,68,GOLD,30))
    p.append(text(x,y+236,'App icon · avatar',10,'normal',MUTED))
# small embossed-style uniform patch / signage strip
for i,(lab,d) in enumerate((('Original',ORIG),('Refined',NEW))):
    y=712+i*110
    p.append(rect(48,y,452,96,INK,6)); p.append(mark(d,64,y+14,90,68,GOLD))
    p.append(text(170,y+44,'Site signage',15,'bold',PAPER)); p.append(text(170,y+66,lab+' mark · gold on ink',11,'normal','#9CA3AF'))
open(f'{OUT}/3-sizes-usage.svg','w').write(board(p,'Sizes and usage','From 128 px down to a 16 px favicon, and in the places people actually meet it.'))
