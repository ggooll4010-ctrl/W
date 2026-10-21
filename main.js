/* ============================================================
   모든 페이지에서 공통으로 쓰는 스크립트
   - 별/반딧불 하늘
   - 왼쪽 위 메뉴
   - 페이지별 화면 그리기 (data.js의 내용을 읽어서)
   ============================================================ */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const rand = (a, b) => a + Math.random() * (b - a);
  const page = (document.querySelector("[data-page]") || document.body).dataset.page; // home | characters | details

  /* ───────── 1. 별과 반딧불 ───────── */
  const sky = document.createElement("div");
  sky.className = "sky";
  for (let i = 0; i < 70; i++) {
    const s = document.createElement("span");
    const size = rand(1, 3);
    s.className = "star";
    s.style.cssText =
      `left:${rand(0, 100)}%;top:${rand(0, 100)}%;width:${size}px;height:${size}px;` +
      `--d:${rand(2.5, 6)}s;animation-delay:${rand(0, 5)}s`;
    sky.appendChild(s);
  }
  for (let i = 0; i < 14; i++) {
    const f = document.createElement("span");
    f.className = "firefly";
    f.style.cssText =
      `left:${rand(0, 100)}%;top:${rand(0, 70)}%;` +
      `--d:${rand(7, 14)}s;--dx:${rand(-60, 60)}px;animation-delay:${rand(0, 10)}s`;
    sky.appendChild(f);
  }
  document.body.prepend(sky);
  if (page !== "home") document.body.classList.add("plain");

  /* ───────── 2. 메뉴 ───────── */
  const MENU = [
    { label: "처음으로", href: "index.html" },
    { label: "세계관 소개", href: "index.html#world" },
    // 캐릭터가 하나라도 있을 때만 메뉴에 나타나요
    ...(CHARACTERS.length ? [{ label: "캐릭터", href: "characters.html" }] : []),
    {
      group: "세부사항",
      items: Object.entries(DETAILS).map(([key, d]) => ({ label: d.label, href: `details.html#${key}` }))
    }
  ];
  const link = (l) => `<a href="${l.href}">${l.label}</a>`;
  const navHTML = MENU.map((m) =>
    m.group ? `<p class="drawer-group">${m.group}</p>${m.items.map(link).join("")}` : link(m)
  ).join("");

  document.body.insertAdjacentHTML(
    "beforeend",
    `<button class="menu-btn" aria-label="메뉴 열기" aria-expanded="false"><i></i><i></i><i></i></button>
     <div class="scrim"></div>
     <nav class="drawer" aria-label="메뉴"><p class="drawer-title">${WORLD.title}</p>${navHTML}</nav>`
  );

  const btn = $(".menu-btn"), scrim = $(".scrim"), drawer = $(".drawer");
  const setMenu = (open) => {
    btn.classList.toggle("open", open);
    scrim.classList.toggle("open", open);
    drawer.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open);
    btn.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  };
  btn.addEventListener("click", () => setMenu(!drawer.classList.contains("open")));
  scrim.addEventListener("click", () => setMenu(false));
  drawer.addEventListener("click", (e) => e.target.closest("a") && setMenu(false));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

  const markCurrent = () => {
    const cur = (location.pathname.split("/").pop() || "index.html") + location.hash;
    drawer.querySelectorAll("a").forEach((a) =>
      a.toggleAttribute("aria-current", a.getAttribute("href") === cur)
    );
  };
  markCurrent();
  window.addEventListener("hashchange", markCurrent);

  /* ───────── 3-A. 홈: 장면마다 배경이 바뀌는 세계관 소개 ───────── */
  if (page === "home") {
    const bgs = [WORLD.hero.bg, ...WORLD.scenes.map((s) => s.bg)];
    const layerCSS = (b) =>
      `radial-gradient(circle at ${b.x}% ${b.y}%, ${b.glow}66 0, transparent 40%),` +
      `linear-gradient(170deg, ${b.colors.join(",")})`;

    const layers = document.createElement("div");
    layers.className = "bgs";
    layers.innerHTML = bgs.map((b) => `<div class="bg-layer" style="background:${layerCSS(b)}"></div>`).join("");
    document.body.prepend(layers);

    $("#story").innerHTML = WORLD.scenes
      .map((s, i) => {
        const links = s.links
          ? `<div>${s.links.map((l) => `<a class="btn" href="${l.href}">${l.label}</a>`).join("")}</div>`
          : "";
        return `<section class="scene" data-scene="${i + 1}" ${i === 0 ? 'id="world"' : ""}>
          <div class="scene-card">
            <div class="glyph">${s.glyph}</div>
            <p class="eyebrow">${s.eyebrow}</p>
            <h2>${s.title}</h2>
            ${s.text.map((p) => `<p>${p}</p>`).join("")}
            ${links}
          </div>
        </section>`;
      })
      .join("");

    const secs = [...document.querySelectorAll("[data-scene]")];

    const dots = document.createElement("div");
    dots.className = "dots";
    dots.innerHTML = secs.map((_, i) => `<button aria-label="${i}번째 장면으로 이동"></button>`).join("");
    document.body.appendChild(dots);
    [...dots.children].forEach((d, i) => d.addEventListener("click", () => secs[i].scrollIntoView({ behavior: "smooth" })));

    const layerEls = [...layers.children];
    const dotEls = [...dots.children];
    const setActive = (i) => {
      layerEls.forEach((l, k) => l.classList.toggle("on", k === i));
      dotEls.forEach((d, k) => d.classList.toggle("on", k === i));
      document.documentElement.style.setProperty("--accent", bgs[i].accent);
    };
    setActive(0);

    // 화면 가운데에 걸친 장면 → 배경 교체
    const focus = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(+e.target.dataset.scene)),
      { rootMargin: "-45% 0px -45% 0px" }
    );
    // 화면에 들어오면 카드가 떠오르며 나타남
    const reveal = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("seen")),
      { threshold: 0.3 }
    );
    secs.forEach((s) => { focus.observe(s); reveal.observe(s); });
  }

  /* ───────── 3-B. 캐릭터 ───────── */
  if (page === "characters") {
    const grid = $("#grid"), modal = $("#modal"), body = $("#modal-body");
    const portrait = (c) =>
      `<div class="portrait">${c.image ? `<img src="${c.image}" alt="${c.name}" loading="lazy">` : `<span>${c.emoji || "✦"}</span>`}</div>`;
    const lines = (t) => (Array.isArray(t) ? t : [t]).map((p) => `<p>${p}</p>`).join("");

    // 세력(FACTIONS 순서)별로 묶고, 같은 세력 안에서는 계급 순서대로 정렬해요
    const rankOf = (f, r) => { const k = f.ranks.indexOf(r); return k < 0 ? 999 : k; };
    const everyone = CHARACTERS.map((c, i) => ({ c, i }));
    const groups = FACTIONS.map((f) => ({
      name: f.name,
      color: f.color,
      list: everyone.filter((x) => x.c.faction === f.name).sort((a, b) => rankOf(f, a.c.rank) - rankOf(f, b.c.rank) || a.i - b.i)
    }));
    const rest = everyone.filter((x) => !FACTIONS.some((f) => f.name === x.c.faction));
    if (rest.length) groups.push({ name: "그 밖의 사람들", color: "#dfe8ff", list: rest });
    const shownGroups = groups.filter((g) => g.list.length);

    const cardHTML = ({ c, i }, k) =>
      `<button class="card char" data-i="${i}" style="--c:${c.color};animation-delay:${Math.min(k, 10) * 0.06}s">
        ${portrait(c)}<h3>${c.name}</h3><p class="role">${c.rank}</p><p class="intro">${c.intro}</p>
      </button>`;

    const tabsEl = $("#factabs");
    let current = "all";
    const draw = () => {
      tabsEl.querySelectorAll(".factab").forEach((t) => {
        const on = t.dataset.k === current;
        t.classList.toggle("on", on);
        t.setAttribute("aria-pressed", on);
      });
      const shown = shownGroups.filter((g) => current === "all" || g.name === current);
      grid.innerHTML = CHARACTERS.length
        ? shown
            .map(
              (g) => `<section class="group" style="--g:${g.color}">
          <h2 class="group-head">${g.name}<em>${g.list.length}명</em></h2>
          <div class="grid">${g.list.map(cardHTML).join("")}</div>
        </section>`
            )
            .join("")
        : `<p class="empty">아직 공개된 캐릭터가 없어요.</p>`;
    };
    tabsEl.hidden = !CHARACTERS.length;
    tabsEl.innerHTML = [{ name: "all", n: CHARACTERS.length, color: "var(--accent)" }, ...shownGroups.map((g) => ({ name: g.name, n: g.list.length, color: g.color }))]
      .map((t) => `<button class="factab" data-k="${t.name}" style="--g:${t.color}">${t.name === "all" ? "전체" : t.name}<em>${t.n}</em></button>`)
      .join("");
    tabsEl.addEventListener("click", (e) => {
      const t = e.target.closest(".factab");
      if (!t) return;
      current = t.dataset.k;
      draw();
    });
    draw();

    const close = () => modal.classList.remove("open");
    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".char");
      if (!card) return;
      const c = CHARACTERS[+card.dataset.i];
      body.style.setProperty("--c", c.color);
      const profile = (c.profile || []).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
      body.innerHTML = `${portrait(c)}<h2>${c.name}</h2><p class="role">${c.faction} · ${c.rank}</p>
        ${c.keywords ? `<div class="chips">${c.keywords.map((t) => `<span>${t}</span>`).join("")}</div>` : ""}
        ${profile ? `<dl class="profile">${profile}</dl>` : ""}
        ${(c.sections || []).map((s) => `<section class="sec"><h4>${s.label}</h4>${lines(s.text)}</section>`).join("")}
        ${c.owner ? `<p class="owner">오너 · ${c.owner}</p>` : ""}`;
      body.parentElement.scrollTop = 0;
      modal.classList.add("open");
    });
    modal.addEventListener("click", (e) => (e.target === modal || e.target.closest(".modal-close")) && close());
    document.addEventListener("keydown", (e) => e.key === "Escape" && close());
  }

  /* ───────── 3-C. 세부사항 ───────── */
  if (page === "details") {
    const keys = Object.keys(DETAILS);
    const tabs = $("#tabs"), lead = $("#lead"), list = $("#list");
    tabs.innerHTML = keys.map((k) => `<button class="tab" data-k="${k}">${DETAILS[k].label}</button>`).join("");

    const show = (k) => {
      const d = DETAILS[k];
      tabs.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t.dataset.k === k));
      lead.textContent = d.lead;
      list.innerHTML = d.items
        .map(
          (it, i) => `<article class="card detail" style="animation-delay:${i * 0.08}s">
            <div class="glyph">${it.glyph}</div><h3>${it.name}</h3><p>${it.text}</p>
            ${it.meta ? `<p class="meta">${it.meta}</p>` : ""}
          </article>`
        )
        .join("");
    };
    const fromHash = () => (DETAILS[location.hash.slice(1)] ? location.hash.slice(1) : keys[0]);

    tabs.addEventListener("click", (e) => {
      const t = e.target.closest(".tab");
      if (!t) return;
      show(t.dataset.k);
      try { location.hash = t.dataset.k; } catch (err) { /* 주소 변경이 막혀도 탭은 동작해요 */ }
    });
    window.addEventListener("hashchange", () => show(fromHash()));
    show(fromHash());
  }
})();
