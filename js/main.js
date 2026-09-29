/* MY ZONE · 主逻辑 */
(() => {
  "use strict";

  const body = document.body;
  const intro = document.getElementById("intro");
  const canvas = document.getElementById("introCanvas");
  const bar = document.getElementById("introBar");
  const pctEl = document.getElementById("introPct");
  const statusEl = document.getElementById("introStatus");
  const skipBtn = document.getElementById("introSkip");
  const replayBtn = document.getElementById("replayIntro");
  const pages = Array.from(document.querySelectorAll(".page"));
  const goEls = Array.from(document.querySelectorAll("[data-go]"));
  const meters = Array.from(document.querySelectorAll(".meter"));

  const INTRO_MS = 6200;
  const STORE_KEY = "my-zone-intro-seen";
  let introRunning = false;
  let introRaf = 0;

  /* ---------- 开屏线框画布 ---------- */
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, DPR = 1;
  let nodes = [];

  function resizeCanvas() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const count = window.innerWidth < 760 ? 42 : 78;
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - .5) * .32,
      vy: (Math.random() - .5) * .32,
      r: Math.random() * 1.8 + .6
    }));
  }

  function drawPolygon(t) {
    const cx = W / 2;
    const cy = H / 2;
    const base = Math.min(W, H) * (.22 + Math.sin(t * 1.7) * .012);
    const pts = [];
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / 3 + t * .22;
      pts.push([cx + Math.cos(a) * base, cy + Math.sin(a) * base]);
    }
    const pts2 = pts.map(([x, y]) => [cx + (x - cx) * .58, cy + (y - cy) * .58]);

    ctx.save();
    ctx.strokeStyle = "rgba(105,230,255,.38)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    pts.concat(pts2).forEach(([x, y], i) => {
      if (i === 0 || i === pts.length) ctx.moveTo(x, y);
      ctx.lineTo(x, y);
    });
    for (let i = 0; i < 3; i++) {
      ctx.moveTo(pts[i][0], pts[i][1]);
      ctx.lineTo(pts2[i][0], pts2[i][1]);
    }
    ctx.stroke();

    ctx.strokeStyle = "rgba(207,255,46,.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const r = base * 1.42;
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2;
      const rr = r * (i % 2 ? .86 : 1);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawIntro(now) {
    const t = now / 1000;
    ctx.clearRect(0, 0, W, H);

    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < 135) {
          ctx.strokeStyle = `rgba(105,230,255,${(1 - d / 135) * .24})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = "rgba(180,238,255,.72)";
    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    drawPolygon(t);
    introRaf = requestAnimationFrame(drawIntro);
  }

  function stopIntroCanvas() {
    cancelAnimationFrame(introRaf);
  }

  /* ---------- 开屏进度 ---------- */
  const messages = [
    [8, "正在校准空洞频率…"],
    [28, "正在接入绳网…"],
    [52, "正在加载代理人档案…"],
    [76, "正在同步兴趣信号…"],
    [94, "信号稳定，准备亮起…"],
    [100, "WELCOME TO MY ZONE"]
  ];

  function setProgress(value) {
    const p = Math.max(0, Math.min(100, Math.round(value)));
    bar.style.width = p + "%";
    pctEl.textContent = p;
    let msg = messages[0];
    for (let i = messages.length - 1; i >= 0; i--) {
      if (p >= messages[i][0]) {
        msg = messages[i];
        break;
      }
    }
    if (msg) statusEl.textContent = msg[1];
  }

  function finishIntro() {
    if (!introRunning) return;
    introRunning = false;
    setProgress(100);

    window.setTimeout(() => {
      body.classList.add("ready");
      intro.classList.add("is-leaving");
      try { sessionStorage.setItem(STORE_KEY, "1"); } catch (_) {}

      window.setTimeout(() => {
        intro.style.display = "none";
        intro.classList.remove("is-leaving");
        stopIntroCanvas();
      }, 980);
    }, 260);
  }

  function runIntro({ force = false } = {}) {
    if (introRunning) return;

    if (!force) {
      let seen = false;
      try { seen = sessionStorage.getItem(STORE_KEY) === "1"; } catch (_) {}
      if (seen) {
        intro.style.display = "none";
        body.classList.add("ready");
        return;
      }
    }

    introRunning = true;
    intro.style.display = "grid";
    intro.classList.remove("is-leaving");
    body.classList.remove("ready");
    resizeCanvas();
    setProgress(0);
    cancelAnimationFrame(introRaf);
    introRaf = requestAnimationFrame(drawIntro);

    const start = performance.now();
    const tick = now => {
      if (!introRunning) return;
      const raw = Math.min(1, (now - start) / INTRO_MS);
      const eased = 1 - Math.pow(1 - raw, 3);
      setProgress(eased * 100);
      if (raw < 1) {
        requestAnimationFrame(tick);
      } else {
        finishIntro();
      }
    };
    requestAnimationFrame(tick);
  }

  /* ---------- 页面路由 ---------- */
  function go(name) {
    const target = pages.find(page => page.dataset.page === name);
    if (!target || target.classList.contains("is-active")) return;

    pages.forEach(page => page.classList.toggle("is-active", page === target));
    target.scrollTop = 0;

    goEls.forEach(el => {
      el.classList.toggle("is-active", el.dataset.go === name);
    });

  }

  meters.forEach(meter => {
    meter.style.setProperty("--val", `${meter.dataset.val}%`);
  });

  skipBtn.onclick = finishIntro;
  replayBtn.onclick = () => runIntro({ force: true });
  window.onhashchange = () => {
    const name = location.hash.replace("#", "") || "home";
    go(name);
  };
  window.onresize = () => {
    if (introRunning) resizeCanvas();
  };

  const initial = location.hash.replace("#", "") || "home";
  go(pages.some(p => p.dataset.page === initial) ? initial : "home");
  runIntro();
})();
