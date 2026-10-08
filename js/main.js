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
  const subpages = Array.from(document.querySelectorAll(".subpage"));
  const subOpeners = Array.from(document.querySelectorAll("[data-sub]"));
  const backBtns = Array.from(document.querySelectorAll("[data-back]"));
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxClose = document.getElementById("lightboxClose");
  const goodsRail = document.getElementById("goodsRail");
  const goodsPause = document.getElementById("goodsPause");
  const memeCards = Array.from(document.querySelectorAll(".meme-card"));
  const memeNote = document.getElementById("memeNote");
  const abstractBtn = document.getElementById("abstractToggle");
  const abstractNote = document.getElementById("abstractNote");

  const audios = {
    meme1: document.getElementById("audio-meme1"),
    meme2: document.getElementById("audio-meme2"),
    meme3: document.getElementById("audio-meme3"),
    abstract: document.getElementById("audio-abstract-bgm")
  };

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
    const inner = pts.map(([x, y]) => [cx + (x - cx) * .58, cy + (y - cy) * .58]);

    ctx.save();
    ctx.strokeStyle = "rgba(105,230,255,.38)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    pts.concat(inner).forEach(([x, y], i) => {
      if (i === 0 || i === pts.length) ctx.moveTo(x, y);
      ctx.lineTo(x, y);
    });
    for (let i = 0; i < 3; i++) {
      ctx.moveTo(pts[i][0], pts[i][1]);
      ctx.lineTo(inner[i][0], inner[i][1]);
    }
    ctx.stroke();

    ctx.strokeStyle = "rgba(207,255,46,.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const ringBase = base * 1.42;
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2;
      const ring = ringBase * (i % 2 ? .86 : 1);
      const x = cx + Math.cos(a) * ring;
      const y = cy + Math.sin(a) * ring;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawIntro(now) {
    const t = now / 1000;
    ctx.clearRect(0, 0, W, H);

    for (const node of nodes) {
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < 0 || node.x > W) node.vx *= -1;
      if (node.y < 0 || node.y > H) node.vy *= -1;
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 135) {
          ctx.strokeStyle = `rgba(105,230,255,${(1 - distance / 135) * .24})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = "rgba(180,238,255,.72)";
    for (const node of nodes) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
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
    let message = messages[0];
    for (let i = messages.length - 1; i >= 0; i--) {
      if (p >= messages[i][0]) {
        message = messages[i];
        break;
      }
    }
    if (message) statusEl.textContent = message[1];
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

  /* ---------- 音频 ---------- */
  function stopAllAudio() {
    Object.values(audios).forEach(audio => {
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
    });
    memeCards.forEach(card => card.classList.remove("is-playing"));
    abstractBtn.classList.remove("is-playing");
    abstractBtn.querySelector("span").textContent = "背景音乐：OFF";
  }

  /* ---------- 页面与子页路由 ---------- */
  function closeSubstage() {
    subpages.forEach(page => page.classList.remove("is-open"));
    stopAllAudio();
  }

  function openSubstage(name) {
    const target = subpages.find(page => page.dataset.subpage === name);
    if (!target) return;
    stopAllAudio();
    subpages.forEach(page => page.classList.remove("is-open"));
    target.scrollTop = 0;
    requestAnimationFrame(() => target.classList.add("is-open"));
  }

  function go(name) {
    const targetName = pages.some(page => page.dataset.page === name) ? name : "home";
    const target = pages.find(page => page.dataset.page === targetName);

    closeSubstage();
    pages.forEach(page => page.classList.toggle("is-active", page === target));
    target.scrollTop = 0;
    goEls.forEach(el => el.classList.toggle("is-active", el.dataset.go === targetName));
  }

  goEls.forEach(el => {
    el.addEventListener("click", event => {
      event.preventDefault();
      const name = el.dataset.go;
      if (location.hash === "#" + name) {
        go(name);
      } else {
        location.hash = name;
      }
    });
  });

  subOpeners.forEach(card => {
    card.addEventListener("click", () => openSubstage(card.dataset.sub));
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openSubstage(card.dataset.sub);
      }
    });
  });

  backBtns.forEach(button => {
    button.addEventListener("click", () => {
      closeSubstage();
      if (location.hash === "#hobby") {
        go("hobby");
      } else {
        location.hash = "hobby";
      }
    });
  });

  /* ---------- 谷子横滑与放大 ---------- */
  function openLightbox(src, alt, caption) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    lightboxCaption.textContent = caption || "";
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
      if (!lightbox.classList.contains("is-open")) lightboxImg.src = "";
    }, 300);
  }

  goodsRail.addEventListener("click", event => {
    const card = event.target.closest(".goods-card");
    if (!card) return;
    openLightbox(card.dataset.full, card.querySelector("img").alt, card.dataset.caption);
  });

  goodsRail.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest(".goods-card");
    if (!card) return;
    event.preventDefault();
    openLightbox(card.dataset.full, card.querySelector("img").alt, card.dataset.caption);
  });

  goodsPause.addEventListener("click", () => {
    const paused = goodsRail.classList.toggle("is-paused");
    goodsPause.querySelector("i").textContent = paused ? "▶" : "Ⅱ";
    goodsPause.querySelector("span").textContent = paused ? "继续滑动" : "暂停滑动";
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", event => {
    if (event.target === lightbox) closeLightbox();
  });

  /* ---------- 玩梗语音 ---------- */
  const defaultMemeNote = memeNote.textContent;
  const memeFileNames = {
    meme1: "meme1.m4a",
    meme2: "meme2.wav",
    meme3: "meme3.m4a"
  };

  memeCards.forEach(card => {
    card.addEventListener("click", () => playMeme(card));
    card.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      playMeme(card);
    });
  });

  function playMeme(card) {
    const audio = audios[card.dataset.audio];
    if (!audio) return;

    Object.entries(audios).forEach(([key, candidate]) => {
      if (key !== card.dataset.audio) {
        candidate.pause();
        candidate.currentTime = 0;
      }
    });
    memeCards.forEach(candidate => candidate.classList.toggle("is-playing", candidate === card));
    audio.currentTime = 0;
    audio.play()
      .then(() => { memeNote.textContent = defaultMemeNote; })
      .catch(() => {
        card.classList.remove("is-playing");
        memeNote.textContent = `语音还没有就位：请把 ${memeFileNames[card.dataset.audio]} 放入 assets/audio。`;
      });
  }

  ["meme1", "meme2", "meme3"].forEach(key => {
    audios[key].addEventListener("ended", () => {
      const card = memeCards.find(item => item.dataset.audio === key);
      if (card) card.classList.remove("is-playing");
    });
    audios[key].addEventListener("error", () => {
      const card = memeCards.find(item => item.dataset.audio === key);
      if (card) card.classList.remove("is-playing");
      memeNote.textContent = `缺少音频文件：assets/audio/${memeFileNames[key]}`;
    });
  });

  /* ---------- 抽象背景音乐 ---------- */
  const defaultAbstractNote = abstractNote.textContent;
  audios.abstract.loop = true;

  abstractBtn.addEventListener("click", () => {
    if (audios.abstract.paused) {
      audios.abstract.play()
        .then(() => { abstractNote.textContent = defaultAbstractNote; })
        .catch(() => {
          abstractBtn.classList.remove("is-playing");
          abstractBtn.querySelector("span").textContent = "背景音乐：OFF";
          abstractNote.textContent = "背景音乐还没有就位：请把 abstract-bgm.mp3 放入 assets/audio。";
        });
    } else {
      audios.abstract.pause();
    }
  });

  audios.abstract.addEventListener("play", () => {
    abstractBtn.classList.add("is-playing");
    abstractBtn.querySelector("span").textContent = "背景音乐：ON";
  });
  audios.abstract.addEventListener("pause", () => {
    abstractBtn.classList.remove("is-playing");
    abstractBtn.querySelector("span").textContent = "背景音乐：OFF";
  });
  audios.abstract.addEventListener("error", () => {
    abstractBtn.classList.remove("is-playing");
    abstractBtn.querySelector("span").textContent = "背景音乐：OFF";
    abstractNote.textContent = "缺少音频文件：assets/audio/abstract-bgm.mp3";
  });

  /* ---------- 初始化 ---------- */
  meters.forEach(meter => meter.style.setProperty("--val", `${meter.dataset.val}%`));
  skipBtn.addEventListener("click", finishIntro);
  replayBtn.addEventListener("click", () => {
    closeSubstage();
    runIntro({ force: true });
  });

  window.addEventListener("hashchange", () => {
    go(location.hash.replace("#", "") || "home");
  });
  window.addEventListener("keydown", event => {
    if (event.key === "Escape") closeLightbox();
  });
  window.addEventListener("resize", () => {
    if (introRunning) resizeCanvas();
  });

  go(location.hash.replace("#", "") || "home");
  runIntro();
})();
