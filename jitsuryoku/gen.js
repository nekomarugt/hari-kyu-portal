/*GEN-START*/
var WJ=(function(){
"use strict";
var MINOR_RATE=0.12; // 頻出度1（マイナー）行が出る割合。調整用
var W={3:6,2:3}; // 頻出度2/3内の重み
function rng(seed){var a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;var t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function shuf(a,r){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function pick(a,r){return a[Math.floor(r()*a.length)];}
function uniq(a){return a.filter(function(x,i){return a.indexOf(x)===i;});}
// relation単位の索引。真偽は「同じrelの全行」で判定（表にない組合せ＝誤り）、ambiguousは真でも偽でもない＝使わない
function index(tables){var I={};tables.forEach(function(t){t.relations.forEach(function(rel){
  var k=t.table+"/"+rel.id,rows=t.rows.filter(function(r){return r.rel===rel.id;});
  var F={},AMB={};rows.forEach(function(r){F[r.a+"\u0000"+r.b]=1;});rel.ambiguous.forEach(function(p){AMB[p[0]+"\u0000"+p[1]]=1;});
  I[k]={t:t,rel:rel,rows:rows,As:uniq(rows.map(function(r){return r.a;})),Bs:uniq(rows.map(function(r){return r.b;})),
   truth:function(a,b){var x=a+"\u0000"+b;return AMB[x]?null:!!F[x];}};});});return I;}
var SEP=" ―― ";
var TPL={
 fwd:function(X,row,r){var ds=shuf(X.Bs,r).filter(function(b){return X.truth(row.a,b)===false;}).slice(0,3);
  return {text:X.rel.fwd.replace("{a}",row.a),ch:[row.b].concat(ds),truthOf:function(c){return X.truth(row.a,c);},want:true};},
 rev:function(X,row,r){var ds=shuf(X.As,r).filter(function(a){return X.truth(a,row.b)===false;}).slice(0,3);
  return {text:X.rel.rev.replace("{b}",row.b),ch:[row.a].concat(ds),truthOf:function(c){return X.truth(c,row.b);},want:true};},
 pair:function(X,row,r){if(!X.rel.pair)return null;var ds=[],g=0;while(ds.length<3&&g++<60){var a=pick(X.As,r),b=pick(X.Bs,r),s=a+SEP+b;
   if(X.truth(a,b)===false&&ds.indexOf(s)<0&&a!==row.a)ds.push(s);}
  return {text:"組合せで正しいのはどれか。",ch:[row.a+SEP+row.b].concat(ds),truthOf:function(c){var p=c.split(SEP);return X.truth(p[0],p[1]);},want:true};},
 wrong:function(X,row,r){if(!X.rel.wrong)return null;var a=row.a,f=null,g=0;
  while(!f&&g++<60){var b=pick(X.Bs,r);if(X.truth(a,b)===false)f=a+SEP+b;}if(!f)return null;
  var ts=uniq(shuf(X.rows.filter(function(x){return x.a!==a;}),r).map(function(x){return x.a+SEP+x.b;}));
  var used={},tr=[];ts.forEach(function(s){var aa=s.split(SEP)[0];if(tr.length<3&&!used[aa]){used[aa]=1;tr.push(s);}});
  if(tr.length<3)tr=ts.slice(0,3);
  return {text:"組合せで誤っているのはどれか。",ch:[f].concat(tr),truthOf:function(c){var p=c.split(SEP);return X.truth(p[0],p[1]);},want:false};}
};
function build(X,row,tid,r){var q=TPL[tid](X,row,r);if(!q||q.ch.length!==4)return null;var ch=shuf(q.ch,r);
  if(uniq(ch).length!==4)return null;
  var tv=ch.map(q.truthOf);if(tv.some(function(v){return v===null;}))return null; // ambiguousは使わない
  var ok=[];tv.forEach(function(v,i){if(v===q.want)ok.push(i);});
  if(ok.length!==1)return null; // 正解ちょうど1つ以外は捨てる
  return {tpl:tid,subject:X.t.subject,table:X.t.table,title:X.t.title,text:q.text,choices:ch,answer:ok[0],why:row["なぜ"],link:row["資料"],linkTitle:row["資料見出し"],tag:row["出題基準"],freq:row["頻出度"],rowId:row.id};}
function weightedRow(pool,r){var minor=pool.filter(function(p){return p.row["頻出度"]<=1;}),major=pool.filter(function(p){return p.row["頻出度"]>=2;});
  if(minor.length&&(!major.length||r()<MINOR_RATE))return pick(minor,r);
  var tot=0;major.forEach(function(p){tot+=W[p.row["頻出度"]];});var x=r()*tot;
  for(var i=0;i<major.length;i++){x-=W[major[i].row["頻出度"]];if(x<0)return major[i];}return major[major.length-1];}
function makeSet(tables,seed,n,sel,subjW){n=n||10;var r=rng(seed),I=index(tables),pool=[];
  Object.keys(I).forEach(function(k){var X=I[k];if(sel&&sel.indexOf(X.t.table)<0)return;X.rows.forEach(function(row){pool.push({X:X,row:row});});});
  var bySubj={};pool.forEach(function(p){var k=p.X.t.subject||"";(bySubj[k]=bySubj[k]||[]).push(p);});var subs=Object.keys(bySubj);
  function pickPool(){if(!subjW||subs.length<2)return pool;var tot=0;subs.forEach(function(k){tot+=subjW[k]||0;});var x=r()*tot;
   for(var i=0;i<subs.length;i++){x-=subjW[subs[i]]||0;if(x<0)return bySubj[subs[i]];}return bySubj[subs[subs.length-1]];}
  var out=[],seen={},g=0;while(out.length<n&&g++<5000){var p=weightedRow(pickPool(),r);
   var q=build(p.X,p.row,pick(["fwd","rev","fwd","rev","pair","wrong"],r),r);if(!q)continue;
   var key=(q.tpl==="pair"||q.tpl==="wrong")?q.text+"|"+q.choices[q.answer]:q.text;if(seen[key]||seen[p.row.id]&&g<3000)continue;seen[key]=1;seen[p.row.id]=1;out.push(q);}
  return out;}
return {makeSet:makeSet,index:index,MINOR_RATE:MINOR_RATE};
})();
if(typeof module!=="undefined")module.exports=WJ;
/*GEN-END*/
