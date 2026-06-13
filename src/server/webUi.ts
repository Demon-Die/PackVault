export const webUiHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PackVault</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;padding:2rem}
h1{color:#38bdf8;margin-bottom:.5rem}.stats{display:flex;gap:1rem;margin:1.5rem 0;flex-wrap:wrap}
.stat{background:#1e293b;padding:1rem 1.5rem;border-radius:8px}.stat b{display:block;font-size:1.5rem;color:#38bdf8}
input{width:100%;max-width:400px;padding:.6rem 1rem;border:1px solid #334155;border-radius:6px;background:#1e293b;color:#e2e8f0;margin-bottom:1rem}
table{width:100%;border-collapse:collapse}th,td{padding:.6rem 1rem;text-align:left;border-bottom:1px solid #334155}
th{color:#94a3b8;font-size:.85rem}a{color:#38bdf8}
</style>
</head>
<body>
<h1>PackVault</h1><p>Local package registry</p>
<div class="stats" id="stats"></div>
<input type="text" id="search" placeholder="Search packages..." oninput="filter()">
<table><thead><tr><th>Package</th><th>Version</th><th>Size</th><th>Download</th></tr></thead>
<tbody id="tbody"></tbody></table>
<script>
let pkgs=[];
async function load(){
  const [h,p]=await Promise.all([fetch('/-/packvault/health').then(r=>r.json()),fetch('/-/packvault/packages').then(r=>r.json())]);
  document.getElementById('stats').innerHTML=
    '<div class="stat"><b>'+h.packages+'</b>Packages</div>'+
    '<div class="stat"><b>'+p.reduce((s,x)=>s+x.size,0).toLocaleString()+'</b>Bytes</div>';
  pkgs=p;render(p);
}
function render(list){
  document.getElementById('tbody').innerHTML=list.map(p=>
    '<tr><td>'+p.name+'</td><td>'+p.version+'</td><td>'+(p.size/1024).toFixed(1)+' KB</td>'+
    '<td><a href="/-/packvault/tarball?name='+encodeURIComponent(p.name)+'&version='+encodeURIComponent(p.version)+'">tarball</a></td></tr>'
  ).join('');
}
function filter(){
  const q=document.getElementById('search').value.toLowerCase();
  render(pkgs.filter(p=>p.name.toLowerCase().includes(q)));
}
load();
</script>
</body>
</html>`;
