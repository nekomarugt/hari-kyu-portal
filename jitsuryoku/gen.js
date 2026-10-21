/*GEN-START*/
var WJ=(function(){
"use strict";
var MINOR_RATE=0.12;      // 頻出度1（マイナー）行が出る割合
var W={3:6,2:3};          // 頻出度2/3内の重み
var TABLE_SHARE=0.3;      // 1つの表が1回に占める上限（表を1つだけ選んだときは無制限）
function rng(seed){var a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;var t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function shuf(a,r){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function pick(a,r){return a[Math.floor(r()*a.length)];}
function uniq(a){return a.filter(function(x,i){return a.indexOf(x)===i;});}
function ent(s){return String(s).replace(/（.*?）|\(.*?\)/g,"").replace(/\s/g,"");}
// relation単位の索引。真偽は「同じrelの全行」で判定（表にない組合せ＝誤り）、ambiguousは真でも偽でもない＝使わない
function index(tables){var I={};tables.forEach(function(t){t.relations.forEach(function(rel){
  var k=t.table+"/"+rel.id,rows=t.rows.filter(function(r){return r.rel===rel.id;});
  var F={},AMB={};rows.forEach(function(r){F[r.a+"\u0000"+r.b]=1;});(rel.ambiguous||[]).forEach(function(p){AMB[p[0]+"\u0000"+p[1]]=1;});
  I[k]={t:t,rel:rel,rows:rows,As:uniq(rows.map(function(r){return r.a;})),Bs:uniq(rows.map(function(r){return r.b;})),
   truth:function(a,b){var x=a+"\u0000"+b;return AMB[x]?null:!!F[x];}};});});
  // 組合せ型は「表全体」で真偽を見る（同じ表の別relで正しい組合せは誤りの肢に使わない）
  Object.keys(I).forEach(function(k){var X=I[k];var same=Object.keys(I).filter(function(k2){return I[k2].t===X.t;}).map(function(k2){return I[k2];});
   X.ttruth=function(a,b){var res=false;for(var i=0;i<same.length;i++){var v=same[i].truth(a,b);if(v===null)return null;if(v)res=true;}return res;};});
  Object.keys(I).forEach(function(k){var X=I[k];X.sib=Object.keys(I).filter(function(k2){return k2!==k&&I[k2].t===X.t&&I[k2].rel.A===X.rel.A;}).map(function(k2){return I[k2];});});
  return I;}
var SEP=" ―― ";
function fill(s,o){return s.replace(/\{(\w+)\}/g,function(m,k){return o[k]!=null?o[k]:m;});}
function vars(X,row){return {a:row.a,b:row.b,A:X.rel.A,B:X.rel.B};}
var TPL={
 fwd:function(X,row,r){var ds=shuf(X.Bs,r).filter(function(b){return X.truth(row.a,b)===false;}).slice(0,3);
  var ph=(X.rel.gen===false?[X.rel.fwd]:[X.rel.fwd,"{a}の{B}として正しいのはどれか。"]).concat(X.rel.fwd2||[]);
  return {text:fill(pick(ph,r),vars(X,row)),ch:[row.b].concat(ds),truthOf:function(c){return X.truth(row.a,c);},want:true,subj:"a:"+row.a};},
 rev:function(X,row,r){var ds=shuf(X.As,r).filter(function(a){return X.truth(a,row.b)===false;}).slice(0,3);
  var ph=[X.rel.rev].concat(X.rel.rev2||[]);
  return {text:fill(pick(ph,r),vars(X,row)),ch:[row.a].concat(ds),truthOf:function(c){return X.truth(c,row.b);},want:true,subj:"b:"+X.rel.id+":"+row.b};},
 notFwd:function(X,row,r){if(X.rel.not===false)return null;var tr=shuf(X.rows.filter(function(x){return x.a===row.a;}).map(function(x){return x.b;}),r);if(tr.length<3)return null;
  var f=shuf(X.Bs,r).filter(function(b){return X.truth(row.a,b)===false;})[0];if(!f)return null;
  return {text:fill(pick(["{a}の{B}に該当しないのはどれか。","{a}の{B}として誤っているのはどれか。"],r),vars(X,row)),ch:[f].concat(tr.slice(0,3)),truthOf:function(c){return X.truth(row.a,c);},want:false,subj:"a:"+row.a};},
 notRev:function(X,row,r){if(X.rel.not===false)return null;var tr=shuf(X.rows.filter(function(x){return x.b===row.b;}).map(function(x){return x.a;}),r);if(tr.length<3)return null;
  var f=shuf(X.As,r).filter(function(a){return X.truth(a,row.b)===false;})[0];if(!f)return null;
  return {text:fill("「{b}」に該当しない{A}はどれか。",vars(X,row)),ch:[f].concat(tr.slice(0,3)),truthOf:function(c){return X.truth(c,row.b);},want:false,subj:"b:"+X.rel.id+":"+row.b};},
 two:function(X,row,r){if(!X.sib.length)return null;var Y=pick(X.sib,r);var b2s=Y.rows.filter(function(x){return x.a===row.a;});if(!b2s.length)return null;var b2=pick(b2s,r).b;
  var both=function(a){var t1=X.truth(a,row.b),t2=Y.truth(a,b2);if(t1===null||t2===null)return null;return t1&&t2;};
  var ds=shuf(uniq(X.As.concat(Y.As)),r).filter(function(a){return a!==row.a&&both(a)===false;}).slice(0,3);
  return {text:fill("{B1}が「{b1}」で、{B2}が「{b2}」の{A}はどれか。",{B1:X.rel.B,b1:row.b,B2:Y.rel.B,b2:b2,A:X.rel.A}),ch:[row.a].concat(ds),truthOf:both,want:true,subj:"t:"+row.b+"/"+b2};},
 pair:function(X,row,r){if(!X.rel.pair)return null;var ds=[],g=0;while(ds.length<3&&g++<60){var a=pick(X.As,r),b=pick(X.Bs,r),s=a+SEP+b;
   if(X.ttruth(a,b)===false&&ds.indexOf(s)<0&&a!==row.a)ds.push(s);}
  return {text:pick(["組合せで正しいのはどれか。",X.rel.A+"と"+X.rel.B+"の組合せで正しいのはどれか。"],r),ch:[row.a+SEP+row.b].concat(ds),truthOf:function(c){var p=c.split(SEP);return X.ttruth(p[0],p[1]);},want:true,subj:"p:"+row.id};},
 wrong:function(X,row,r){if(!X.rel.wrong)return null;var a=row.a,f=null,g=0;
  while(!f&&g++<60){var b=pick(X.Bs,r);if(X.ttruth(a,b)===false)f=a+SEP+b;}if(!f)return null;
  var ts=uniq(shuf(X.rows.filter(function(x){return x.a!==a;}),r).map(function(x){return x.a+SEP+x.b;}));
  var used={},tr=[];ts.forEach(function(s){var aa=s.split(SEP)[0];if(tr.length<3&&!used[aa]){used[aa]=1;tr.push(s);}});
  if(tr.length<3)tr=ts.slice(0,3);
  return {text:pick(["組合せで誤っているのはどれか。",X.rel.A+"と"+X.rel.B+"の組合せで誤っているのはどれか。"],r),ch:[f].concat(tr),truthOf:function(c){var p=c.split(SEP);return X.ttruth(p[0],p[1]);},want:false,subj:"w:"+row.id};}
};
var TPL_BAG=["fwd","rev","fwd","rev","notFwd","notRev","two","pair","wrong"];
function build(X,row,tid,r){var q=TPL[tid](X,row,r);if(!q||q.ch.length!==4)return null;var ch=shuf(q.ch,r);
  if(uniq(ch).length!==4)return null;
  var tv=ch.map(q.truthOf);if(tv.some(function(v){return v===null;}))return null; // ambiguousは使わない
  var ok=[];tv.forEach(function(v,i){if(v===q.want)ok.push(i);});
  if(ok.length!==1)return null; // 正解ちょうど1つ以外は捨てる
  // この問題が「使った」とみなす実体：主役の行のa・b、正解肢に出てくる語
  var ansParts=ch[ok[0]].split(SEP);var ents=uniq([ent(row.a)].concat(ansParts.map(ent)).concat(q.want?[]:[ent(row.a)]));
  return {tpl:tid,subject:X.t.subject,table:X.t.table,title:X.t.title,text:q.text,choices:ch,answer:ok[0],why:row["なぜ"],link:row["資料"],linkTitle:row["資料見出し"],tag:row["出題基準"],freq:row["頻出度"],rowId:row.id,rowA:row.a,rowB:row.b,subj:q.subj,ents:ents};}
function weightedRow(pool,r){var minor=pool.filter(function(p){return p.row["頻出度"]<=1;}),major=pool.filter(function(p){return p.row["頻出度"]>=2;});
  if(minor.length&&(!major.length||r()<MINOR_RATE))return pick(minor,r);
  var tot=0;major.forEach(function(p){tot+=W[p.row["頻出度"]];});var x=r()*tot;
  for(var i=0;i<major.length;i++){x-=W[major[i].row["頻出度"]];if(x<0)return major[i];}return major[major.length-1];}
function makeSet(tables,seed,n,sel,subjW){n=n||10;var r=rng(seed),I=index(tables),pool=[];
  Object.keys(I).forEach(function(k){var X=I[k];if(sel&&sel.indexOf(X.t.table)<0)return;X.rows.forEach(function(row){pool.push({X:X,row:row});});});
  var bySubj={};pool.forEach(function(p){var k=p.X.t.subject||"";(bySubj[k]=bySubj[k]||[]).push(p);});var subs=Object.keys(bySubj);
  function pickPool(){if(!subjW||subs.length<2)return pool;var tot=0;subs.forEach(function(k){tot+=subjW[k]||0;});var x=r()*tot;
   for(var i=0;i<subs.length;i++){x-=subjW[subs[i]]||0;if(x<0)return bySubj[subs[i]];}return bySubj[subs[subs.length-1]];}
  var nTab=uniq(pool.map(function(p){return p.X.t.table;})).length;
  var cap=nTab<=1?n:Math.max(Math.ceil(n*TABLE_SHARE),Math.ceil(n/nTab));
  var out=[],usedRow={},usedEnt={},usedAns={},usedSubj={},usedText={},perTab={},g=0;
  // 似た問題を避ける：同じ行・同じ実体（a）・同じ正解・同じ問いの主語・表の偏り・同じ型の連続。詰まったら段階的にゆるめる
  while(out.length<n&&g++<8000){var lv=g<3000?0:g<5000?1:g<6500?2:3;var p=weightedRow(pickPool(),r);
   if(usedRow[p.row.id])continue;
   if(lv<3&&usedEnt[ent(p.row.a)])continue;
   if(lv<2&&(perTab[p.X.t.table]||0)>=cap)continue;
   var q=build(p.X,p.row,pick(TPL_BAG,r),r);if(!q)continue;
   if(lv<1&&out.length&&out[out.length-1].tpl===q.tpl)continue;
   var ans=q.choices[q.answer];if(usedAns[ans]||usedSubj[q.subj]||usedText[q.text+"|"+ans])continue;
   if(lv<3&&q.ents.some(function(e){return usedEnt[e];}))continue;
   usedRow[p.row.id]=1;usedAns[ans]=1;usedSubj[q.subj]=1;usedText[q.text+"|"+ans]=1;q.ents.forEach(function(e){usedEnt[e]=1;});perTab[q.table]=(perTab[q.table]||0)+1;out.push(q);}
  return out;}
return {makeSet:makeSet,index:index,MINOR_RATE:MINOR_RATE,TABLE_SHARE:TABLE_SHARE,ent:ent};
})();
if(typeof module!=="undefined")module.exports=WJ;
/*GEN-END*/
