/* Stick-figure demo animations, keyed by demo id (an exercise id by default).
   Generated from the original Exercise Atlas page. Each demo loops through its frames;
   see src/lib/stick.ts for what each field means. */
import type { Demo } from "@/lib/stick";

export const DEMOS: Record<string, Demo> = {
  "back-squat": {
    view: "side", labels: ["Top","Bottom"], eb1: -1,
    frames: [
      {h:[106,89],t:0,a1:[108,155],w1:["sh",-7,-1]},
      {h:[86,122],t:40,a1:[108,155],w1:["sh",-6,-1]}
    ],
    props: [
      {k:"plate",at:"mid:sh:wr1",off:[-3,-2],r:13}
    ],
  },
  "leg-press": {
    view: "side", labels: ["Top","Bottom"],
    frames: [
      {h:[70,128],t:-50,a1:[118,90],ft1:315,w1:["hip",10,-2]},
      {h:[70,128],t:-50,a1:[100,108],ft1:315,w1:["hip",10,-2]}
    ],
    props: [
      {k:"seg",p1:[100,108],p2:[170,38],w:2.5},
      {k:"seg",p1:[64,135],p2:[28,104],w:7},
      {k:"seg",p1:[60,136],p2:[90,136],w:7},
      {k:"seg",p1:[72,139],p2:[72,160],w:4},
      {k:"seg",at:"an1",off:[0,-6],ang:135,len:36,w:5,layer:"front"}
    ],
  },
  "bulgarian-split-squat": {
    view: "side", labels: ["Top","Bottom"],
    frames: [
      {h:[104,94],t:8,a1:[128,155],a2:[66,125],ft2:255,w1:["sh",2,43]},
      {h:[100,118],t:15,a1:[128,155],a2:[68,126],ft2:255,w1:["sh",2,43]}
    ],
    props: [
      {k:"rect",x:22,y:131,w:54,h:7},
      {k:"seg",p1:[30,138],p2:[30,160],w:4},
      {k:"seg",p1:[68,138],p2:[68,160],w:4},
      {k:"db",at:"wr1"}
    ],
  },
  "zercher-squat": {
    view: "side", labels: ["Top","Bottom"], kb2: -1, eb1: 1,
    frames: [
      {h:[104,93],t:0,a1:[126,155],a2:[80,150],ft2:125,w1:["sh",14,2]},
      {h:[102,120],t:8,a1:[126,155],a2:[80,150],ft2:125,w1:["sh",14,2]}
    ],
    props: [
      {k:"plate",at:"e1",r:13}
    ],
  },
  "step-up": {
    view: "side", labels: ["Bottom","Top"],
    frames: [
      {h:[100,98],t:18,a1:[128,121],a2:[86,155],ft2:95,w1:["sh",2,43]},
      {h:[126,56],t:0,a1:[128,121],a2:[114,116],ft2:120,w1:["sh",2,43]}
    ],
    props: [
      {k:"rect",x:116,y:126,w:44,h:34,rx:2},
      {k:"db",at:"wr1"}
    ],
  },
  "leg-extension": {
    view: "side", labels: ["Start","Extend"],
    frames: [
      {h:[96,110],t:-8,a1:[129,142],ft1:95,w1:["hip",8,6]},
      {h:[96,110],t:-8,a1:[160,104],ft1:0,w1:["hip",8,6]}
    ],
    props: [
      {k:"rect",x:68,y:114,w:64,h:6},
      {k:"seg",p1:[84,112],p2:[79,64],w:6},
      {k:"seg",p1:[100,120],p2:[100,160],w:4},
      {k:"pad",seg:["k1","an1"],at:0.82,perp:-6.5,r:5,id:"roller"},
      {k:"seg",p1:[131,113],p2:"roller",w:3}
    ],
  },
  "calf-raise": {
    view: "side", labels: ["Stretch","Top"],
    frames: [
      {h:[104,83],t:0,a1:[104,149],ft1:62,w1:["sh",2,43]},
      {h:[105,75],t:0,a1:[104.8,141.2],ft1:130,w1:["sh",2,43]}
    ],
    props: [
      {k:"rect",x:107,y:147,w:50,h:13,rx:1},
      {k:"db",at:"wr1"}
    ],
  },
  "seated-calf-raise": {
    view: "side", labels: ["Stretch","Top"],
    frames: [
      {h:[90,112],t:-4,a1:[124,146],ft1:62,w1:[116,104]},
      {h:[90,112],t:-4,a1:[124.8,138.2],ft1:130,w1:[116,104]}
    ],
    props: [
      {k:"rect",x:62,y:117,w:50,h:6},
      {k:"seg",p1:[86,123],p2:[86,160],w:4},
      {k:"rect",x:128,y:145,w:26,h:15,rx:1},
      {k:"pad",at:"k1",off:[-5,-6.5],r:5}
    ],
  },
  "tibialis-raise": {
    view: "side", labels: ["Down","Up"],
    frames: [
      {h:[93,93],t:-22.3,a1:[118,154],ft1:95,w1:["sh",2,43]},
      {h:[93,93],t:-22.3,a1:[118,154],ft1:45,w1:["sh",2,43]}
    ],
    props: [
      {k:"rect",x:64,y:0,w:6,h:160,rx:1}
    ],
  },
  "romanian-deadlift": {
    view: "side", labels: ["Top","Stretch"],
    frames: [
      {h:[100,89],t:0,a1:[104,155],w1:["sh",3,43]},
      {h:[78,96],t:65,a1:[104,155],w1:[104,121]}
    ],
    props: [
      {k:"plate",at:"wr1",r:13}
    ],
  },
  "deadlift": {
    view: "side", labels: ["Start","Lockout"],
    frames: [
      {h:[76,123],t:62,a1:[104,155],w1:[110,146]},
      {h:[104,89],t:0,a1:[106,155],w1:["sh",3,43]}
    ],
    props: [
      {k:"plate",at:"wr1",off:[0,2],r:13}
    ],
  },
  "trap-bar-deadlift": {
    view: "side", labels: ["Start","Lockout"],
    frames: [
      {h:[76,122],t:50,a1:[106,155],w1:[108,139]},
      {h:[104,89],t:0,a1:[106,155],w1:["sh",2,44]}
    ],
    props: [
      {k:"plate",at:"wr1",off:[0,4],r:13}
    ],
  },
  "hip-thrust": {
    view: "side", labels: ["Bottom","Top"],
    frames: [
      {h:[96,140],t:-35,hd:-35,a1:[140,155],ft1:90,w1:["hip",4,-9]},
      {h:[116,108],t:-90,hd:-62,a1:[140,155],ft1:90,w1:["hip",4,-9]}
    ],
    props: [
      {k:"rect",x:26,y:112,w:50,h:48,rx:3},
      {k:"plate",at:"hip",off:[2,-13],r:13}
    ],
  },
  "prone-leg-curl": {
    view: "side", labels: ["Start","Curl"], thumb: 1, kb1: 1, eb1: -1,
    frames: [
      {h:[112,110],t:270,a1:[177,111],ft1:180,w1:[54,121]},
      {h:[112,110],t:270,a1:[134,82],ft1:67,w1:[54,121]}
    ],
    props: [
      {k:"rect",x:38,y:116,w:106,h:7},
      {k:"seg",p1:[50,123],p2:[50,160],w:4},
      {k:"seg",p1:[134,123],p2:[134,160],w:4},
      {k:"pad",seg:["k1","an1"],at:0.86,perp:-6.5,r:5,id:"roller"},
      {k:"seg",p1:[146,121],p2:"roller",w:3},
      {k:"handle",at:[54,121]}
    ],
  },
  "nordic-curl": {
    view: "side", labels: ["Top","Lower"],
    frames: [
      {h:[100,120],t:0,a1:[66,154],ft1:180,w1:["sh",12,14]},
      {h:[124,130],t:45,a1:[66,154],ft1:180,w1:["sh",18,20]}
    ],
    props: [
      {k:"rect",x:84,y:156,w:30,h:4,rx:1},
      {k:"pad",at:"an1",off:[0,-5.5],r:4.5}
    ],
  },
  "adductor-abductor": {
    view: "front", demoView: "Front view", labels: ["Open","Squeeze"], eb1: -1,
    frames: [
      {p:[110,112],k:["p",30,8],a:["p",30,42],w:["p",24,0]},
      {p:[110,112],k:["p",9,8],a:["p",10,42],w:["p",24,0]}
    ],
    props: [
      {k:"rect",x:90,y:60,w:40,h:56,rx:3},
      {k:"rect",x:80,y:116,w:60,h:6},
      {k:"seg",p1:[110,122],p2:[110,160],w:4},
      {k:"pad",at:"k1",off:[-5.5,0],r:4.5},
      {k:"pad",at:"k2",off:[5.5,0],r:4.5}
    ],
  },
  "bench-press": {
    view: "side", labels: ["Lockout","Chest"],
    frames: [
      {h:[112,108],t:270,a1:[142,155],ft1:90,w1:["sh",2,-43]},
      {h:[112,108],t:270,a1:[142,155],ft1:90,w1:["sh",13,-9]}
    ],
    props: [
      {k:"rect",x:44,y:115,w:96,h:6},
      {k:"seg",p1:[58,121],p2:[58,160],w:4},
      {k:"seg",p1:[126,121],p2:[126,160],w:4},
      {k:"plate",at:"wr1",r:13}
    ],
  },
  "incline-press": {
    view: "side", labels: ["Top","Bottom"],
    frames: [
      {h:[100,122],t:-55,a1:[138,155],ft1:90,w1:["sh",6,-43]},
      {h:[100,122],t:-55,a1:[138,155],ft1:90,w1:["sh",9,-6]}
    ],
    props: [
      {k:"seg",p1:[95,130],p2:[54,101],w:7},
      {k:"seg",p1:[92,132],p2:[118,132],w:7},
      {k:"seg",p1:[104,135],p2:[104,160],w:4},
      {k:"db",at:"wr1"}
    ],
  },
  "dips": {
    view: "side", labels: ["Top","Bottom"],
    frames: [
      {h:[106,72],t:12,a1:["hip",-10,50],w1:[118,74]},
      {h:[100,98],t:28,a1:["hip",-12,48],w1:[116,74]}
    ],
    props: [
      {k:"seg",p1:[94,77],p2:[140,77],w:4},
      {k:"seg",p1:[132,77],p2:[132,160],w:3}
    ],
  },
  "push-up": {
    view: "side", labels: ["Top","Bottom"],
    frames: [
      {h:[95.4,128.5],t:66.8,hd:85,a1:[36,150],ft1:156,w1:[134,156]},
      {h:[99.7,143.4],t:84,hd:100,a1:[36,150],ft1:156,w1:[134,156]}
    ],
    props: [],
  },
  "cable-fly": {
    view: "front", demoView: "Front view", labels: ["Open","Squeeze"],
    frames: [
      {p:[110,92],a:["p",12,63],e:["p",36,-48],w:["p",58,-46]},
      {p:[110,92],a:["p",12,63],e:["p",22,-36],w:["p",5,-30]}
    ],
    props: [
      {k:"rect",x:2,y:-10,w:10,h:170,rx:1},
      {k:"rect",x:208,y:-10,w:10,h:170,rx:1},
      {k:"cable",p1:[12,4],p2:"wr2"},
      {k:"cable",p1:[208,4],p2:"wr1"},
      {k:"handle",at:"wr1"},
      {k:"handle",at:"wr2"}
    ],
  },
  "pull-up": {
    view: "side", labels: ["Hang","Top"], ground: false,
    frames: [
      {h:[112,98],t:0,a1:["hip",-12,52],w1:[114,12]},
      {h:[107,56],t:-10,hd:-16,a1:["hip",-12,52],w1:[114,12]}
    ],
    props: [
      {k:"seg",p1:[86,12],p2:[150,12],w:4}
    ],
  },
  "lat-pulldown": {
    view: "side", labels: ["Stretch","Pull"],
    frames: [
      {h:[100,120],t:-10,a1:[132,155],w1:["sh",10,-43]},
      {h:[100,120],t:-14,a1:[132,155],w1:["sh",4,2]}
    ],
    props: [
      {k:"rect",x:76,y:125,w:44,h:6},
      {k:"seg",p1:[98,131],p2:[98,160],w:4},
      {k:"rect",x:118,y:107,w:24,h:7,rx:3},
      {k:"cable",p1:[112,-8],p2:"wr1"},
      {k:"handle",at:"wr1",r:3}
    ],
  },
  "seated-row": {
    view: "side", labels: ["Reach","Row"],
    frames: [
      {h:[80,128],t:28,a1:[142,128],ft1:0,w1:[136,100]},
      {h:[80,128],t:-6,a1:[142,128],ft1:0,w1:[92,106]}
    ],
    props: [
      {k:"rect",x:46,y:134,w:66,h:6},
      {k:"seg",p1:[54,140],p2:[54,160],w:4},
      {k:"seg",p1:[104,140],p2:[104,160],w:4},
      {k:"seg",p1:[148,108],p2:[148,146],w:5},
      {k:"rect",x:186,y:-10,w:12,h:170,rx:1},
      {k:"cable",p1:[188,118],p2:"wr1"},
      {k:"handle",at:"wr1"}
    ],
  },
  "bent-over-row": {
    view: "side", labels: ["Hang","Row"],
    frames: [
      {h:[82,93],t:65,a1:[104,155],w1:["sh",0,44]},
      {h:[82,93],t:65,a1:[104,155],w1:[106,95]}
    ],
    props: [
      {k:"plate",at:"wr1",r:13}
    ],
  },
  "t-bar-row": {
    view: "side", labels: ["Hang","Row"],
    frames: [
      {h:[84,98],t:52,hd:40,a1:[102,155],w1:["sh",2,44]},
      {h:[84,98],t:52,hd:40,a1:[102,155],w1:[110,100]}
    ],
    props: [
      {k:"seg",p1:[108,94],p2:[124,160],w:4},
      {k:"seg",p1:[100.3,99.3],p2:[116,87],w:8},
      {k:"rect",x:164,y:148,w:14,h:12,rx:1},
      {k:"seg",p1:[171,152],p2:"wr1",w:3.5},
      {k:"plate",at:"wr1",toward:[171,152],dist:14,r:13},
      {k:"handle",at:"wr1",r:3}
    ],
  },
  "back-extension": {
    view: "side", labels: ["Bottom","Top"],
    frames: [
      {h:[110,92],t:160,a1:[66,140],ft1:132,w1:[114.3,121.4]},
      {h:[110,92],t:42.5,a1:[66,140],ft1:132,w1:[134,74.7]}
    ],
    props: [
      {k:"seg",p1:[108,112],p2:[96,160],w:4},
      {k:"seg",p1:[58,146],p2:[58,160],w:4},
      {k:"seg",p1:[117.3,96],p2:[105.1,109.2],w:8},
      {k:"seg",at:"an1",off:[-2,2.2],ang:132,len:16,w:4},
      {k:"pad",at:"an1",off:[-4.5,-4],r:3.6}
    ],
  },
  "shoulder-press": {
    view: "front", demoView: "Front view", labels: ["Bottom","Top"], eb1: 1,
    frames: [
      {p:[110,114],k:["p",14,10],a:["p",16,42],w:["p",26,-56]},
      {p:[110,114],k:["p",14,10],a:["p",16,42],w:["p",12,-100]}
    ],
    props: [
      {k:"rect",x:92,y:56,w:36,h:60,rx:3},
      {k:"rect",x:84,y:118,w:52,h:6},
      {k:"seg",p1:[110,124],p2:[110,160],w:4},
      {k:"dbh",at:"wr1"},
      {k:"dbh",at:"wr2"}
    ],
  },
  "cable-lateral-raise": {
    view: "front", demoView: "Front view", labels: ["Start","Raise"], eb1: -1,
    frames: [
      {p:[110,92],a:["p",12,63],w:["p",20,10],w2:["p",-14,2]},
      {p:[110,92],a:["p",12,63],w:["p",56,-36],w2:["p",-14,2]}
    ],
    props: [
      {k:"rect",x:18,y:96,w:12,h:64,rx:1},
      {k:"cable",p1:[30,150],p2:"wr1"},
      {k:"handle",at:"wr1"}
    ],
  },
  "rear-delt-fly": {
    view: "front", demoView: "Front view, bent over", labels: ["Hang","Raise"], to: 30, headUp: 4, eb1: -1,
    frames: [
      {p:[110,94],a:["p",12,61],w:["p",16,16]},
      {p:[110,94],a:["p",12,61],w:["p",56,-22]}
    ],
    props: [
      {k:"db",at:"wr1"},
      {k:"db",at:"wr2"}
    ],
  },
  "face-pull": {
    view: "side", labels: ["Reach","Pull"],
    frames: [
      {h:[98,89],t:-6,a1:[102,155],a2:[86,155],ft2:115,e1:["sh",22,-1],w1:["sh",43,-3]},
      {h:[98,89],t:-6,a1:[102,155],a2:[86,155],ft2:115,e1:["sh",-2,-2],w1:["sh",2,-20]}
    ],
    props: [
      {k:"rect",x:178,y:-10,w:10,h:170,rx:1},
      {k:"cable",p1:[178,36],p2:"wr1"},
      {k:"handle",at:"wr1",r:3}
    ],
  },
  "y-raise": {
    view: "side", labels: ["Hang","Raise"],
    frames: [
      {h:[80,112],t:55,hd:75,a1:[50,155],w1:["sh",2,44]},
      {h:[80,112],t:55,hd:75,a1:[50,155],w1:["sh",36,-25]}
    ],
    props: [
      {k:"seg",p1:[85.7,120.2],p2:[110.3,103],w:7},
      {k:"seg",p1:[90,124],p2:[90,160],w:4},
      {k:"seg",p1:[104,112],p2:[112,160],w:4},
      {k:"db",at:"wr1"}
    ],
  },
  "shrug": {
    view: "front", demoView: "Front view", labels: ["Down","Shrug"], eb1: -1,
    frames: [
      {p:[110,92],a:["p",12,63],w:["p",17,9],shrug:0},
      {p:[110,92],a:["p",12,63],w:["p",17,3],shrug:6}
    ],
    props: [
      {k:"db",at:"wr1"},
      {k:"db",at:"wr2"}
    ],
  },
  "neck-training": {
    view: "side", labels: ["Down","Up"], eb1: 1,
    frames: [
      {h:[130,110],t:270,hd:250,a1:[160,155],ft1:90,w1:["sh",-9,-9]},
      {h:[130,110],t:270,hd:305,a1:[160,155],ft1:90,w1:["sh",-7,-15]}
    ],
    props: [
      {k:"rect",x:90,y:116,w:82,h:6},
      {k:"seg",p1:[100,122],p2:[100,160],w:4},
      {k:"seg",p1:[164,122],p2:[164,160],w:4},
      {k:"plate",at:"wr1",off:[-1,-1],r:6.5}
    ],
  },
  "biceps-curl": {
    view: "side", labels: ["Bottom","Top"],
    frames: [
      {h:[106,89],t:0,a1:[108,155],w1:["sh",4,43]},
      {h:[106,89],t:0,a1:[108,155],w1:["sh",10,3]}
    ],
    props: [
      {k:"db",at:"wr1"}
    ],
  },
  "hammer-curl": {
    view: "side", labels: ["Bottom","Top"],
    frames: [
      {h:[106,89],t:0,a1:[108,155],w1:["sh",4,43]},
      {h:[106,89],t:0,a1:[108,155],w1:["sh",10,3]}
    ],
    props: [
      {k:"rod",at:"wr1"}
    ],
  },
  "reverse-curl": {
    view: "side", labels: ["Bottom","Top"],
    frames: [
      {h:[106,89],t:0,a1:[108,155],w1:["sh",4,43]},
      {h:[106,89],t:0,a1:[108,155],w1:["sh",10,3]}
    ],
    props: [
      {k:"plate",at:"wr1",r:9}
    ],
  },
  "triceps-extension": {
    view: "side", labels: ["Stretch","Lockout"], eb1: 1, eb2: 1,
    frames: [
      {h:[106,89],t:0,a1:[108,155],w1:["sh",-10,-5],w2:["sh",2,43]},
      {h:[106,89],t:0,a1:[108,155],w1:["sh",3,-44],w2:["sh",2,43]}
    ],
    props: [
      {k:"db",at:"wr1"}
    ],
  },
  "triceps-pushdown": {
    view: "side", labels: ["Start","Lockout"], eb1: 1, eb2: 1,
    frames: [
      {h:[104,89],t:8,a1:[108,155],w1:["sh",20,14],w2:["sh",2,43]},
      {h:[104,89],t:8,a1:[108,155],w1:["sh",7,43],w2:["sh",2,43]}
    ],
    props: [
      {k:"rect",x:154,y:-10,w:10,h:170,rx:1},
      {k:"cable",p1:[154,-2],p2:"wr1"},
      {k:"handle",at:"wr1"}
    ],
  },
  "farmers-carry": {
    view: "side", labels: ["Step","Step"],
    frames: [
      {h:[106,92],t:0,a1:[120,155],a2:[92,155],ft1:95,ft2:120,w1:["sh",2,43]},
      {h:[106,92],t:0,a1:[92,155],a2:[120,155],ft1:120,ft2:95,w1:["sh",2,43]}
    ],
    props: [
      {k:"rod",at:"wr1"}
    ],
  },
  "cable-crunch": {
    view: "side", labels: ["Top","Crunch"],
    frames: [
      {h:[100,122],t:12,a1:[68,156],ft1:265,w1:["sh",6,-8]},
      {h:[100,122],t:80,hd:130,a1:[68,156],ft1:265,w1:["sh",8,-1]}
    ],
    props: [
      {k:"rect",x:168,y:-10,w:10,h:170,rx:1},
      {k:"cable",p1:[168,-4],p2:"wr1"},
      {k:"handle",at:"wr1",r:3}
    ],
  },
  "hanging-leg-raise": {
    view: "side", labels: ["Hang","Raise"], ground: false,
    frames: [
      {h:[112,98],t:0,a1:["hip",2,65],w1:[114,12]},
      {h:[108,96],t:-8,a1:["hip",64,-2],w1:[114,12]}
    ],
    props: [
      {k:"seg",p1:[86,12],p2:[150,12],w:4}
    ],
  },
  "cable-chop": {
    view: "front", demoView: "Front view", labels: ["High","Low"], eb1: -1,
    frames: [
      {p:[112,90],tilt:-6,a:[130,155],a2:[90,155],w:[72,18],w2:[70,22]},
      {p:[108,92],tilt:8,a:[130,155],a2:[90,155],w:[150,104],w2:[146,100]}
    ],
    props: [
      {k:"rect",x:16,y:-10,w:10,h:170,rx:1},
      {k:"cable",p1:[28,4],p2:"mid:wr1:wr2"},
      {k:"handle",at:"mid:wr1:wr2",r:3.2}
    ],
  },
  "barbell-clean": {
    view: "side", labels: ["Start","Extension","Catch"], thumb: 2,
    frames: [
      {h:[78,123],t:60,a1:[104,155],w1:[112,146]},
      {h:[102,84],t:-8,a1:[106,148],ft1:125,w1:["sh",4,43]},
      {h:[96,106],t:8,a1:[104,155],w1:["sh",6,-6]}
    ],
    props: [
      {k:"plate",at:"wr1",off:[0,2],r:13}
    ],
  },
  "band-pass-through": {
    view: "front", demoView: "Front view", labels: ["Down","Side","Overhead"], eb1: -1,
    frames: [
      {p:[110,92],a:["p",12,63],w:["p",40,4]},
      {p:[110,92],a:["p",12,63],w:["p",58,-40]},
      {p:[110,92],a:["p",12,63],w:["p",42,-92]}
    ],
    props: [
      {k:"band",p1:"wr1",p2:"wr2"}
    ],
  },
  "cable-external-rotation": {
    view: "front", demoView: "Front view", labels: ["In","Out"],
    frames: [
      {p:[110,92],a:["p",12,63],e:["p",17,-20],w:["p",3,-17],e2:["p",-16,-20],w2:["p",-18,2]},
      {p:[110,92],a:["p",12,63],e:["p",17,-20],w:["p",36,-19],e2:["p",-16,-20],w2:["p",-18,2]}
    ],
    props: [
      {k:"rect",x:28,y:-10,w:10,h:170,rx:1},
      {k:"cable",p1:[38,72],p2:"wr1"},
      {k:"handle",at:"wr1"}
    ],
  },
  "triceps-stretch": {
    view: "side", labels: ["Reach","Stretch"], eb1: 1, eb2: 1,
    frames: [
      {h:[106,89],t:0,a1:[108,155],w1:["sh",3,-44],w2:["sh",2,43]},
      {h:[106,89],t:0,a1:[108,155],w1:["sh",-10,-5],w2:["sh",3,-21]}
    ],
    props: [],
  },
  "pronation-supination": {
    view: "front", demoView: "Front view", labels: ["Palm down","Palm up"],
    frames: [
      {p:[110,92],a:["p",12,63],e:["p",17,-20],w:["p",21,-9],e2:["p",-16,-20],w2:["p",-18,2],rot:-70},
      {p:[110,92],a:["p",12,63],e:["p",17,-20],w:["p",21,-9],e2:["p",-16,-20],w2:["p",-18,2],rot:70}
    ],
    props: [
      {k:"dbrot",at:"wr1"}
    ],
  },
  "wrist-stretch": {
    view: "side", labels: ["Fingers up","Fingers down"], eb2: 1,
    frames: [
      {h:[106,89],t:0,a1:[108,155],w1:["sh",44,0],ha:0,w2:["sh",38,-5]},
      {h:[106,89],t:0,a1:[108,155],w1:["sh",44,0],ha:180,w2:["sh",38,6]}
    ],
    props: [],
  },
  "wrist-curl": {
    view: "side", labels: ["Down","Curl"],
    frames: [
      {h:[86,112],t:40,a1:[124,150],e1:[110,108],w1:[130,111],ha:150},
      {h:[86,112],t:40,a1:[124,150],e1:[110,108],w1:[130,111],ha:45}
    ],
    props: [
      {k:"rect",x:58,y:116,w:48,h:6},
      {k:"seg",p1:[80,122],p2:[80,160],w:4},
      {k:"db",at:"hand1"}
    ],
  },
  "hip-flexor-stretch": {
    view: "side", labels: ["Set","Stretch"],
    frames: [
      {h:[96,122],t:-2,a1:[132,155],a2:[62,154],ft2:265,w1:["sh",2,43]},
      {h:[106,124],t:0,a1:[132,155],a2:[62,154],ft2:265,w1:["sh",2,43]}
    ],
    props: [
      {k:"rect",x:80,y:156,w:26,h:4,rx:1}
    ],
  },
  "cossack-squat": {
    view: "front", demoView: "Front view", labels: ["Right","Left"],
    frames: [
      {p:[132,120],a:[150,155],a2:[70,155],e:["p",32,-30],w:["p",48,-22]},
      {p:[88,120],a:[150,155],a2:[70,155],e:["p",32,-30],w:["p",48,-22]}
    ],
    props: [],
  },
  "terminal-knee-extension": {
    view: "side", labels: ["Bent","Lockout"],
    frames: [
      {h:[110,93],t:0,a1:[118,155],a2:[94,155],ft2:115,w1:["sh",2,43]},
      {h:[113,90],t:0,a1:[118,155],a2:[94,155],ft2:115,w1:["sh",2,43]}
    ],
    props: [
      {k:"rect",x:176,y:100,w:6,h:60,rx:1},
      {k:"band",p1:[176,124],p2:"k1"}
    ],
  },
  "spanish-squat": {
    view: "side", labels: ["Stand","Sit"],
    frames: [
      {h:[104,89],t:0,a1:[104,155],w1:["sh",2,43]},
      {h:[70,124],t:22,a1:[104,155],w1:["sh",40,4]}
    ],
    props: [
      {k:"rect",x:176,y:96,w:6,h:64,rx:1},
      {k:"band",p1:[176,123],p2:"k1"}
    ],
  },
  "knee-to-wall": {
    view: "side", labels: ["Back","Knee to wall"],
    frames: [
      {h:[106,98],t:10,a1:[132,155],a2:[86,151],ft2:125,w1:[148,88]},
      {h:[114,106],t:10,a1:[132,155],a2:[86,151],ft2:125,w1:[148,88]}
    ],
    props: [
      {k:"rect",x:150,y:-10,w:6,h:170,rx:1}
    ],
  },
  "calf-stretch": {
    view: "side", labels: ["Set","Lean"],
    frames: [
      {h:[106,98],t:14,a1:[134,155],a2:[74,155],ft2:95,w1:[150,74]},
      {h:[112,102],t:18,a1:[134,155],a2:[74,155],ft2:95,w1:[150,74]}
    ],
    props: [
      {k:"rect",x:152,y:-10,w:6,h:170,rx:1}
    ],
  },
  "thoracic-extension": {
    view: "side", labels: ["Curl","Extend"], eb1: 1,
    frames: [
      {h:[124,152],t:-60,hd:-40,a1:[152,155],w1:["sh",-9,-9],arch:0},
      {h:[124,152],t:-75,hd:-100,a1:[152,155],w1:["sh",-13,-2],arch:-8}
    ],
    props: [
      {k:"pad",at:[100,151.5],r:8,layer:"back"}
    ],
  },
  "thread-the-needle": {
    view: "side", labels: ["Under","Up"],
    frames: [
      {h:[80,118],t:85,hd:150,a1:[48,155],ft1:265,w1:["sh",-26,30],w2:[122,156]},
      {h:[80,118],t:85,hd:30,a1:[48,155],ft1:265,w1:["sh",2,-44],w2:[122,156]}
    ],
    props: [],
  },
  "band-pull-apart": {
    view: "front", demoView: "Front view", labels: ["Together","Apart"],
    frames: [
      {p:[110,92],a:["p",12,63],e:["p",14,-38],w:["p",6,-39]},
      {p:[110,92],a:["p",12,63],e:["p",36,-41],w:["p",58,-41]}
    ],
    props: [
      {k:"band",p1:"wr1",p2:"wr2"}
    ],
  },
  "wall-slide": {
    view: "front", demoView: "Front view", labels: ["W","Y"],
    frames: [
      {p:[110,92],a:["p",12,63],e:["p",32,-36],w:["p",34,-58]},
      {p:[110,92],a:["p",12,63],e:["p",26,-62],w:["p",36,-88]}
    ],
    props: [
      {k:"rect",x:62,y:-10,w:96,h:170,rx:2}
    ],
  },
  "cat-cow": {
    view: "side", labels: ["Cow","Cat"],
    frames: [
      {h:[80,118],t:85,hd:55,a1:[48,155],ft1:265,w1:[122,156],arch:-5},
      {h:[80,118],t:85,hd:150,a1:[48,155],ft1:265,w1:[122,156],arch:7}
    ],
    props: [],
  },
  "bird-dog": {
    view: "side", labels: ["Base","Reach"],
    frames: [
      {h:[80,118],t:85,hd:85,a1:[48,155],a2:[48,155],ft1:265,ft2:265,w1:[122,156],w2:[122,156]},
      {h:[80,118],t:85,hd:85,a1:[48,155],a2:["hip",-66,-2],ft1:265,ft2:265,w1:["sh",44,-3],w2:[122,156]}
    ],
    props: [],
  },
};
