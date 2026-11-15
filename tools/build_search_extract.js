#!/usr/bin/env node
/* 学習資料の本文だけを search/search-index.json に出す。過去問は入れない。 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const rd = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
function load(files) {
  const ctx = { window: {}, console };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(rd(f), ctx, { filename: f });
  return ctx.window;
}

function strip(h) {
  return String(h || "")
    .replace(/<(br|\/p|\/li|\/tr|\/h\d|\/div|\/figcaption|\/dt|\/dd)[^>]*>/gi, "\n")
    .replace(/<\/t[dh]>/gi, "／")
    .replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, " $1 ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t\u3000]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}
function join(...a) {
  return a.filter((x) => x && String(x).trim()).map(strip).filter(Boolean).join("\n");
}

const KIND = {
  deep: "より深く",
  link: "つながり",
  hk: "はり灸で出る",
  manga: "漫画で見る",
  art: "イラストで見る",
  zu: "図説",
  tips: "TIPS",
  deepdive: "一段深く",
  hari_deep: "くわしく",
  hari_tips: "TIPS",
};

const docs = [];
const skipped = [];
function add(d) {
  d.x = strip(d.x || "");
  if (d.x.length < 8) {
    skipped.push({ u: d.u, h: d.h, why: "text too short" });
    return;
  }
  const rec = { s: d.s, sid: d.sid, t: d.t, h: d.h, u: d.u, x: d.x };
  if (d.box) rec.box = d.box;
  docs.push(rec);
}

function boxMeta(kind, title) {
  const k = KIND[kind] || kind || "より深く";
  return { k: k, t: String(title || "").replace(/^(つながりで覚える|より深く|はり灸で出る|くわしく|TIPS|🎨 漫画で見る|🖼 イラストで見る)[:：]\s*/, "") };
}

const isHari = fs.existsSync(path.join(ROOT, "guide", "guide.js")) && !fs.existsSync(path.join(ROOT, "anatomy-guide"));
const isJusei = fs.existsSync(path.join(ROOT, "anatomy-guide"));

if (isJusei) {
  // ---- 解剖学 ----
  const ana = load(["anatomy-guide/content.js"]);
  for (const ch of ana.anatomyChapters || []) {
    add({ s: "解剖学", sid: "ana", t: "解剖学 学習資料", h: ch.title, u: `anatomy-guide/#${ch.id}`, x: join(ch.title, ch.intro) });
    for (const p of ch.points || []) {
      const u = `anatomy-guide/#${p.id}`;
      add({ s: "解剖学", sid: "ana", t: "解剖学 学習資料", h: p.title, u: u, x: join(p.title, p.anchor, p.why, p.check_q && `確認：${p.check_q}`, p.check_a && `答え：${p.check_a}`) });
      for (const box of p.boxes || []) {
        add({ s: "解剖学", sid: "ana", t: "解剖学 学習資料", h: p.title, u: u, x: join(box.title, box.html), box: boxMeta(box.kind, box.title) });
      }
    }
  }

  // ---- 生理学 ----
  const phyFiles = ["physiology-guide/content.js"];
  if (fs.existsSync(path.join(ROOT, "physiology-guide/deepdive.js"))) phyFiles.push("physiology-guide/deepdive.js");
  const phy = load(phyFiles);
  for (const ch of phy.physiologyChapters || []) {
    add({ s: "生理学", sid: "phy", t: "生理学 学習資料", h: ch.title, u: `physiology-guide/#${ch.id}`, x: join(ch.title, ch.intro) });
    (ch.sections || []).forEach((s, i) => {
      const u = `physiology-guide/#lesson-${ch.id}-${i + 1}`;
      add({ s: "生理学", sid: "phy", t: "生理学 学習資料", h: s.title, u: u, x: join(s.title, s.anchor, s.explanation, s.caption, s.question && `確認：${s.question}`, s.answer && `答え：${s.answer}`, (s.illustrations || []).map((it) => it.caption).join("\n")) });
      for (const tip of s.tips || []) {
        const alts = (tip.images || []).map((im) => im.alt).concat(tip.alt || []);
        add({ s: "生理学", sid: "phy", t: "生理学 学習資料", h: s.title, u: u, x: join(tip.title, tip.caption, tip.note, ...alts), box: boxMeta(/漫画/.test(tip.title || "") ? "manga" : /イラスト/.test(tip.title || "") ? "art" : "tips", tip.title) });
      }
      for (const box of s.boxes || []) {
        add({ s: "生理学", sid: "phy", t: "生理学 学習資料", h: s.title, u: u, x: join(box.title, box.html), box: boxMeta(box.kind, box.title) });
      }
    });
    for (const d of (phy.physiologyDeepDives && phy.physiologyDeepDives[ch.id]) || []) {
      add({ s: "生理学", sid: "phy", t: "生理学 学習資料", h: ch.title, u: `physiology-guide/#${ch.id}`, x: join(d.title, d.shortcut, d.mechanism, d.folded, d.exam), box: boxMeta("deepdive", d.title) });
    }
  }

  // ---- 一般臨床 ----
  const clFiles = ["clinical-guide/content.js", "clinical-guide/disease-content.js"];
  if (fs.existsSync(path.join(ROOT, "clinical-guide/explanations.js"))) clFiles.push("clinical-guide/explanations.js");
  if (fs.existsSync(path.join(ROOT, "clinical-guide/disease-explanations.js"))) clFiles.push("clinical-guide/disease-explanations.js");
  if (fs.existsSync(path.join(ROOT, "clinical-guide/deepdives.js"))) clFiles.push("clinical-guide/deepdives.js");
  const cl = load(clFiles);
  const norm = (v) => String(v).normalize("NFKC");
  function sectionStarts(blocks, general) {
    const heads = [];
    blocks.forEach((b, i) => { if (b.type === "heading") heads.push(i); });
    const cand = [];
    if (general) {
      heads.forEach((i) => { if (blocks[i].level >= 2 && /^\d+\s*[.．]/.test(norm(blocks[i].text))) cand.push(i); });
    } else {
      heads.forEach((i, k) => {
        const b = blocks[i], next = k + 1 < heads.length ? blocks[heads[k + 1]] : null;
        if (b.level === 1) {
          if (!(next && next.level >= 2)) cand.push(i);
          else if (blocks.slice(i + 1, heads[k + 1]).some((x) => x.type === "note" || x.type === "table")) cand.push(i);
        } else if (b.level === 2) cand.push(i);
      });
    }
    const starts = cand.filter((i, k) => {
      const end = k + 1 < cand.length ? cand[k + 1] : blocks.length;
      return blocks.slice(i + 1, end).some((b) => b.type === "note" || b.type === "table");
    });
    return new Map(starts.map((i, k) => [i, k + 1]));
  }
  const segText = (v) => Array.isArray(v) ? v.map((x) => (x && typeof x === "object") ? (x.text || "") : String(x)).join("") : String(v || "");
  function addClinicalUnit(unit, general) {
    const label = "一般臨床医学 学習資料";
    const starts = sectionStarts(unit.blocks || [], general);
    let cur = { h: unit.title, u: `clinical-guide/#unit-${unit.id}`, lines: [], boxes: [] };
    const flush = () => {
      add({ s: "一般臨床医学", sid: "cli", t: label, h: cur.h, u: cur.u, x: cur.lines.join("\n") });
      cur.boxes.forEach((b) => add({ s: "一般臨床医学", sid: "cli", t: label, h: cur.h, u: cur.u, x: b.x, box: b.box }));
    };
    (unit.blocks || []).forEach((b, i) => {
      if (starts.has(i)) {
        flush();
        cur = { h: b.text || unit.title, u: `clinical-guide/#sec-${unit.id}-${starts.get(i)}`, lines: [b.text], boxes: [] };
        return;
      }
      if (b.type === "heading") { cur.lines.push(b.text); return; }
      if (b.type === "note") { cur.lines.push(segText(b.segments)); return; }
      if (b.type === "table") { cur.lines.push((b.rows || []).map((r) => r.map(segText).join("／")).join("\n")); return; }
      if (b.type === "figure" || b.type === "tips") { cur.lines.push(join(b.caption || b.title, b.alt, b.point)); return; }
      if (b.type === "box") {
        if (b.kind === "main") { cur.lines.push(join(b.title, b.html)); return; }
        cur.boxes.push({ x: join(b.title, b.html), box: boxMeta(b.kind, b.title) });
        return;
      }
      const t = join(b.text || b.html || b.caption);
      if (t) cur.lines.push(t);
    });
    flush();
  }
  (cl.CLINICAL_CONTENT && cl.CLINICAL_CONTENT.sections || []).forEach((u) => addClinicalUnit(u, true));
  (cl.CLINICAL_DISEASE_CONTENT && cl.CLINICAL_DISEASE_CONTENT.chapters || []).forEach((u) => addClinicalUnit(u, false));
  const unitTitle = {};
  (cl.CLINICAL_CONTENT && cl.CLINICAL_CONTENT.sections || []).forEach((u) => { unitTitle[u.id] = u.title; });
  (cl.CLINICAL_DISEASE_CONTENT && cl.CLINICAL_DISEASE_CONTENT.chapters || []).forEach((u) => { unitTitle[u.id] = u.title; });
  for (const src of [cl.CLINICAL_EXPLANATIONS, cl.CLINICAL_DISEASE_EXPLANATIONS]) {
    for (const [id, list] of Object.entries(src || {})) {
      (list || []).forEach((e) => {
        add({ s: "一般臨床医学", sid: "cli", t: "一般臨床医学 学習資料", h: unitTitle[id] || id, u: `clinical-guide/#unit-${id}`, x: join(e.title, e.body), box: boxMeta("deep", e.title || "講義の補足") });
      });
    }
  }
  for (const grp of ["general", "diseases"]) {
    for (const [id, dd] of Object.entries((cl.CLINICAL_DEEP_DIVES && cl.CLINICAL_DEEP_DIVES[grp]) || {})) {
      (dd.items || []).forEach((e) => {
        add({ s: "一般臨床医学", sid: "cli", t: "一般臨床医学 学習資料", h: unitTitle[id] || id, u: `clinical-guide/#unit-${id}`, x: join(e.title, e.anchor, e.current, e.bridge, e.exam), box: boxMeta("deepdive", e.title) });
      });
    }
  }

  // ---- 柔道整復理論 ----
  const juFiles = ["jusei-guide/content.js"];
  if (fs.existsSync(path.join(ROOT, "jusei-guide/deepdive.js"))) juFiles.push("jusei-guide/deepdive.js");
  const ju = load(juFiles);
  for (const ch of ju.juseiChapters || []) {
    add({ s: "柔道整復理論", sid: "jri", t: "柔道整復理論 学習資料", h: ch.title, u: `jusei-guide/#${ch.id}`, x: join(ch.title, ch.intro) });
    (ch.sections || []).forEach((s, i) => {
      const u = `jusei-guide/#lesson-${ch.id}-${i + 1}`;
      add({ s: "柔道整復理論", sid: "jri", t: "柔道整復理論 学習資料", h: s.title, u: u, x: join(s.title, s.anchor, s.explanation, s.caption, s.question && `確認：${s.question}`, s.answer && `答え：${s.answer}`, (s.illustrations || []).map((it) => it.caption).join("\n")) });
      for (const box of s.boxes || []) {
        add({ s: "柔道整復理論", sid: "jri", t: "柔道整復理論 学習資料", h: s.title, u: u, x: join(box.title, box.html), box: boxMeta(box.kind, box.title) });
      }
      for (const tip of s.tips || []) {
        add({ s: "柔道整復理論", sid: "jri", t: "柔道整復理論 学習資料", h: s.title, u: u, x: join(tip.title, tip.caption, tip.note, tip.alt), box: boxMeta("tips", tip.title) });
      }
    });
    for (const d of (ju.juseiDeepDives && ju.juseiDeepDives[ch.id]) || []) {
      add({ s: "柔道整復理論", sid: "jri", t: "柔道整復理論 学習資料", h: ch.title, u: `jusei-guide/#${ch.id}`, x: join(d.title, d.shortcut, d.mechanism, d.folded, d.exam), box: boxMeta("deepdive", d.title) });
    }
  }
}

if (isHari) {
  function addHariGuide(file, subject, sid, pageTitle, urlBase) {
    if (!fs.existsSync(path.join(ROOT, file))) return;
    const w = load([file]);
    const G = (w.HKGuide && (w.HKGuide[subject] || Object.values(w.HKGuide)[0])) || w[subject];
    if (!G || !G.sections) {
      console.warn("no sections in", file);
      return;
    }
    const chName = {};
    (G.chapters || []).forEach((ch) => { chName[ch.id] = ch.name; add({ s: pageTitle.replace(/ 学習資料$/, ""), sid, t: pageTitle, h: ch.name, u: `${urlBase}#${ch.id}`, x: join(ch.name, ch.intro) }); });
    for (const [id, s] of Object.entries(G.sections)) {
      const u = `${urlBase}#${id}`;
      const h = s.t || id;
      add({ s: pageTitle.replace(/ 学習資料$/, ""), sid, t: pageTitle, h, u, x: join(h, s.h, s.w, s.cq && `確認：${s.cq}`, s.ca && `答え：${s.ca}`) });
      for (const d of s.deep || []) {
        add({ s: pageTitle.replace(/ 学習資料$/, ""), sid, t: pageTitle, h, u, x: join(d.title, d.shortcut, d.mechanism, d.folded, d.exam), box: boxMeta("hari_deep", d.title) });
      }
      for (const t of s.tips || []) {
        const alts = (t.imgs || []).map((im) => im.alt).concat(t.alt || []);
        add({ s: pageTitle.replace(/ 学習資料$/, ""), sid, t: pageTitle, h, u, x: join(t.t, t.cap, t.note, ...alts), box: boxMeta(/漫画|イラスト/.test(t.lab || "") ? ( /漫画/.test(t.lab) ? "manga" : "art") : "hari_tips", t.t) });
      }
    }
  }
  addHariGuide("guide/anatomy/content.js", "anatomy", "ana", "解剖学 学習資料", "guide/anatomy/");
  addHariGuide("guide/physiology/content.js", "physiology", "phy", "生理学 学習資料", "guide/physiology/");
  addHariGuide("guide/souron/content.js", "souron", "sor", "臨床医学総論 学習資料", "guide/souron/");
  addHariGuide("guide/kakuron/content.js", "kakuron", "kak", "臨床医学各論 学習資料", "guide/kakuron/");

  if (fs.existsSync(path.join(ROOT, "guide/keiketsu/keiketsu-data.js"))) {
    const k = load(["guide/keiketsu/keiketsu-data.js"]);
    const D = k.KEIKETSU;
    for (const m of (D && D.mers) || []) {
      const pathTxt = (m.path || []).join("、");
      const start = m.start ? join(m.start.name, m.start.kana, m.start.loc) : "";
      const end = m.end ? join(m.end.name, m.end.kana, m.end.loc) : "";
      add({ s: "経絡経穴概論", sid: "kei", t: "経絡経穴 学習資料", h: m.name, u: `guide/keiketsu/#${m.id}`, x: join(m.name, m.short, pathTxt, start && `始：${start}`, end && `終：${end}`) });
      for (const p of m.pts || []) {
        const anat = (p.anat || []).map((a) => a.t).join("\n");
        add({ s: "経絡経穴概論", sid: "kei", t: "経絡経穴 学習資料", h: `${p.name}（${m.short}）`, u: `guide/keiketsu/#pt-${p.code}`, x: join(p.name, p.kana, p.code, p.loc, anat) });
      }
    }
    if (D && D.note) add({ s: "経絡経穴概論", sid: "kei", t: "経絡経穴 学習資料", h: "経絡経穴概論", u: "guide/keiketsu/", x: D.note });
  }
}

const outDir = path.join(ROOT, "search");
fs.mkdirSync(outDir, { recursive: true });
const out = { v: 1, built: new Date().toISOString().slice(0, 10), n: docs.length, docs };
const dest = path.join(outDir, "search-index.json");
fs.writeFileSync(dest, JSON.stringify(out));
const by = {};
docs.forEach((d) => { by[d.s] = (by[d.s] || 0) + 1; });
const bytes = fs.statSync(dest).size;
console.log(JSON.stringify({ portal: isHari ? "hari" : "jusei", docs: docs.length, by, bytes, kb: Math.round(bytes / 102.4) / 10, skipped: skipped.length }, null, 2));
