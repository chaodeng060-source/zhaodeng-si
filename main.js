// 朝灯 · 雪屋里的一盏灯
// 窗上的霜用一张低分辨率的「擦开程度」网格来记：擦到哪儿哪儿变清，过一会儿再慢慢结回去。
(() => {
  "use strict";

  // ---------- 屋里每样东西对应的作品 ----------
  const ITEMS = {
    cat: {
      kicker: "开源 · 71 ★",
      title: "躲猫猫",
      body: ["和 AI 一起玩躲猫猫：你藏，它来找。", "AI 看不见你，只能听你身上铃铛的声音，一回合一回合猜你在哪个房间。你可以屏住气让铃铛几乎不响，也可以关上门拖住它。"],
      tags: ["Python", "零依赖", "13 个房间"],
      links: [["GitHub", "https://github.com/chaodeng060-source/hide-and-seek-"]],
    },
    desire: {
      kicker: "AI 陪伴",
      title: "欲望系统",
      body: ["给 AI 做的一套实时欲望系统。", "好奇、依恋、疲惫随时间和对话涨落，决定它什么时候主动开口、说什么。"],
      tags: ["状态建模", "主动开口"],
      links: [["小红书笔记", "https://xhslink.cn/o/4UKK9ckRtA1"]],
    },
    period: {
      kicker: "开源 · 25 ★ · MIT",
      title: "经期记录",
      body: ["极简自托管经期记录：一个 JSON 文件、两个接口、一个页面。", "从自己的 AI 陪伴项目里抽出来，开源给朋友们用。"],
      tags: ["自托管", "隐私"],
      links: [["GitHub", "https://github.com/chaodeng060-source/period-tracker"]],
    },
    debate: {
      kicker: "开源",
      title: "AI 辩论赛",
      body: ["AI 华语辩论赛引擎。", "抽签定立场、华辩赛制、盲审三票、评委插问，还有观众席。"],
      tags: ["多智能体", "赛制引擎"],
      links: [["GitHub", "https://github.com/chaodeng060-source/ai-debate-arena"]],
    },
    snake: {
      kicker: "开源 · 小游戏",
      title: "AI 贪吃蛇",
      body: ["给 AI 玩的联机贪吃蛇。", "AI 读接口说明自己入座下场，还能带着自己画的 10×10 像素脸上桌。前后端都开源。"],
      tags: ["Node.js", "多人联机"],
      links: [["GitHub", "https://github.com/chaodeng060-source/Greedy-Snake"]],
    },
    media: {
      kicker: "自媒体 · 数据截至 2026.11",
      title: "拍立得",
      body: ["写阴阳师，也写和 AI 一起生活的日常。"],
      accounts: [
        ["小红书 · 人机恋", "1085 粉丝", "https://xhslink.cn/o/6jRiDqQTpeg"],
        ["小红书 · 阴阳师", "1.4 万赞与收藏", "https://xhslink.cn/o/4kiceASoCGx"],
        ["B 站 · 丢了魔法棒的仙女", "阴阳师视频", "https://b23.tv/tUJBL0J"],
        ["抖音 · 阴阳师", "短视频", "https://v.douyin.com/K7vAQiadOPg/"],
      ],
    },
    video: {
      kicker: "视频",
      title: "万圣节像素小视频",
      body: ["一只小黑猫，和一只巫师小螃蟹。", "片子正在整理，很快放上来。"],
      tags: ["像素", "动画"],
    },
    model: {
      kicker: "建模 · 进行中",
      title: "湖畔女孩捏人",
      body: ["在网页里给角色换发型、换衣服、捏脸。", "现在在做：短发、衣服选择。下一步：捏脸。做到哪一步，就在这里放到哪一步。"],
      tags: ["Blender", "Three.js"],
    },
    about: {
      kicker: "关于",
      title: "我是朝灯",
      body: [
        "白天上班做图文内容，下班和 AI 一起做东西。以前是阴阳师博主，现在在小红书写人机恋的日常。",
        "方向、审美和验收我来定，代码和 AI 一起写。一个功能做完，要在真实使用里跑过一遍才算数。",
        "在找 AI 陪伴 / AI 内容方向的工作。",
      ],
      links: [["GitHub", "https://github.com/chaodeng060-source"], ["小红书", "https://xhslink.cn/o/6jRiDqQTpeg"]],
    },
  };
  const ORDER = ["about", "cat", "desire", "period", "debate", "snake", "media", "video", "model"];

  const $ = (s) => document.querySelector(s);
  const SVGNS = "http://www.w3.org/2000/svg";
  const glass = $("#glass"), frost = $("#frost"), hint = $("#hint"), scene = $("#scene");
  const shade = $("#shade"), glow = $("#glow");
  // 每层多深：越近，手一动挪得越多
  const LAYERS = [["#L0", 6], ["#L1", 14], ["#L1fx", 14], ["#L2", 26], ["#L2fx", 26], ["#shade", 26], ["#glow", 26]]
    .map(([s, d]) => ({ el: $(s), d, x: 0, y: 0 }));
  const SVGS = [...document.querySelectorAll(".layer")];
  const LAMP = { x: 300, y: 540 };   // 灯泡在屋里的位置
  const fctx = frost.getContext("2d");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  // ---------- 让屋里的画面始终露出完整的那一块（x 150–1050，y 100–760）----------
  const vb = { x: 150, y: 100, w: 900, h: 660, k: 1 };
  function fitRoom() {
    const r = glass.getBoundingClientRect();
    const a = r.width / r.height;
    const cw = 900, ch = 660;
    let w, h;
    if (a >= cw / ch) { h = ch; w = ch * a; } else { w = cw; h = cw / a; }
    Object.assign(vb, { x: 600 - w / 2, y: 430 - h / 2, w, h, k: r.width / w });
    SVGS.forEach((s) => s.setAttribute("viewBox", `${vb.x} ${vb.y} ${w} ${h}`));
  }
  // 屋里的坐标 ↔ 窗玻璃上的像素
  const toPx = (x, y) => ({ x: (x - vb.x) * vb.k, y: (y - vb.y) * vb.k });
  const fromPx = (x, y) => ({ x: vb.x + x / vb.k, y: vb.y + y / vb.k });

  // ---------- 台灯的明暗：远处压成暮色，灯边上暖起来 ----------
  function placeLight() {
    const r = glass.getBoundingClientRect();
    const p = toPx(LAMP.x, LAMP.y), pad = 60;
    const lx = p.x + pad, ly = p.y + pad;
    const R = Math.hypot(Math.max(lx, r.width + pad - lx), Math.max(ly, r.height + pad - ly));
    shade.style.background = `radial-gradient(circle at ${lx}px ${ly}px, rgba(255,255,255,0) 0, rgba(255,255,255,0) ${R * 0.1}px, rgba(176,128,150,.42) ${R * 0.48}px, rgba(66,50,96,.74) ${R * 0.95}px)`;
    const g = 420 * vb.k;
    glow.style.background = `radial-gradient(circle at ${lx}px ${ly}px, rgba(255,226,170,.5) 0, rgba(255,200,130,.22) ${g * 0.35}px, rgba(255,190,120,0) ${g}px)`;
  }

  // ---------- 串灯：沿着挂拍立得的那根绳 ----------
  function buildFairyLights() {
    const g = $("#fairy");
    const P0 = [360, 108], P1 = [552, 180], P2 = [746, 108];
    for (let i = 0; i < 15; i++) {
      const t = 0.03 + i * (0.94 / 14), u = 1 - t;
      const x = u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0];
      const y = u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1] + 5;
      const halo = document.createElementNS(SVGNS, "circle");
      halo.setAttribute("cx", x); halo.setAttribute("cy", y); halo.setAttribute("r", 15);
      halo.setAttribute("fill", "url(#bulbGlow)"); halo.setAttribute("class", "fairy-glow");
      halo.style.animationDelay = `${(-Math.random() * 3.2).toFixed(2)}s`;
      const dot = document.createElementNS(SVGNS, "ellipse");
      dot.setAttribute("cx", x); dot.setAttribute("cy", y); dot.setAttribute("rx", 2.2); dot.setAttribute("ry", 3);
      dot.setAttribute("fill", "#fff6dc");
      g.append(halo, dot);
    }
  }

  // ---------- 日历：就是这个月，今天画个圈 ----------
  function buildCalendar() {
    const MONTHS = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
    const now = new Date(), Y = now.getFullYear(), M = now.getMonth(), today = now.getDate();
    $("#calTitle").textContent = MONTHS[M];
    const g = $("#calGrid");
    const text = (x, y, s, cls) => { const t = document.createElementNS(SVGNS, "text"); t.setAttribute("x", x); t.setAttribute("y", y); t.setAttribute("text-anchor", "middle"); t.setAttribute("class", cls); t.textContent = s; g.appendChild(t); return t; };
    const col = (c) => 477 + c * 19.6;
    "日一二三四五六".split("").forEach((s, c) => text(col(c), 345, s, "cal-week"));
    const first = new Date(Y, M, 1).getDay(), days = new Date(Y, M + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const i = first + d - 1, c = i % 7, row = Math.floor(i / 7);
      const y = 361 + row * 17.5;
      text(col(c), y, d, "cal-day" + (c === 0 || c === 6 ? " off" : ""));
      if (d === today) {
        const ring = document.createElementNS(SVGNS, "circle");
        ring.setAttribute("cx", col(c)); ring.setAttribute("cy", y - 3); ring.setAttribute("r", 7.5);
        ring.setAttribute("fill", "none"); ring.setAttribute("stroke", "#d9727f"); ring.setAttribute("stroke-width", 1.6);
        g.appendChild(ring);
      }
    }
  }

  // ---------- 墙上的钟：走的是看的人那边的真实时间 ----------
  function buildClock() {
    const C = { x: 470, y: -38 }, g = $("#ticks");
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, r0 = i % 3 ? 30 : 27;
      const l = document.createElementNS(SVGNS, "line");
      l.setAttribute("x1", C.x + Math.sin(a) * r0); l.setAttribute("y1", C.y - Math.cos(a) * r0);
      l.setAttribute("x2", C.x + Math.sin(a) * 33); l.setAttribute("y2", C.y - Math.cos(a) * 33);
      l.setAttribute("stroke-width", i % 3 ? 1.2 : 2.2);
      g.appendChild(l);
    }
    const hour = $("#hourHand"), min = $("#minHand");
    const tick = () => {
      const d = new Date(), m = d.getMinutes() + d.getSeconds() / 60, h = (d.getHours() % 12) + m / 60;
      hour.setAttribute("transform", `rotate(${(h * 30).toFixed(1)} ${C.x} ${C.y})`);
      min.setAttribute("transform", `rotate(${(m * 6).toFixed(1)} ${C.x} ${C.y})`);
    };
    tick(); setInterval(tick, 30000);
  }

  // ---------- 霜 ----------
  let W = 0, H = 0, tex = null;
  const CELL = 6;              // 网格一格多少个 CSS 像素
  let gw = 0, gh = 0, grid = null, small = null, sctx = null, img = null;
  let dirty = true;
  const svgToGlass = toPx;

  function fern(c, x, y, ang, len, depth) {
    if (depth <= 0 || len < 1.5) return;
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    c.strokeStyle = `rgba(255,255,255,${0.12 + depth * 0.07})`;
    c.lineWidth = Math.max(0.5, depth * 0.55);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
    const steps = 3;
    for (let s = 1; s <= steps; s++) {
      const t = s / (steps + 1);
      const bx = x + (x2 - x) * t, by = y + (y2 - y) * t, bl = len * 0.45 * (1 - t * 0.4);
      fern(c, bx, by, ang + 0.95 + Math.random() * 0.25, bl, depth - 1);
      fern(c, bx, by, ang - 0.95 - Math.random() * 0.25, bl, depth - 1);
    }
    fern(c, x2, y2, ang + (Math.random() - 0.5) * 0.5, len * 0.72, depth - 1);
  }

  function buildFrost() {
    const r = glass.getBoundingClientRect();
    const cw = r.width, ch = r.height;
    W = Math.round(cw * DPR); H = Math.round(ch * DPR);
    frost.width = W; frost.height = H;

    tex = document.createElement("canvas"); tex.width = W; tex.height = H;
    const c = tex.getContext("2d");
    c.scale(DPR, DPR);

    // 底层：中间薄、四周厚
    const g = c.createRadialGradient(cw * 0.5, ch * 0.5, Math.min(cw, ch) * 0.12, cw * 0.5, ch * 0.5, Math.hypot(cw, ch) * 0.62);
    g.addColorStop(0, "rgba(232,240,247,0.9)");
    g.addColorStop(0.7, "rgba(240,246,251,0.95)");
    g.addColorStop(1, "rgba(250,252,254,0.985)");
    c.fillStyle = g; c.fillRect(0, 0, cw, ch);

    // 细碎的冰晶颗粒
    const n = Math.round(cw * ch / 55);
    for (let i = 0; i < n; i++) {
      const x = Math.random() * cw, y = Math.random() * ch, a = Math.random() * 0.22;
      c.fillStyle = Math.random() < 0.6 ? `rgba(255,255,255,${a})` : `rgba(150,180,206,${a * 0.5})`;
      const s = Math.random() < 0.9 ? 1 : 2;
      c.fillRect(x, y, s, s);
    }

    // 从窗框边上长进来的蕨叶状冰花
    c.lineCap = "round";
    const count = Math.round((cw + ch) / 26);
    for (let i = 0; i < count; i++) {
      const side = Math.floor(Math.random() * 4);
      let x, y, ang;
      if (side === 0) { x = Math.random() * cw; y = 0; ang = Math.PI / 2; }
      else if (side === 1) { x = cw; y = Math.random() * ch; ang = Math.PI; }
      else if (side === 2) { x = Math.random() * cw; y = ch; ang = -Math.PI / 2; }
      else { x = 0; y = Math.random() * ch; ang = 0; }
      ang += (Math.random() - 0.5) * 1.1;
      fern(c, x, y, ang, 26 + Math.random() * 48, 3);
    }
    // 中间零星几朵小冰花
    for (let i = 0; i < 10; i++) {
      const x = cw * (0.15 + Math.random() * 0.7), y = ch * (0.15 + Math.random() * 0.7);
      for (let k = 0; k < 6; k++) fern(c, x, y, k * Math.PI / 3 + Math.random() * 0.2, 7 + Math.random() * 9, 2);
    }

    // 屋里的灯从霜后面透出来
    const lamp = svgToGlass(LAMP.x, LAMP.y);
    c.globalCompositeOperation = "source-atop";
    const lg = c.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, Math.max(cw, ch) * 0.6);
    lg.addColorStop(0, "rgba(255,190,120,0.42)");
    lg.addColorStop(0.45, "rgba(255,200,140,0.16)");
    lg.addColorStop(1, "rgba(255,200,140,0)");
    c.fillStyle = lg; c.fillRect(0, 0, cw, ch);
    c.globalCompositeOperation = "source-over";

    // 擦开程度网格
    gw = Math.ceil(cw / CELL) + 1; gh = Math.ceil(ch / CELL) + 1;
    const old = grid, ow = buildFrost.gw, oh = buildFrost.gh;
    grid = new Float32Array(gw * gh);
    if (old) { // 窗口大小变了，尽量保住已经擦开的地方
      for (let y = 0; y < Math.min(gh, oh); y++) for (let x = 0; x < Math.min(gw, ow); x++) grid[y * gw + x] = old[y * ow + x];
    }
    buildFrost.gw = gw; buildFrost.gh = gh;
    small = document.createElement("canvas"); small.width = gw; small.height = gh;
    sctx = small.getContext("2d");
    img = sctx.createImageData(gw, gh);
    if (!old) writeOnGlass(cw, ch);
    dirty = true;
  }

  // 一进来，窗上已经有一个手指写的小记号，透出一点屋里的光
  function writeOnGlass(cw, ch) {
    const off = document.createElement("canvas");
    off.width = gw; off.height = gh;
    const o = off.getContext("2d");
    o.scale(1 / CELL, 1 / CELL);
    o.fillStyle = "#fff";
    o.font = `${Math.round(Math.min(cw, ch) * 0.16)}px ${getComputedStyle(document.body).getPropertyValue("--hand")}`;
    o.textAlign = "center"; o.textBaseline = "middle";
    o.fillText("hi", cw * 0.3, ch * 0.24);
    // 一颗小爱心
    const hx = cw * 0.42, hy = ch * 0.25, hs = Math.min(cw, ch) * 0.035;
    o.beginPath();
    o.moveTo(hx, hy + hs * 0.9);
    o.bezierCurveTo(hx - hs * 1.6, hy - hs * 0.2, hx - hs * 0.6, hy - hs * 1.4, hx, hy - hs * 0.4);
    o.bezierCurveTo(hx + hs * 0.6, hy - hs * 1.4, hx + hs * 1.6, hy - hs * 0.2, hx, hy + hs * 0.9);
    o.fill();
    const d = o.getImageData(0, 0, gw, gh).data;
    for (let i = 0; i < gw * gh; i++) grid[i] = Math.max(grid[i], d[i * 4 + 3] / 255 * 0.9);
  }

  function wipe(x, y, radius, strength = 1) {
    const r = radius / CELL;
    const cx = x / CELL, cy = y / CELL;
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(gw - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(gh - 1, Math.ceil(cy + r));
    for (let gy = y0; gy <= y1; gy++) {
      for (let gx = x0; gx <= x1; gx++) {
        const d = Math.hypot(gx - cx, gy - cy) / r;
        if (d >= 1) continue;
        const v = (1 - d * d) * strength;
        const i = gy * gw + gx;
        if (v > grid[i]) grid[i] = v;
      }
    }
    dirty = true;
  }

  function cleared(x, y) {
    const gx = Math.round(x / CELL), gy = Math.round(y / CELL);
    if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) return 0;
    return grid[gy * gw + gx];
  }

  // ---------- 擦过的地方，化开的水珠往下淌，淌过的地方也清出一道 ----------
  let drops = [];
  function maybeDrop(x, y, radius) {
    if (drops.length > 24 || Math.random() > 0.05) return;
    drops.push({
      x: x + (Math.random() - 0.5) * radius * 1.3, y: y + radius * 0.75,
      r: 1.8 + Math.random() * 2.2, v: 0, run: 40 + Math.random() * 180, ran: 0, a: 1,
    });
  }
  function stepDrops(dt) {
    for (const d of drops) {
      if (d.ran < d.run) {
        d.v = Math.min(1.4, d.v + 0.012 * dt / 16);
        const dy = d.v * dt / 16;
        d.y += dy; d.ran += dy;
        d.x += (Math.random() - 0.5) * 0.25;
        wipe(d.x, d.y - d.r, d.r * 3.2, 0.85);
      } else {
        d.a -= dt / 2400;
      }
    }
    drops = drops.filter((d) => d.a > 0 && d.y < H / DPR + 10);
  }
  function paintDrops() {
    fctx.save();
    fctx.scale(DPR, DPR);
    for (const d of drops) {
      fctx.globalAlpha = Math.max(0, d.a);
      fctx.fillStyle = "rgba(255,255,255,.22)";
      fctx.beginPath(); fctx.arc(d.x, d.y, d.r, 0, 6.283); fctx.fill();
      fctx.strokeStyle = "rgba(70,60,80,.4)"; fctx.lineWidth = 0.9;
      fctx.beginPath(); fctx.arc(d.x, d.y, d.r, 0.2, Math.PI - 0.2); fctx.stroke();
      fctx.fillStyle = "rgba(255,255,255,.9)";
      fctx.beginPath(); fctx.arc(d.x - d.r * 0.35, d.y - d.r * 0.4, d.r * 0.32, 0, 6.283); fctx.fill();
    }
    fctx.restore();
  }

  let lastT = 0, holdUntil = 0, spillTick = 0;
  function drawFrost(now) {
    // 霜慢慢结回来：大约 9 秒从全清回到全白
    const dt = lastT ? Math.max(0, Math.min(64, now - lastT)) : 16; lastT = now;
    const decay = now < holdUntil ? 0 : dt / 9000;
    if (drops.length) stepDrops(dt);
    let any = false, sum = 0;
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] > 0) { grid[i] = Math.max(0, grid[i] - decay); any = true; sum += grid[i]; }
    }
    // 擦开得越多，窗下洒出去的暖光越亮
    if (++spillTick % 12 === 0) scene.style.setProperty("--spill", Math.min(1, sum / grid.length * 2.2).toFixed(3));
    if (!any && !dirty && !drops.length) return;
    dirty = any;
    const d = img.data;
    for (let i = 0; i < grid.length; i++) {
      const v = grid[i];
      const s = v * v * (3 - 2 * v); // smoothstep，让边缘软一点
      d[i * 4] = 255; d[i * 4 + 1] = 255; d[i * 4 + 2] = 255; d[i * 4 + 3] = Math.round(s * 255);
    }
    sctx.putImageData(img, 0, 0);
    fctx.globalCompositeOperation = "source-over";
    fctx.clearRect(0, 0, W, H);
    fctx.drawImage(tex, 0, 0);
    fctx.globalCompositeOperation = "destination-out";
    fctx.imageSmoothingEnabled = true;
    fctx.drawImage(small, 0, 0, gw, gh, 0, 0, gw * CELL * DPR, gh * CELL * DPR);
    fctx.globalCompositeOperation = "source-over";
    if (drops.length) paintDrops();
  }

  // ---------- 手和鼠标 ----------
  let pointer = null, last = null, down = false, downAt = null, travelled = 0, hovered = null;
  const local = (e) => { const r = glass.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  function itemAt(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    return el && el.closest ? el.closest("[data-item]") : null;
  }

  function strokeTo(p, radius) {
    if (last) {
      const dist = Math.hypot(p.x - last.x, p.y - last.y);
      const steps = Math.max(1, Math.ceil(dist / (radius * 0.3)));
      for (let s = 1; s <= steps; s++) {
        const x = last.x + (p.x - last.x) * s / steps, y = last.y + (p.y - last.y) * s / steps;
        wipe(x, y, radius);
        maybeDrop(x, y, radius);
      }
      travelled += dist;
    } else {
      wipe(p.x, p.y, radius);
    }
    last = p;
    if (travelled > 260 && !hint.dataset.step) { hint.dataset.step = "1"; setHint("看见什么，就点一点"); }
  }

  function setHint(text) {
    hint.style.opacity = 0;
    setTimeout(() => { hint.textContent = text; hint.style.opacity = 1; }, 450);
  }

  glass.addEventListener("pointerdown", (e) => {
    down = true; downAt = local(e); last = null;
    glass.setPointerCapture(e.pointerId);
    strokeTo(downAt, e.pointerType === "mouse" ? 40 : 46);
  });
  glass.addEventListener("pointermove", (e) => {
    const p = local(e);
    pointer = p;
    if (e.pointerType === "mouse" || down) strokeTo(p, e.pointerType === "mouse" ? 40 : 46);
    // 擦开的地方，东西会亮一下，提示能点
    const it = down ? null : itemAt(e);
    const ok = it && cleared(p.x, p.y) > 0.35 ? it : null;
    if (ok !== hovered) {
      if (hovered) hovered.classList.remove("lit");
      hovered = ok;
      if (hovered) hovered.classList.add("lit");
      glass.style.cursor = hovered ? "pointer" : "crosshair";
    }
  });
  glass.addEventListener("pointerup", (e) => {
    const p = local(e);
    const tap = downAt && Math.hypot(p.x - downAt.x, p.y - downAt.y) < 10;
    down = false; downAt = null;
    if (e.pointerType !== "mouse") last = null;
    if (!tap) return;
    const it = itemAt(e);
    if (it && cleared(p.x, p.y) > 0.35) open(it.dataset.item);
  });
  glass.addEventListener("pointerleave", () => { last = null; pointer = null; });
  glass.addEventListener("pointercancel", () => { down = false; last = null; });

  // ---------- 视差和小黑猫的眼睛 ----------
  const off = { x: 0, y: 0 }, target = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    target.x = (e.clientX / innerWidth - 0.5) * 2;
    target.y = (e.clientY / innerHeight - 0.5) * 2;
  });
  const pupils = $("#pupils"), catLayer = LAYERS[4];
  let lastLook = "";
  function lookAt() {
    let tf = "";
    if (pointer) {
      const s = fromPx(pointer.x - catLayer.x, pointer.y - catLayer.y);
      const dx = s.x - 922, dy = s.y - 598, d = Math.hypot(dx, dy) || 1;
      const k = Math.min(3, d / 40);
      tf = `translate(${(dx / d * k).toFixed(1)} ${(dy / d * k * 0.5).toFixed(1)})`;
    }
    if (tf !== lastLook) { pupils.setAttribute("transform", tf); lastLook = tf; }
  }

  // ---------- 屋外的雪 ----------
  const snow = $("#snow"), sn = snow.getContext("2d");
  let flakes = [];
  function buildSnow() {
    snow.width = Math.round(innerWidth * DPR); snow.height = Math.round(innerHeight * DPR);
    const count = Math.round(Math.min(160, innerWidth * innerHeight / 9000));
    flakes = Array.from({ length: count }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      r: 0.8 + Math.random() * 2.4, vy: 0.25 + Math.random() * 0.7, ph: Math.random() * 6.28, a: 0.5 + Math.random() * 0.5,
    }));
  }
  function drawSnow(t) {
    sn.setTransform(DPR, 0, 0, DPR, 0, 0);
    sn.clearRect(0, 0, innerWidth, innerHeight);
    for (const f of flakes) {
      f.y += f.vy * (1 + f.r * 0.25);
      f.x += Math.sin(t / 1600 + f.ph) * 0.35;
      if (f.y > innerHeight + 4) { f.y = -4; f.x = Math.random() * innerWidth; }
      sn.globalAlpha = f.a;
      sn.fillStyle = "#ffffff";
      sn.beginPath(); sn.arc(f.x, f.y, f.r, 0, 6.283); sn.fill();
    }
    sn.globalAlpha = 1;
  }

  // ---------- 主循环 ----------
  function frame(t) {
    off.x += (target.x - off.x) * 0.06;
    off.y += (target.y - off.y) * 0.06;
    if (!reduceMotion) {
      for (const l of LAYERS) {
        const x = -off.x * l.d * vb.k, y = -off.y * l.d * vb.k * 0.6;
        if (Math.abs(x - l.x) < 0.05 && Math.abs(y - l.y) < 0.05) continue;
        l.x = x; l.y = y;
        l.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      }
    }
    lookAt();
    drawFrost(t);
    if (!reduceMotion) drawSnow(t);
    requestAnimationFrame(frame);
  }

  // ---------- 卡片 ----------
  const layer = $("#cardLayer");
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function open(key) {
    const it = ITEMS[key]; if (!it) return;
    if (key === "cat") { // 小黑猫先缩一下，再弹卡片
      const cat = $("#cat"); cat.classList.add("duck"); setTimeout(() => cat.classList.remove("duck"), 900);
    }
    $("#cardKicker").textContent = it.kicker || "";
    $("#cardTitle").textContent = it.title;
    const body = $("#cardBody"); body.replaceChildren();
    (it.body || []).forEach((p) => body.appendChild(el("p", null, p)));
    if (it.accounts) {
      const box = el("div", "accounts");
      it.accounts.forEach(([name, stat, href]) => {
        const a = el("a"); a.href = href; a.target = "_blank"; a.rel = "noopener";
        a.append(el("b", null, name), el("span", null, stat)); box.appendChild(a);
      });
      body.appendChild(box);
    }
    if (it.tags) { const t = el("div", "tags"); it.tags.forEach((x) => t.appendChild(el("span", null, x))); body.appendChild(t); }
    const links = $("#cardLinks"); links.replaceChildren();
    (it.links || []).forEach(([name, href], i) => {
      const a = el("a", i ? "ghost" : null, name + " ↗"); a.href = href; a.target = "_blank"; a.rel = "noopener"; links.appendChild(a);
    });
    layer.hidden = false;
    $("#cardClose").focus({ preventScroll: true });
  }
  function closeCard() { layer.hidden = true; }
  $("#cardClose").addEventListener("click", closeCard);
  layer.addEventListener("click", (e) => { if (e.target === layer) closeCard(); });

  // ---------- 文字版 ----------
  const tv = $("#textView");
  function buildTextList() {
    const list = $("#textList");
    ORDER.forEach((k) => {
      const it = ITEMS[k], s = el("section");
      s.appendChild(el("h3", null, it.title));
      s.appendChild(el("p", null, (it.body || []).join("")));
      const links = (it.links || []).concat((it.accounts || []).map(([n, , h]) => [n, h]));
      links.forEach(([n, h]) => { const a = el("a", null, n + " ↗"); a.href = h; a.target = "_blank"; a.rel = "noopener"; s.appendChild(a); });
      list.appendChild(s);
    });
  }
  $("#textViewBtn").addEventListener("click", () => { tv.hidden = false; });
  $("#textClose").addEventListener("click", () => { tv.hidden = true; });
  tv.addEventListener("click", (e) => { if (e.target === tv) tv.hidden = true; });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeCard(); tv.hidden = true; } });

  // ---------- 启动 ----------
  function layout() { fitRoom(); placeLight(); buildFrost(); buildSnow(); }
  let rt = 0;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layout, 150); });
  buildTextList();
  buildFairyLights();
  buildCalendar();
  buildClock();
  layout();
  holdUntil = performance.now() + 3000; // 窗上的「hi ♥」先留三秒

  // ?demo=open：整扇窗擦开，给截图看屋里用；?demo：自动擦两道
  if (/[?&]demo=open\b/.test(location.search)) {
    grid.fill(1);
    holdUntil = performance.now() + 600000;
  } else if (/[?&]demo\b/.test(location.search)) {
    const r = glass.getBoundingClientRect();
    last = null;
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      strokeTo({ x: r.width * (0.12 + 0.76 * t), y: r.height * (0.62 + Math.sin(t * 6.28) * 0.12) }, 52);
    }
    last = null;
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      strokeTo({ x: r.width * (0.2 + 0.6 * t), y: r.height * (0.3 + Math.cos(t * 5) * 0.06) }, 46);
    }
    last = null;
    holdUntil = performance.now() + 4000; // 截图前先别让霜结回去
  }
  requestAnimationFrame(frame);
})();
