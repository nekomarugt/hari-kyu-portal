/* じぶんのパラメータ：端末内（localStorage）の記録だけを読んで表示する。書き込み・リセットはしない。 */
(function(){"use strict";var C=window.STATS_CFG,$=function(i){return document.getElementById(i)};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function get(k){try{return JSON.parse(localStorage.getItem(k)||"null")}catch(e){return null}}
var G=get(C.gameKey)||{},L=get(C.wjLogKey)||{log:[],sets:0},SC=get(C.wjScoreKey)||[];if(!Array.isArray(L.log))L.log=[];if(!Array.isArray(SC))SC=[];
var MIN=5;
Promise.all(C.subjects.map(function(s){return fetch(s.data).then(function(r){return r.ok?r.json():null}).catch(function(){return null})})).then(function(datas){
 // 過去問・4択（ゲーム記録 qs："src:回-問" → [解いた回数, 正解回数, …]）
 var qs=G.qs&&typeof G.qs==="object"?G.qs:{};var subj={},fld={};
 function add(map,key,att,cor,meta){var o=map[key]||(map[key]={att:0,cor:0,meta:meta});o.att+=att;o.cor+=cor;}
 C.subjects.forEach(function(s,i){var d=datas[i];var fmap={},fname={};
  if(d&&s.kind==="fields"){(d.fields||[]).forEach(function(f){fname[f.id]=f.name});fmap=d.map||{};}
  if(d&&s.kind==="category"){d.forEach(function(q){fmap[q.id||(q.exam+"-"+q.number)]=q.category||"その他"});}
  Object.keys(qs).forEach(function(k){var p=k.split(":");if(p[0]!==s.src)return;var r=qs[k];if(!Array.isArray(r))return;var att=+r[0]||0,cor=+r[1]||0;if(!att)return;
   add(subj,s.label,att,cor);var f=fmap[p[1]];if(f==null)return;var nm=s.kind==="fields"?(fname[f]||f):f;
   add(fld,"p|"+s.label+"|"+nm,att,cor,{label:nm,subj:s.label,kind:"過去問・4択",href:s.app+"?field="+encodeURIComponent(f)});});});
 // うでだめし（問題ごとの記録）
 L.log.forEach(function(x){var lab=C.wjLabel[x.s]||x.s;add(subj,lab,1,x.ok?1:0);add(fld,"w|"+x.tb,1,x.ok?1:0,{label:x.ti,subj:lab,kind:"うでだめし",href:"../jitsuryoku/?t="+encodeURIComponent(x.tb)});});
 var att=(+G.att||0)+L.log.length,cor=(+G.cor||0)+L.log.reduce(function(a,x){return a+(x.ok?1:0)},0);
 var days={};(Array.isArray(G.days)?G.days:[]).forEach(function(d){days[d]=1});L.log.forEach(function(x){days[x.d]=1});
 if(!att&&!SC.length){$("empty").hidden=false;$("main").hidden=true;return;}
 $("main").hidden=false;
 var big=[["うでだめし実施",(L.sets||SC.length)+"回"],["解いた問題",att+"問"],["全体の正解率",att?Math.round(100*cor/att)+"%":"―"],["がんばり日数",Object.keys(days).length+"日"]];
 $("big").innerHTML=big.map(function(b){return '<div class="st-big"><div class="st-num">'+esc(b[1])+'</div><div class="st-lab">'+esc(b[0])+'</div></div>'}).join("");
 function rows(map){return Object.keys(map).map(function(k){var o=map[k];return {k:k,att:o.att,cor:o.cor,rate:o.att?o.cor/o.att:0,meta:o.meta||{label:k}}}).sort(function(a,b){var fa=a.att<MIN,fb=b.att<MIN;if(fa!==fb)return fa?1:-1;return a.rate-b.rate||b.att-a.att})}
 function bars(list,link){return list.map(function(r){var few=r.att<MIN,p=Math.round(100*r.rate);var cls=few?"few":p<60?"weak":"ok";
  var inner='<span class="st-bl">'+esc(r.meta.label)+(r.meta.kind?'<small>'+esc(r.meta.subj+"・"+r.meta.kind)+'</small>':'')+'</span><span class="st-track"><span class="st-fill '+cls+'" style="width:'+(few?100:Math.max(p,2))+'%"></span></span><span class="st-v">'+(few?'—':p+'%')+'<small>n='+r.att+'</small></span>';
  return link&&r.meta.href?'<a class="st-bar" href="'+esc(r.meta.href)+'">'+inner+'</a>':'<div class="st-bar">'+inner+'</div>'}).join("")}
 var sr=rows(subj),fr=rows(fld);$("subj").innerHTML=bars(sr,false)||'<p class="muted">まだ記録がありません</p>';$("fld").innerHTML=bars(fr,true)||'<p class="muted">まだ記録がありません</p>';
 var weak=fr.filter(function(r){return r.att>=MIN})[0];
 $("weak").innerHTML=weak?'<div class="st-callout"><div class="muted">いちばん弱い分野</div><div class="st-wname">'+esc(weak.meta.label)+'</div><div class="muted">'+esc(weak.meta.subj+"・"+weak.meta.kind)+'　正解率 '+Math.round(100*weak.rate)+'%（n='+weak.att+'）</div><a class="st-go" href="'+esc(weak.meta.href)+'">この分野をやる →</a></div>':'<div class="st-callout"><div class="muted">いちばん弱い分野</div><div>分野ごとに'+MIN+'問以上解くと出ます</div></div>';
 // 直近10回のうでだめし（古い→新しい）
 var last=SC.slice(0,10).reverse().filter(function(x){return x&&x.n>0});
 if(last.length<2){$("line").innerHTML='<p class="muted">うでだめしを2回以上やると、点数の推移が出ます。</p>';}
 else{var W=320,H=140,pl=30,pr=10,pt=10,pb=24,xs=function(i){return pl+(W-pl-pr)*i/(last.length-1)},ys=function(v){return pt+(H-pt-pb)*(1-v/100)};
  var pts=last.map(function(x,i){return [xs(i),ys(100*x.score/x.n)]});
  var g=[0,50,100].map(function(v){return '<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+ys(v)+'" y2="'+ys(v)+'" class="st-grid"/><text x="'+(pl-4)+'" y="'+(ys(v)+4)+'" text-anchor="end" class="st-ax">'+v+'</text>'}).join("");
  $("line").innerHTML='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="直近のうでだめしの正解率">'+g+'<polyline points="'+pts.map(function(p){return p[0].toFixed(1)+","+p[1].toFixed(1)}).join(" ")+'" class="st-pl"/>'+pts.map(function(p,i){return '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3.5" class="st-pt"><title>'+esc(last[i].date+" "+last[i].score+"/"+last[i].n)+'</title></circle>'}).join("")+'<text x="'+pl+'" y="'+(H-6)+'" class="st-ax">古い</text><text x="'+(W-pr)+'" y="'+(H-6)+'" text-anchor="end" class="st-ax">新しい</text></svg>';}
});
})();
