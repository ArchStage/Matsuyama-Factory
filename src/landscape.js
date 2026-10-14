import * as THREE from 'three';

/** Placement derived from p16; physical character checked against aerial CG. */
export function buildLandscape({data,massing,world,box,wire,line}){
const context=new THREE.Group();context.name='site-and-landscape';world.add(context);
const groundColor='#dde0d6',asphalt='#c1c6c1',walkColor='#e3dfd4',grass='#bac8a4',shrubColor='#91a780';
const surface=(size,position,color)=>box([size[0],.08,size[1]],[position[0],.025,position[1]],color,context);
const [xa,xb]=data.pavedExtent.x,[za,zb]=data.pavedExtent.z;
box([xb-xa,.22,zb-za],[(xa+xb)/2,-.14,(za+zb)/2],groundColor,context);
data.roads.forEach(r=>surface(r.size,r.center,asphalt));data.walks.forEach(r=>{const m=surface(r.size,r.center,walkColor);m.position.y=.065;});
function tube(points,radius,color,parent=context){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,12,radius,5,false),new THREE.MeshStandardMaterial({color,roughness:.6}));parent.add(mesh);return mesh;}
function plant(x,z,height=3.4,radius=1.0){const g=new THREE.Group();g.position.set(x,.12,z);context.add(g);const trunk=box([.085,height*.65,.085],[0,height*.325,0],'#9da58c',g);trunk.castShadow=false;const material=new THREE.MeshStandardMaterial({color:'#a6b894',roughness:1,flatShading:true});for(const [dx,dy,dz,s] of [[0,height*.78,0,1],[-.42,height*.66,.25,.58],[.38,height*.68,-.18,.64],[.15,height*.93,.1,.54]]){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(radius*s,1),material);m.position.set(dx,dy,dz);m.scale.y=1.2;m.castShadow=true;g.add(m);}}
function bed(b){const [x,z]=b.center,[w,d]=b.size;surface([w,d],[x,z],grass);for(const a of [-1,1]){box([w,.13,.07],[x,.13,z+a*d/2],'#cdd2c6',context);box([.07,.13,d],[x+a*w/2,.13,z],'#cdd2c6',context);}const material=new THREE.MeshStandardMaterial({color:shrubColor,roughness:1,flatShading:true});for(let i=0;i<Math.ceil(w/.5);i++)for(let j=0;j<Math.ceil(d/.5);j++){const q=new THREE.Mesh(new THREE.IcosahedronGeometry(.3,0),material);q.position.set(x-w/2+.25+i*.5,.32,z-d/2+.25+j*.5);q.scale.set(1.3,.7,1.3);context.add(q);}if(b.trees)b.trees.forEach(tx=>plant(tx,z,b.id.startsWith('north')?2.3:2.8,.65));if(b.treeZ)b.treeZ.forEach(tz=>plant(x,tz,b.id.startsWith('entry')?3.7:2.6,b.id.startsWith('entry')?.75:.6));}
data.beds.forEach(bed);
// The higher entry platform is separated from the GL+100 walks by long ramps.
for(const p of data.landings){const m=box([p.size[0],p.height,p.size[1]],[p.center[0],p.height/2,p.center[1]],walkColor,context);wire(m,0xa5ae9f);}
const rampMeshes=[];
for(const r of data.ramps){const [x0,y0,z0]=r.from,[x1,y1,z1]=r.to,w=r.width;const points=[x0-w/2,y0,z0,x0+w/2,y0,z0,x1+w/2,y1,z1,x1-w/2,y1,z1,x0-w/2,.06,z0,x0+w/2,.06,z0,x1+w/2,.06,z1,x1-w/2,.06,z1];const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.setIndex([0,2,1,0,3,2,0,4,7,0,7,3,1,2,6,1,6,5,3,7,6,3,6,2,0,1,5,0,5,4]);g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:walkColor,roughness:.9,side:THREE.DoubleSide}));m.name=r.id;m.receiveShadow=true;context.add(m);rampMeshes.push(m);
 for(const side of [-1,1]){const x=x0+side*(w/2+.04);tube([[x,y0+.8,z0],[x,y1+.8,z1]],.025,'#929f98');const distance=Math.abs(z1-z0),count=Math.ceil(distance/1.25);for(let j=0;j<=count;j++){const t=j/count,z=z0+(z1-z0)*t,y=y0+(y1-y0)*t;box([.035,.78,.035],[x,y+.39,z],'#939e97',context);}tube([[x,y0+.1,z0],[x,y1+.1,z1]],.03,'#c2c7be');}
 for(let j=1;j<16;j++){const t=j/16;line([[x0-w/2+.08,y0+(y1-y0)*t+.006,z0+(z1-z0)*t],[x0+w/2-.08,y0+(y1-y0)*t+.006,z0+(z1-z0)*t]],'#c4c8be',context);}
}
// Low entry steps between the planting interruptions, visible in the aerial.
for(let i=0;i<3;i++)box([.38,.13*(3-i),1.65],[20.39+i*.38,.1+.065*(3-i),-1.1],walkColor,context);
const pv=data.visitorParking;
function car(x,z,rot=0){const g=new THREE.Group();g.position.set(x,.12,z);g.rotation.y=rot;context.add(g);box([1.72,.55,4.0],[0,.38,0],'#e7e9e2',g);box([1.46,.52,1.9],[0,.88,-.12],'#a1b6b9',g);for(let a of [-.89,.89])for(let b of [-1.24,1.24]){const t=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.14,10),new THREE.MeshStandardMaterial({color:'#747d75'}));t.rotation.z=Math.PI/2;t.position.set(a,.28,b);g.add(t);}}
for(let i=0;i<pv.count;i++){const z=pv.zStart+i*pv.spacing;surface([pv.width,pv.depth],[pv.centerX,z],grass);for(const v of [-1,1])box([pv.width,.02,.045],[pv.centerX,.12,z+v*pv.depth/2],'#f7f7f0',context);for(let j=0;j<6;j++)box([.38,.035,.2],[pv.centerX-pv.width/2+.6+j*.68,.12,z],'#e0e4d5',context);if(i===0||i===3||i===4)car(pv.centerX,z,Math.PI/2);}
for(const row of data.staffParking){for(let i=0;i<row.count;i++){const x=row.xStart+i*row.spacing;surface([row.spacing-.05,5.0],[x,row.z],grass);box([.04,.022,5.0],[x+row.spacing/2,.12,row.z],'#f7f7f0',context);if(i%5===1)car(x,row.z);}}
// Bicycle rows and the perimeter planted edge follow the plan, not arbitrary spacing.
for(const c of data.bicycleCanopies){const [x,z]=c.center,[w,d]=c.size;surface([w+.5,d+.5],[x,z],'#d6c8b6');box([w,.09,d],[x,2.35,z],'#baa98c',context);for(const a of [-1,1])for(const b of [-1,1])box([.09,2.2,.09],[x+a*(w/2-.3),1.15,z+b*(d/2-.35)],'#8e9488',context);}
for(let z=-13;z<34;z+=2.8)plant(49.2,z,2.1,.45);
for(let x=-27;x<49;x+=3.4)plant(x,-27.1,4.5+((Math.round(x)*13)%3)*.13,1.35);
for(const c of data.crosswalks){const [x,z]=c.center,[w,d]=c.size;const axis=c.direction==='z'?d:w,count=Math.floor(axis/.66);for(let i=0;i<count;i++){const t=-axis/2+.35+i*.66;box(c.direction==='z'?[w,.015,.25]:[.25,.015,d],c.direction==='z'?[x,.12,z+t]:[x+t,.12,z],'#f8f8f1',context);}}
// Gate and pedestrian strip align with the eastern site entrance.
for(const z of [-24,-13.5])box([.4,1.3,2],[49.2,.65,z],'#cbd0c4',context);
box([1.6,.12,8],[47.3,.08,-18.2],walkColor,context);
const changing=new THREE.Group();changing.position.set(...massing.changing.center);changing.name='changing-room-building';context.add(changing);const [cw,cd]=massing.changing.size;
wire(box([cw,7.8,cd],[0,3.9,0],'#efeee9',changing));box([cw+.6,.18,cd+.6],[0,7.87,0],'#e0e0d6',changing);
for(let y=.5;y<7.8;y+=.6)for(let z of [-cd/2,cd/2])line([[-cw/2,y,z*1.001],[cw/2,y,z*1.001]],'#b2bbb0',changing);
for(let x of [-cw/2-.04,cw/2+.04]){for(const [z,y,h,w] of [[2,1.8,2.6,1.4],[-2,1.8,1.4,1.7],[5,5.4,1.2,1.5],[-4,5.4,.5,1.5]])box([.05,h,w],[x,y,z],'#afc2c5',changing);}
box([cw+1,.14,2.2],[0,3.05,-cd/2-.6],'#b3b5a8',changing);for(let x of [-cw/2,cw/2])box([.1,3,.1],[x,1.5,-cd/2-1.5],'#a6af9e',changing);
return {context,rampMeshes,changing};
}
