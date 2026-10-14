import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Merge static pieces with identical surface properties. Keep animated groups
// (individual floors and equipment) separate so seeking stays deterministic.
export function batchStatic(group,{exclude=[]}={}){
 group.updateWorldMatrix(true,true);const inverse=group.matrixWorld.clone().invert(),batches=new Map();
 function visit(object){if(exclude.includes(object))return;if(object.isMesh&&!Array.isArray(object.material)&&!object.material.map){const m=object.material;const key=[m.type,m.color?.getHexString(),m.roughness,m.metalness,m.flatShading,m.side,m.transparent,m.opacity,m.depthWrite,object.castShadow,object.receiveShadow].join('|');let batch=batches.get(key);if(!batch){batch={material:m,items:[],geometries:[],cast:object.castShadow,receive:object.receiveShadow};batches.set(key,batch);}const source=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();for(const name of Object.keys(source.attributes))if(!['position','normal','uv'].includes(name))source.deleteAttribute(name);source.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,object.matrixWorld));batch.items.push(object);batch.geometries.push(source);}for(const child of object.children)visit(child);}
 for(const child of [...group.children])visit(child);
 for(const b of batches.values()){if(b.items.length<2){b.geometries.forEach(g=>g.dispose());continue;}const geometry=mergeGeometries(b.geometries,false);b.geometries.forEach(g=>g.dispose());if(!geometry)continue;const mesh=new THREE.Mesh(geometry,b.material);mesh.name='batched-static-pieces';mesh.castShadow=b.cast;mesh.receiveShadow=b.receive;group.add(mesh);b.items.forEach(o=>o.parent.remove(o));}
}
