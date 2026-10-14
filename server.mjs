import http from 'node:http';
import {createReadStream,existsSync,statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const directory=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'dist');
if(!existsSync(path.join(directory,'index.html'))){console.error('dist がありません。pnpm install → pnpm build を実行してください。');process.exit(1);}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary','.gltf':'model/gltf+json'};
const server=http.createServer((req,res)=>{let requested;try{requested=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.writeHead(400).end();return;}
const file=path.resolve(directory,'.'+(requested==='/'?'/index.html':requested));
if(!file.startsWith(directory+path.sep)||!existsSync(file)||!statSync(file).isFile()){res.writeHead(404).end('Not found');return;}
res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});createReadStream(file).pipe(res);});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'5173番ポートは使用中です。既に起動したブラウザを確認するか、PORT=5174など別の番号を指定してください。':e.message);process.exit(1);});
server.listen(Number(process.env.PORT||5173),'127.0.0.1',()=>console.log(`松山工場 建築ストーリー: http://127.0.0.1:${server.address().port}/\n終了: Ctrl+C`));
