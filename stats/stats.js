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
 if(!C.mini&&!att&&!SC.length){$("empty").hidden=false;$("main").hidden=true;return;}
 if(!C.mini)$("main").hidden=false;
 var big=[["うでだめし実施",(L.sets||SC.length)+"回"],["解いた問題",att+"問"],["全体の正解率",att?Math.round(100*cor/att)+"%":"―"],["がんばり日数",Object.keys(days).length+"日"]];
if(!C.mini)$("big").innerHTML=big.map(function(b){return '<div class="st-big"><div class="st-num">'+esc(b[1])+'</div><div class="st-lab">'+esc(b[0])+'</div></div>'}).join("");
 function rows(map){return Object.keys(map).map(function(k){var o=map[k];return {k:k,att:o.att,cor:o.cor,rate:o.att?o.cor/o.att:0,meta:o.meta||{label:k}}}).sort(function(a,b){var fa=a.att<MIN,fb=b.att<MIN;if(fa!==fb)return fa?1:-1;return a.rate-b.rate||b.att-a.att})}
 function bars(list,link){return list.map(function(r){var few=r.att<MIN,p=Math.round(100*r.rate);var cls=few?"few":p<60?"weak":"ok";
  var inner='<span class="st-bl">'+esc(r.meta.label)+(r.meta.kind?'<small>'+esc(r.meta.subj+"・"+r.meta.kind)+'</small>':'')+'</span><span class="st-track"><span class="st-fill '+cls+'" style="width:'+(few?100:Math.max(p,2))+'%"></span></span><span class="st-v">'+(few?'—':p+'%')+'<small>n='+r.att+'</small></span>';
  return link&&r.meta.href?'<a class="st-bar" href="'+esc(r.meta.href)+'">'+inner+'</a>':'<div class="st-bar">'+inner+'</div>'}).join("")}
 // 教科バー（決まった並び・データなしはグレー）
 var sr=C.order.map(function(lab){var o=subj[lab]||{att:0,cor:0};return {k:lab,att:o.att,cor:o.cor,rate:o.att?o.cor/o.att:0,meta:{label:lab}}});
 // RPGステータス：能力値0〜99＝正解率×（解いた数が少ないうちは控えめ）
 $("subj").innerHTML=sr.map(function(r){var a=(C.ability||{})[r.k]||[r.k,"",""],few=r.att<MIN,p=Math.round(100*r.rate),st=few?0:Math.min(99,Math.round(99*r.rate*Math.min(1,0.4+0.6*r.att/50)));
  return '<div class="st-ab'+(few?' few':'')+'"><span class="st-abn">'+esc(a[2])+' <b>'+esc(a[1])+'</b><small>'+esc(a[0])+'</small></span><span class="st-abv">'+(few?'??':st)+'</span><span class="st-track"><span class="st-fill '+(few?'few':p<60?'weak':'ok')+'" style="width:'+(few?100:Math.max(2,Math.round(st/99*100)))+'%"></span></span><span class="st-v">'+(few?'—':p+'%')+'<small>n='+r.att+'</small></span></div>'}).join("");
 if(C.mini)return;
 // 得意・のびしろ（各分野MIN問以上）
 var ok=rows(fld).filter(function(r){return r.att>=MIN});var nb=Math.min(3,Math.floor(ok.length/2)||0),low=ok.slice(0,Math.max(nb,ok.length===1?0:nb));
 var hi=ok.slice().reverse().slice(0,Math.min(3,ok.length-low.length));
 function mini(list,cls){return list.map(function(r){return '<a class="st-mini '+cls+'" href="'+esc(r.meta.href)+'"><span><b>'+esc(r.meta.label)+'</b><small>'+esc(r.meta.subj+"・"+r.meta.kind)+'</small></span><span class="st-mv">'+Math.round(100*r.rate)+'%<small>n='+r.att+'</small></span></a>'}).join("")}
 var hint='<p class="muted">分野ごとに'+MIN+'問以上解くと出ます</p>';
 $("good").innerHTML='<h2>💪 得意</h2>'+(mini(hi,"good")||hint);
 $("grow").innerHTML='<h2>🌱 のびしろ</h2>'+(low.length?mini(low,"grow")+'<p class="muted">タップでその分野を出題。ここを伸ばすと一気に上がります！</p>':(ok.length?'<p class="muted">もう少し分野が増えると出ます</p>':hint));
 // 称号
 var acc=att?100*cor/att:0,TI=[["🌱","見習い",1,0],["🔥","がんばり屋",50,0],["⭐","使い手",150,55],["🏅","名人",400,65],["🏆","達人",800,75],["👑","マスター",1500,85]];
 var lv=0;TI.forEach(function(t,i){if(att>=t[2]&&acc>=t[3])lv=i});
 var cand=sr.filter(function(r){return r.att>=MIN});var best=(cand.length?cand:sr.filter(function(r){return r.att>0})).slice().sort(function(a,b){return cand.length?b.rate-a.rate||b.att-a.att:b.att-a.att})[0];
 var fv=best&&C.flavor[best.k]||{w:"まなびの"};var nameOf=function(i){return fv.t?fv.t[i]:fv.w+TI[i][1]};
 var nx=TI[lv+1],need="";if(nx){var q=[];if(att<nx[2])q.push("あと"+(nx[2]-att)+"問");if(acc<nx[3])q.push("正解率"+nx[3]+"%以上");need='次の称号「'+nameOf(lv+1)+'」まで：'+q.join("・")}else need="最高ランク到達！おめでとう 🎉";
 var LV=null;try{LV=window.JKGame&&JKGame.level()}catch(e){}
 $("title").innerHTML='<div class="st-tlab">'+(LV?'<span class="st-lv">Lv'+LV.lv+'</span> '+esc(LV.title||''):'いまの称号')+'</div><div class="st-tname">'+TI[lv][0]+' '+esc(nameOf(lv))+'</div><div class="st-tsub">'+(best?'いちばん得意な教科：'+esc(best.k):'')+'</div><div class="st-next">'+esc(need)+'</div>';
 // 直近10回のうでだめし（古い→新しい）
 var last=SC.slice(0,10).reverse().filter(function(x){return x&&x.n>0});
 if(last.length<2){$("line").innerHTML='<p class="muted">うでだめしを2回以上やると、点数の推移が出ます。</p>';}
 else{var W=320,H=140,pl=30,pr=10,pt=10,pb=24,xs=function(i){return pl+(W-pl-pr)*i/(last.length-1)},ys=function(v){return pt+(H-pt-pb)*(1-v/100)};
  var pts=last.map(function(x,i){return [xs(i),ys(100*x.score/x.n)]});
  var g=[0,50,100].map(function(v){return '<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+ys(v)+'" y2="'+ys(v)+'" class="st-grid"/><text x="'+(pl-4)+'" y="'+(ys(v)+4)+'" text-anchor="end" class="st-ax">'+v+'</text>'}).join("");
  $("line").innerHTML='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="直近のうでだめしの正解率">'+g+'<polyline points="'+pts.map(function(p){return p[0].toFixed(1)+","+p[1].toFixed(1)}).join(" ")+'" class="st-pl"/>'+pts.map(function(p,i){return '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3.5" class="st-pt"><title>'+esc(last[i].date+" "+last[i].score+"/"+last[i].n)+'</title></circle>'}).join("")+'<text x="'+pl+'" y="'+(H-6)+'" class="st-ax">古い</text><text x="'+(W-pr)+'" y="'+(H-6)+'" text-anchor="end" class="st-ax">新しい</text></svg>';}
});
})();
