import * as THREE from 'three';

/** Each façade is reconstructed separately from its elevation openings.
 * Wall shapes contain real holes: glazing is not pasted over opaque walls.
 * Window coordinates live in facade.json and follow the drawing's scale.
 */
export async function buildOffice({massing,facade,style,loader,asset,box,wire,line,world}){
const office=new THREE.Group();office.name='office';world.add(office);
const floors=[],facadeMaterials=[],slabMaterials=[],planMaterials=[],facadeObjects=[];
const [w,d]=massing.office.size;
const wallMat=new THREE.MeshStandardMaterial({color:'#eeeeea',roughness:.86,transparent:true});
const glassMat=new THREE.MeshStandardMaterial({color:facade.glassColor,roughness:.24,metalness:.2,transparent:true});
const frameMat=new THREE.MeshStandardMaterial({color:facade.frameColor,roughness:.6,metalness:.3,transparent:true});
const seamMat=new THREE.LineBasicMaterial({color:'#a6afaa',transparent:true,opacity:.48});
const baseOpacity=new WeakMap();
function orient(side,mesh){if(side==='south'){mesh.position.z=d/2;}if(side==='north'){mesh.rotation.y=Math.PI;mesh.position.z=-d/2;}if(side==='east'){mesh.rotation.y=Math.PI/2;mesh.position.x=w/2;}if(side==='west'){mesh.rotation.y=-Math.PI/2;mesh.position.x=-w/2;}}
const toU=(side,u)=>side==='north'||side==='east'?-u:u;
for(const f of massing.office.floors){
 const g=new THREE.Group();g.name=`floor-${f.level}`;g.position.y=f.y;office.add(g);floors.push(g);
 const slab=box([w,.2,d],[0,.07,0],'#e4e6df',g);wire(slab);slabMaterials.push(slab.material);
 const tex=await loader.loadAsync(asset(f.texture));tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
 const pm=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false});const p=new THREE.Mesh(new THREE.PlaneGeometry(w,d),pm);p.rotation.x=-Math.PI/2;p.position.y=.175;g.add(p);planMaterials.push(pm);
 const fg=new THREE.Group();fg.name=`facades-${f.level}`;g.add(fg);facadeObjects.push(fg);const mats=[];
 const register=(m,opacity=1)=>{mats.push(m);baseOpacity.set(m,opacity);return m;};
 for(const side of ['south','north','east','west']){
  const width=(side==='south'||side==='north')?w:d;
  const windows=(facade.walls[side][String(f.level)]||[]).map(win=>({...win,u:toU(side,win.u),height:Math.min(win.height,f.height-win.bottom-.015)}));
  const shape=new THREE.Shape();shape.moveTo(-width/2,0);shape.lineTo(width/2,0);shape.lineTo(width/2,f.height);shape.lineTo(-width/2,f.height);shape.closePath();
  for(const win of windows){const x=win.u-win.width/2,y=win.bottom;const hole=new THREE.Path();hole.moveTo(x,y);hole.lineTo(x,y+win.height);hole.lineTo(x+win.width,y+win.height);hole.lineTo(x+win.width,y);hole.closePath();shape.holes.push(hole);}
  const geo=new THREE.ExtrudeGeometry(shape,{depth:facade.wallThickness,bevelEnabled:false,curveSegments:1});const material=register(wallMat.clone());const wall=new THREE.Mesh(geo,material);wall.name=`${side}-wall-${f.level}`;wall.castShadow=true;wall.receiveShadow=true;orient(side,wall);fg.add(wall);
  const local=new THREE.Group();orient(side,local);fg.add(local);
  for(const win of windows){
   const gm=register(glassMat.clone());const glass=new THREE.Mesh(new THREE.PlaneGeometry(win.width,win.height),gm);glass.position.set(win.u,win.bottom+win.height/2,.052);glass.name=`${side}-${win.vertical?'vertical-':'window-'}${f.level}`;glass.material.side=THREE.DoubleSide;local.add(glass);
   const fm=register(frameMat.clone());const fw=facade.frameWidth;
   const member=(size,pos)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(...size),fm);b.position.set(...pos);local.add(b);};
   for(const x of [win.u-win.width/2,win.u+win.width/2])member([fw,win.height+.08,.055],[x,win.bottom+win.height/2,.12]);
   for(const y of [win.bottom,win.bottom+win.height])member([win.width+fw,fw,.055],[win.u,y,.12]);
   for(let i=1;i<win.divisions;i++)member([fw*.72,win.height,.035],[win.u-win.width/2+win.width*i/win.divisions,win.bottom+win.height/2,.115]);
   if(win.vertical){const y=win.bottom+win.height*.56;member([win.width,fw*.72,.04],[win.u,y,.12]);}
   if(win.transom){const a=toU(side,win.transom.from),b=toU(side,win.transom.to);member([Math.abs(b-a),fw*.72,.04],[(a+b)/2,win.transom.height,.12]);}
   if(win.service){glass.material.color.set('#bec4c3');}
   if(win.opaque){glass.material.color.set('#8b9390');glass.material.roughness=.75;glass.material.metalness=.05;}
  }
  // Panel seams are cut at openings; they do not run through the glass.
  const positions=[];
  for(let absolute=.5;absolute<13;absolute+=facade.panelPitch){const y=absolute-f.y;if(y<=.04||y>=f.height-.04)continue;const obstacles=windows.filter(win=>y>win.bottom&&y<win.bottom+win.height).map(win=>[win.u-win.width/2,win.u+win.width/2]).sort((a,b)=>a[0]-b[0]);let x=-width/2;for(const [a,b]of obstacles){if(a>x)positions.push(x,y,.155,a,y,.155);x=Math.max(x,b);}if(x<width/2)positions.push(x,y,.155,width/2,y,.155);}
  const sm=register(seamMat.clone(),.48);const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));local.add(new THREE.LineSegments(sg,sm));
 }
 facadeMaterials.push(mats);
}
// First-floor canopy is a perimeter band with an open centre, not a solid
// floor-sized plate blocking the floor plans when the model is exploded.
const canopy=new THREE.Group();canopy.name='perimeter-canopy';office.add(canopy);canopy.position.y=facade.canopy.height;
const cp=facade.canopy.projection,ct=facade.canopy.thickness;
for(const z of [-d/2-cp/2,d/2+cp/2]){const m=box([w+2*cp,ct,cp],[0,0,z],'#9fa3a0',canopy);wire(m,0x7e8682);}
for(const x of [-w/2-cp/2,w/2+cp/2]){const m=box([cp,ct,d],[x,0,0],'#9fa3a0',canopy);wire(m,0x7e8682);}
const base=box([w+.3,.45,d+.3],[0,.22,0],'#d3d6ce',office);
const logoTex=await loader.loadAsync(asset(facade.logo.asset));logoTex.colorSpace=THREE.SRGBColorSpace;
const signY=facade.logo.y-massing.office.floors[2].y;
// A closed, shallow sign substrate prevents the raster's transparency from
// reading as a hole in the façade. The face uses the supplied mark and wordmark.
const backing=box([.035,facade.logo.height,facade.logo.width],[w/2+.185,signY,facade.logo.u],'#eeeeea',floors[2]);facadeMaterials[2].push(backing.material);baseOpacity.set(backing.material,1);
const lm=new THREE.MeshStandardMaterial({map:logoTex,color:'#ffffff',roughness:.86,transparent:true,opacity:1,depthWrite:true,side:THREE.FrontSide,polygonOffset:true,polygonOffsetFactor:-1});const logo=new THREE.Mesh(new THREE.PlaneGeometry(facade.logo.width,facade.logo.height),lm);logo.rotation.y=Math.PI/2;logo.position.set(w/2+.208,signY,facade.logo.u);logo.name='solid-sign-face';floors[2].add(logo);facadeMaterials[2].push(lm);baseOpacity.set(lm,1);
const roof=new THREE.Group();roof.name='roof';roof.position.y=massing.office.roofY;office.add(roof);const rm=[];
const roofBox=(s,p,c)=>{const m=box(s,p,c,roof);rm.push(m.material);return m;};
roofBox([w+.2,.2,d+.2],[0,.1,0],'#e9e9e3');
// Thin roof railing and west-side equipment enclosure.
for(const z of [-d/2,d/2]){roofBox([w,.035,.035],[0,.75,z],'#86918d');for(let x=-w/2;x<=w/2;x+=1.6)roofBox([.035,.6,.035],[x,.45,z],'#8b9591');}
for(const x of [-w/2,w/2]){roofBox([.035,.035,d],[x,.75,0],'#86918d');for(let z=-d/2;z<=d/2;z+=1.5)roofBox([.035,.6,.035],[x,.45,z],'#8b9591');}
const screen=facade.roofScreen;const cx=(screen.xMin+screen.xMax)/2,sw=screen.xMax-screen.xMin,sh=screen.height;
const louverHeight=screen.bladeHeight??.115,louverPitch=screen.bladePitch??.19;
for(const z of [screen.zMin,screen.zMax]){
 for(let y=.12;y<sh;y+=louverPitch)roofBox([sw,louverHeight,.13],[cx,y,z],'#a5aea7');
 for(let x=screen.xMin+.1;x<=screen.xMax;x+=2.8)roofBox([.04,sh,.05],[x,sh/2,z-Math.sign(z)*.12],'#bcc4bd');
}
for(const x of [screen.xMin,screen.xMax]){
 for(let y=.12;y<sh;y+=louverPitch)roofBox([.13,louverHeight,screen.zMax-screen.zMin],[x,y,0],'#a5aea7');
 for(let z=screen.zMin+.1;z<=screen.zMax;z+=2.8)roofBox([.05,sh,.04],[x-Math.sign(x-cx)*.12,sh/2,z],'#bcc4bd');
}
const equipment=new THREE.Group();equipment.name='rooftop-equipment';roof.add(equipment);
const equipmentData=facade.roofEquipment;
for(const row of equipmentData.rows){
 const [bw,bh,bd]=row.size;
 for(let i=0;i<row.count;i++){
  const x=row.startX+i*row.stepX,z=row.z;
  const m=box([bw,bh,bd],[x,row.baseHeight+bh/2,z],'#e7e9e4',equipment);m.name=`${row.id}-${i+1}`;wire(m);
  for(const sx of [-1,1])box([.12,row.baseHeight,.12],[x+sx*(bw/2-.15),row.baseHeight/2,z],'#bcc4bc',equipment);
 }
}
const eb=equipmentData.cubicle;const cubicle=box(eb.size,eb.center,'#dce1d7',equipment);cubicle.name='equipment-cubicle';wire(cubicle);
const eh=equipmentData.stairHead;roofBox(eh.size,eh.center,'#e9eae5');
return {office,floors,facadeMaterials,slabMaterials,planMaterials,canopy,base,roof,rm,equipment,baseOpacity,facadeObjects};
}
