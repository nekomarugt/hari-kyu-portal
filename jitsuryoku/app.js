/* うでだめし（web実力）：kakera.json（かけら倉庫）から gen.js で毎回ちがう問題を組み立てる。成績は端末内（localStorage）だけ。 */
(function(){"use strict";var $=function(i){return document.getElementById(i)};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
fetch("./kakera.json").then(function(r){if(!r.ok)throw 0;return r.json()}).then(init).catch(function(){$("loadmsg").textContent="データを読み込めませんでした。通信状態を確認して再読み込みしてください。"});
var LOGKEY=WJ_KEY.replace("scores","log");
function today(){var d=new Date();return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)}
function logLoad(){try{var o=JSON.parse(localStorage.getItem(LOGKEY)||"null");if(o&&o.v===1&&Array.isArray(o.log))return o}catch(e){}return {v:1,sets:0,log:[]}}
function logSave(o){if(o.log.length>5000)o.log.splice(0,o.log.length-5000);try{localStorage.setItem(LOGKEY,JSON.stringify(o))}catch(e){}}
function init(T){$("loadmsg").hidden=true;
var st={},N=10,KEY=WJ_KEY,tm,MIX="全教科ごちゃまぜ";var SUBS=[],LBL={};T.forEach(function(t){if(SUBS.indexOf(t.subject)<0){SUBS.push(t.subject);LBL[t.subject]=t.subjectLabel||t.subject}});var cur=SUBS[0];
$("sb").innerHTML=SUBS.concat([MIX]).map(function(s){return '<button type="button" data-s="'+esc(s)+'">'+esc(LBL[s]||s)+'</button>'}).join("");
function renderTopics(){document.querySelectorAll("#sb button").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.s===cur))});
 var subs=cur===MIX?SUBS:[cur];$("tp").innerHTML=subs.map(function(s){return (cur===MIX?'<div class="fg">'+esc(LBL[s])+'</div>':'')+'<div class="tp">'+T.filter(function(t){return t.subject===s}).map(function(t){return '<label><input type="checkbox" value="'+esc(t.table)+'" checked>'+esc(t.title)+'<span class="chip">'+t.rows.length+'</span></label>'}).join("")+'</div>'}).join("")}
document.querySelectorAll("#sb button").forEach(function(b){b.onclick=function(){cur=b.dataset.s;renderTopics()}});
var pre=(new URLSearchParams(location.search).get("t")||"").split(",").filter(Boolean);var pt=T.filter(function(t){return pre.indexOf(t.table)>-1});
if(pt.length)cur=pt[0].subject;renderTopics();
if(pt.length)document.querySelectorAll("#tp input").forEach(function(x){x.checked=pre.indexOf(x.value)>-1});
function sel(){return [].map.call(document.querySelectorAll("#tp input:checked"),function(x){return x.value})}
$("allBtn").onclick=function(e){e.preventDefault();document.querySelectorAll("#tp input").forEach(function(x){x.checked=true})};
$("noneBtn").onclick=function(e){e.preventDefault();document.querySelectorAll("#tp input").forEach(function(x){x.checked=false})};
document.querySelectorAll("#nb button").forEach(function(b){b.onclick=function(){N=+b.dataset.n;document.querySelectorAll("#nb button").forEach(function(x){x.setAttribute("aria-pressed",String(x===b))})}});
function view(v){["setup","quiz","result"].forEach(function(x){$("v-"+x).hidden=x!==v});scrollTo(0,0)}
function load(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){return[]}}
function hist(){var h=load();$("hist").innerHTML=h.length?"最近の成績：<br>"+h.slice(0,5).map(function(x){return esc(x.date+"　"+x.label+"　"+x.score+"/"+x.n+"　"+x.secs+"秒　シード"+x.seed)}).join("<br>"):""}
function start(seed,s,n,mix){var qs=WJ.makeSet(T,seed,n,s,mix?SUBJ_W:null);if(!qs.length){alert("分野を選んでください");return}
 st={seed:seed,sel:s,n:qs.length,mix:mix,label:mix?MIX:LBL[cur],qs:qs,pos:0,score:0,res:[],t0:Date.now()};view("quiz");$("seedShow").textContent="シード "+seed;
 clearInterval(tm);tm=setInterval(function(){$("timer").textContent="⏱ "+Math.floor((Date.now()-st.t0)/1000)+"秒"},500);show()}
function show(){var q=st.qs[st.pos];$("pos").textContent="問"+(st.pos+1)+" / "+st.n;$("sc").textContent="正解 "+st.score;$("qtag").textContent=(LBL[q.subject]||q.subject)+"／"+q.title+(q.freq<=1?"　★マイナー":"");$("qt").textContent=q.text;$("nextBtn").hidden=true;
 var c=$("chs");c.innerHTML="";q.choices.forEach(function(t,i){var b=document.createElement("button");b.type="button";b.className="ch";b.textContent=(i+1)+". "+t;b.onclick=function(){answer(i)};c.appendChild(b)})}
function answer(i){var q=st.qs[st.pos];var bs=$("chs").children;if(!$("nextBtn").hidden)return;var ok=i===q.answer;if(ok)st.score++;st.res.push({pick:i,ok:ok});var L=logLoad();L.log.push({d:today(),s:q.subject,tb:q.table,ti:q.title,ok:ok?1:0});logSave(L);
 for(var k=0;k<bs.length;k++){bs[k].disabled=true;if(k===q.answer)bs[k].classList.add("ok");else if(k===i)bs[k].classList.add("ng")}
 $("sc").textContent="正解 "+st.score;$("nextBtn").textContent=st.pos<st.n-1?"次へ":"結果を見る";$("nextBtn").hidden=false}
$("nextBtn").onclick=function(){if(st.pos<st.n-1){st.pos++;show()}else finish()};
function finish(){clearInterval(tm);var L=logLoad();L.sets=(L.sets||0)+1;logSave(L);var secs=Math.floor((Date.now()-st.t0)/1000);view("result");$("rseed").textContent=st.label+"　シード "+st.seed+"（同じ選択で再現）";
 $("rscore").textContent=st.score+" / "+st.n;$("rtime").textContent="かかった時間 "+secs+"秒";
 $("rv").innerHTML=st.qs.map(function(q,i){var r=st.res[i];return '<div class="rv"><div><span class="mark">'+(r.ok?"○":"×")+'</span> 問'+(i+1)+'　'+esc(q.text)+'</div><div>答：'+esc(q.choices[q.answer])+(r.ok?"":'<span class="muted">（あなた：'+esc(q.choices[r.pick])+'）</span>')+'</div><div class="muted">★なぜ　'+esc(q.why)+'</div><div class="muted">'+esc(LBL[q.subject]||q.subject)+'／'+esc(q.tag)+'　'+(q.link?'<a href="'+esc(q.link)+'">資料：'+esc(q.linkTitle||"資料")+'</a>':'')+'</div></div>'}).join("");
 var h=load();h.unshift({date:new Date().toLocaleString("ja-JP"),label:st.label,score:st.score,n:st.n,secs:secs,seed:st.seed});try{localStorage.setItem(KEY,JSON.stringify(h.slice(0,20)))}catch(e){}hist()}
function rnd(){return Math.floor(Math.random()*900000)+100000}
function newSeed(){var v=parseInt($("seedIn").value,10);$("seedIn").value="";return v>0?v:rnd()}
$("newBtn").onclick=function(){start(newSeed(),sel(),N,cur===MIX)};if(!$("statsLink")){var a=document.createElement("a");a.id="statsLink";a.href="../stats/";a.textContent="📊 じぶんのパラメータを見る →";a.style.cssText="display:block;text-align:center;margin:10px 0";$("retryBtn").parentNode.after(a);}
$("againBtn").onclick=function(){view("setup")};$("retryBtn").onclick=function(){start(st.seed,st.sel,st.n,st.mix)};
hist();view("setup");}
})();
