LOOPS.p0 = t => { paint(rectPts(-10,-10,W+20,H+20), {wash: PAL.sky, ink:null}); clawd(960,800,24,feel('happy',t)); }; LOOPS.p0.len=4;
LOOPS.p1 = t => { LOOPS.p0(t); glow(500,300,200); }; LOOPS.p1.len=4;
LOOPS.p2 = t => { LOOPS.p0(t); paint(ellPts(500,300,300,200,30,5), {fill: PAL.rose, fillOp:120, ink:null}); }; LOOPS.p2.len=4;
LOOPS.p3 = t => { LOOPS.p0(t); for(let i=0;i<40;i++) paint(ellPts(100+i*40,300,30,50,16,3), {wash: PAL.rose, ink:PAL.ink, sw:1}); }; LOOPS.p3.len=4;
