/* ==========================================================================
   virgule. — main.js
   le personnage, la galerie, le voile (lightbox), et les petites bêtises.
   ========================================================================== */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const mouvReduit = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     config éditable — le panneau /admin écrit dans localStorage,
     js/site-config.js sert pour la version publiée
  ------------------------------------------------------------------ */
  let CONFIG = window.VIRGULE_CONFIG || null;
  try {
    const brut = localStorage.getItem("virgule-config");
    if (brut) CONFIG = JSON.parse(brut);
  } catch (e) { /* stockage indisponible : valeurs par défaut */ }

  const LISTE = (CONFIG && Array.isArray(CONFIG.photos) && CONFIG.photos.length)
    ? CONFIG.photos
    : PHOTOS;

  const escHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  /* un texte du panneau : les sauts de ligne deviennent <br>,
     une ligne entière entre parenthèses devient une nuance en <em> */
  function texteVersHtml(v) {
    return String(v).split("\n").map((l) => {
      const t = escHtml(l.trim());
      return /^\(.*\)$/.test(l.trim()) ? `<em>${t}</em>` : t;
    }).join("<br>");
  }

  if (CONFIG && CONFIG.textes) {
    for (const [cle, val] of Object.entries(CONFIG.textes)) {
      if (val == null || String(val).trim() === "") continue;
      $$(`[data-texte="${CSS.escape(cle)}"]`).forEach((el) => { el.innerHTML = texteVersHtml(val); });
    }
  }
  if (CONFIG && CONFIG.contact) {
    const { email, instaUrl, instaTexte } = CONFIG.contact;
    const lienEmail = $("#lien-email");
    const lienInsta = $("#lien-insta");
    if (email && lienEmail) { lienEmail.href = `mailto:${email}`; lienEmail.textContent = email; }
    if (lienInsta && instaUrl) lienInsta.href = instaUrl;
    if (lienInsta && instaTexte) lienInsta.textContent = instaTexte;
  }

  /* ------------------------------------------------------------------
     le portrait — la photo de Virgile, chapeau et moustache par-dessus,
     et le petit perso posé sur l'épaule (réglable depuis /admin)
  ------------------------------------------------------------------ */
  const PORTRAIT_DEFAUT = {
    image: "",
    chapeau:   { x: 50, y: 4,  w: 52, r: -8, visible: true },
    moustache: { x: 50, y: 46, w: 26, r: -2, visible: true },
    perso:     { x: 82, y: 84, w: 26, r: 6,  visible: true },
  };

  const chapeauSVG = `<svg viewBox="0 0 120 62" aria-hidden="true" focusable="false">
    <g transform="rotate(-2 60 31)">
      <rect x="2" y="47" width="116" height="11" rx="5.5" fill="#1B1610"/>
      <rect x="24" y="4" width="72" height="47" rx="7" fill="#1B1610"/>
      <rect x="24" y="33" width="72" height="12" fill="#D9A62E"/>
    </g>
  </svg>`;
  const moustacheSVG = `<svg viewBox="60 125 104 32" aria-hidden="true" focusable="false">
    <path fill="#BF4E24" d="M112 133 C 96 127, 80 129, 68 141 C 63 147, 66 155, 74 152 C 88 147, 100 144, 112 139 Z"/>
    <path fill="#BF4E24" d="M112 133 C 128 127, 144 129, 156 141 C 161 147, 158 155, 150 152 C 136 147, 124 144, 112 139 Z"/>
  </svg>`;

  const portrait = $("#portrait");
  if (portrait) {
    const confP = CONFIG && CONFIG.portrait ? CONFIG.portrait : {};
    const calques = {
      chapeau:   { ...PORTRAIT_DEFAUT.chapeau,   ...confP.chapeau },
      moustache: { ...PORTRAIT_DEFAUT.moustache, ...confP.moustache },
      perso:     { ...PORTRAIT_DEFAUT.perso,     ...confP.perso },
    };
    portrait.insertAdjacentHTML("beforeend", `
      <div class="portrait-calque calque-chapeau" aria-hidden="true">${chapeauSVG}</div>
      <div class="portrait-calque calque-moustache" aria-hidden="true">${moustacheSVG}</div>
      <div class="portrait-calque calque-perso perso-slot" data-perso="epaule" aria-hidden="true"></div>`);
    for (const [nom, c] of Object.entries(calques)) {
      const el = $(`.calque-${nom}`, portrait);
      el.style.left = `${c.x}%`;
      el.style.top = `${c.y}%`;
      el.style.width = `${c.w}%`;
      el.style.setProperty("--rot", `${c.r}deg`);
      if (c.visible === false) el.style.display = "none";
    }
    const image = confP.image || PORTRAIT_DEFAUT.image;
    const img = $("#portrait-img");
    const placeholder = $("#portrait-placeholder");
    if (image) {
      img.addEventListener("error", () => { img.hidden = true; placeholder.hidden = false; });
      img.src = image;
      img.hidden = false;
      placeholder.hidden = true;
    }
  }

  /* ------------------------------------------------------------------
     le personnage — une virgule à moustache, dessinée une seule fois
  ------------------------------------------------------------------ */
  function personnageSVG(variante = "") {
    const decoratif = variante !== "hero";
    return `<svg class="perso perso--${variante}" viewBox="0 0 220 300"
      ${decoratif ? 'aria-hidden="true" focusable="false"' : 'role="img" aria-label="virgule, un petit personnage en forme de virgule, avec haut-de-forme, moustache et appareil photo rétro"'}>
      <!-- la queue de la virgule -->
      <path class="queue" fill="#1B1610" d="M84 172 C 80 214, 60 252, 22 278 C 54 268, 92 240, 101 192 Z"/>
      <!-- le corps -->
      <circle class="corps" cx="112" cy="120" r="72" fill="#1B1610"/>
      <!-- le haut-de-forme -->
      <g class="chapeau" transform="rotate(-9 112 54)">
        <rect x="56" y="46" width="112" height="11" rx="5.5" fill="#1B1610"/>
        <rect x="76" y="4" width="72" height="46" rx="7" fill="#1B1610"/>
        <rect x="76" y="32" width="72" height="12" fill="#D9A62E"/>
      </g>
      <!-- les yeux -->
      <g class="yeux">
        <g class="oeil">
          <ellipse cx="88" cy="106" rx="16" ry="18" fill="#FFFDF4"/>
          <g class="pupille"><circle cx="90" cy="109" r="6" fill="#1B1610"/></g>
          <rect class="paupiere" x="71" y="88" width="34" height="37" rx="8" fill="#1B1610"/>
        </g>
        <g class="oeil">
          <ellipse cx="136" cy="101" rx="13" ry="15" fill="#FFFDF4"/>
          <g class="pupille"><circle cx="137" cy="104" r="5.2" fill="#1B1610"/></g>
          <rect class="paupiere" x="122" y="86" width="28" height="31" rx="7" fill="#1B1610"/>
        </g>
        <path class="sourcil" d="M74 82 Q 88 76 102 82" fill="none" stroke="#FFFDF4" stroke-width="3.5" stroke-linecap="round"/>
        <path class="sourcil" d="M124 78 Q 136 73 148 78" fill="none" stroke="#FFFDF4" stroke-width="3.2" stroke-linecap="round"/>
      </g>
      <!-- nez + moustache -->
      <circle class="nez" cx="112" cy="127" r="7" fill="#D9A62E"/>
      <g class="moustache">
        <path fill="#BF4E24" d="M112 133 C 96 127, 80 129, 68 141 C 63 147, 66 155, 74 152 C 88 147, 100 144, 112 139 Z"/>
        <path fill="#BF4E24" d="M112 133 C 128 127, 144 129, 156 141 C 161 147, 158 155, 150 152 C 136 147, 124 144, 112 139 Z"/>
      </g>
      <!-- mains + appareil photo rétro -->
      <g class="appareil-g">
        <circle cx="50" cy="214" r="10" fill="#1B1610"/>
        <circle cx="174" cy="214" r="10" fill="#1B1610"/>
        <rect x="56" y="192" width="112" height="52" rx="10" fill="#39584C" stroke="#1B1610" stroke-width="2.5"/>
        <rect x="56" y="192" width="112" height="15" rx="7" fill="#E8DCC0" stroke="#1B1610" stroke-width="2.5"/>
        <rect x="66" y="183" width="17" height="10" rx="2.5" fill="#1B1610"/>
        <circle cx="151" cy="196" r="5" fill="#D9A62E" stroke="#1B1610" stroke-width="1.5"/>
        <circle cx="112" cy="223" r="17" fill="#1B1610"/>
        <circle cx="112" cy="223" r="10" fill="#8A9B84"/>
        <circle cx="108" cy="219" r="3" fill="#FFFDF4"/>
        <!-- le petit éclair de flash -->
        <g class="eclair-g" stroke="#D9A62E" stroke-width="4.5" stroke-linecap="round">
          <line x1="151" y1="176" x2="151" y2="160"/>
          <line x1="138" y1="181" x2="128" y2="169"/>
          <line x1="164" y1="181" x2="174" y2="169"/>
          <line x1="133" y1="192" x2="118" y2="188"/>
          <line x1="169" y1="192" x2="184" y2="188"/>
        </g>
      </g>
    </svg>`;
  }

  $$("[data-perso]").forEach((slot) => {
    slot.innerHTML = personnageSVG(slot.dataset.perso);
  });

  const persos = $$(".perso");
  const pupillesParPerso = persos.map((svg) => [svg, $$(".pupille", svg)]);

  /* ------------------------------------------------------------------
     les yeux suivent le curseur (doucement)
  ------------------------------------------------------------------ */
  if (!mouvReduit) {
    let mx = innerWidth / 2;
    let my = innerHeight / 3;
    let raf = null;
    const etat = new Map();

    const anime = () => {
      raf = null;
      let calme = true;
      /* phase lecture : tous les rectangles d'abord, pour éviter
         les reflows forcés lecture/écriture entrelacés */
      const lectures = [];
      for (const [svg, pupilles] of pupillesParPerso) {
        const r = svg.getBoundingClientRect();
        if (r.bottom < -40 || r.top > innerHeight + 40 || r.width === 0) continue;
        for (const p of pupilles) {
          const pr = p.getBoundingClientRect();
          lectures.push([p, pr.x + pr.width / 2, pr.y + pr.height / 2]);
        }
      }
      /* phase écriture */
      for (const [p, cx, cy] of lectures) {
        let dx = mx - cx;
        let dy = my - cy;
        const d = Math.hypot(dx, dy) || 1;
        const portee = Math.min(d / 40, 1) * 5.5;
        dx = (dx / d) * portee;
        dy = (dy / d) * portee;
        let st = etat.get(p);
        if (!st) { st = { x: 0, y: 0 }; etat.set(p, st); }
        st.x += (dx - st.x) * 0.16;
        st.y += (dy - st.y) * 0.16;
        if (Math.abs(dx - st.x) > 0.15 || Math.abs(dy - st.y) > 0.15) calme = false;
        p.setAttribute("transform", `translate(${st.x.toFixed(2)} ${st.y.toFixed(2)})`);
      }
      if (!calme) raf = requestAnimationFrame(anime);
    };

    const reveille = () => { if (!raf) raf = requestAnimationFrame(anime); };

    addEventListener("pointermove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      reveille();
    }, { passive: true });

    addEventListener("scroll", reveille, { passive: true });

    /* sans souris (tactile), les yeux vagabondent tout seuls */
    if (matchMedia("(hover: none)").matches) {
      setInterval(() => {
        mx = innerWidth * (0.1 + Math.random() * 0.8);
        my = innerHeight * (0.1 + Math.random() * 0.7);
        reveille();
      }, 3400);
    }

    /* clignements aléatoires */
    persos.forEach((svg) => {
      const cligne = () => {
        svg.classList.add("cligne");
        setTimeout(() => svg.classList.remove("cligne"), 200);
        setTimeout(cligne, 2800 + Math.random() * 4200);
      };
      setTimeout(cligne, 1200 + Math.random() * 2600);
    });
  }

  /* ------------------------------------------------------------------
     flash d'appareil photo
  ------------------------------------------------------------------ */
  const eclat = $("#eclat");
  function flash(svg) {
    if (mouvReduit) return;
    if (svg) {
      svg.classList.remove("flashe", "cligne");
      void svg.getBoundingClientRect();
      svg.classList.add("flashe", "surpris");
      setTimeout(() => svg.classList.remove("flashe", "surpris"), 500);
    }
    eclat.classList.remove("on");
    void eclat.offsetWidth;
    eclat.classList.add("on");
  }

  const persoHero = $(".perso--hero");
  if (persoHero) {
    persoHero.closest(".perso-slot").addEventListener("click", () => flash(persoHero));
  }

  /* le CTA fait viser le personnage */
  const cta = $("#cta-photos");
  if (cta && persoHero) {
    cta.addEventListener("mouseenter", () => persoHero.classList.add("vise", "surpris"));
    cta.addEventListener("mouseleave", () => persoHero.classList.remove("vise", "surpris"));
    cta.addEventListener("focus", () => persoHero.classList.add("vise", "surpris"));
    cta.addEventListener("blur", () => persoHero.classList.remove("vise", "surpris"));
    cta.addEventListener("click", () => flash(persoHero));
  }

  /* la fiche réagit à ses étiquettes : le perso sur l'épaule s'étonne */
  const persoEpaule = $(".perso--epaule");
  if (persoEpaule) {
    $$(".etiquette").forEach((et) => {
      et.addEventListener("mouseenter", () => persoEpaule.classList.add("surpris"));
      et.addEventListener("mouseleave", () => persoEpaule.classList.remove("surpris"));
    });
  }

  /* le personnage du footer regarde vraiment partir */
  const persoPeek = $(".perso--peek");
  if (persoPeek && !mouvReduit) {
    document.documentElement.addEventListener("mouseleave", () => {
      persoPeek.classList.add("surpris");
      setTimeout(() => persoPeek.classList.remove("surpris"), 1400);
    });
  }

  /* ------------------------------------------------------------------
     galerie — construite depuis PHOTOS (js/photos-data.js)
  ------------------------------------------------------------------ */
  const RATIOS = {
    grande:   [1400, 1050],
    panorama: [1600, 1000],
    haute:    [1050, 1400],
    moyenne:  [1200, 900],
    petite:   [1000, 1000],
  };
  const SIZES = {
    grande:   "(max-width: 719px) 92vw, (max-width: 1100px) 66vw, 50vw",
    panorama: "(max-width: 719px) 92vw, 78vw",
    haute:    "(max-width: 719px) 78vw, (max-width: 1100px) 45vw, 38vw",
    moyenne:  "(max-width: 719px) 78vw, (max-width: 1100px) 45vw, 38vw",
    petite:   "(max-width: 719px) 62vw, (max-width: 1100px) 34vw, 30vw",
  };

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

  function urlPhoto(p, largeur) {
    const [w, h] = RATIOS[p.taille] || RATIOS.moyenne;
    const hauteur = Math.round((largeur * h) / w);
    if (p.picsum != null) return `https://picsum.photos/id/${p.picsum}/${largeur}/${hauteur}`;
    if (p.image && p.image.includes("{w}")) return p.image.split("{w}").join(largeur);
    return p.image;
  }
  /* plusieurs largeurs disponibles ? picsum les génère, {w} les nomme */
  const aVariantes = (p) => p.picsum != null || (p.image && p.image.includes("{w}"));
  function srcsetPhoto(p) {
    if (!aVariantes(p)) return "";
    const set = [700, 1100, 1600].map((w) => `${urlPhoto(p, w)} ${w}w`).join(", ");
    return `srcset="${set}" sizes="${SIZES[p.taille] || SIZES.moyenne}"`;
  }
  /* largeur utile pour la vue en grand : selon l'écran, pas toujours 1600 */
  const largeurVoile = () => {
    const cible = innerWidth * Math.min(devicePixelRatio || 1, 2);
    return [700, 1100, 1600].find((w) => w >= cible) || 1600;
  };

  const grille = $("#grille");
  const figures = [];

  LISTE.forEach((p, i) => {
    const [w, h] = RATIOS[p.taille] || RATIOS.moyenne;
    const num = String(i + 1).padStart(2, "0");
    /* rotation pseudo-aléatoire mais jamais imperceptible (>= 0.5°) */
    let tilt = ((((i * 137 + 41) % 100) / 100) * 2.6 - 1.3);
    if (Math.abs(tilt) < 0.5) tilt += tilt < 0 ? -0.5 : 0.5;
    const fig = document.createElement("figure");
    fig.className = `photo t-${p.taille}`;
    fig.dataset.cat = p.categorie;
    fig.dataset.index = i;
    fig.style.setProperty("--tilt", `${tilt.toFixed(2)}deg`);
    fig.setAttribute("data-reveal", "");
    fig.innerHTML = `
      <button class="photo-cadre" type="button" aria-haspopup="dialog" aria-label="agrandir « ${esc(p.titre)} »">
        <span class="photo-fen"><img src="${urlPhoto(p, 1100)}" ${srcsetPhoto(p)}
          alt="${esc(p.alt || p.titre)}" width="${w}" height="${h}"
          loading="lazy" decoding="async"></span>
        <span class="photo-phrase">${esc(p.phrase)}</span>
      </button>
      <figcaption class="photo-legende">
        <span class="photo-num">n°${num}</span>
        <span class="photo-titre">${esc(p.titre)}</span>
        <span class="photo-meta">${esc(p.categorie)} · ${esc(p.lieu)}</span>
      </figcaption>`;
    fig.querySelector(".photo-cadre").addEventListener("click", (e) => {
      const origine = e.currentTarget;
      flash(null);
      setTimeout(() => ouvrirVoile(i, origine), mouvReduit ? 0 : 120);
    });
    grille.appendChild(fig);
    figures.push(fig);
  });

  function positionne() {
    let pos = 0;
    figures.forEach((f) => {
      if (f.hidden) { f.removeAttribute("data-pos"); return; }
      f.dataset.pos = pos % 6;
      pos += 1;
    });
  }
  positionne();

  /* ------------------------------------------------------------------
     filtres
  ------------------------------------------------------------------ */
  const EN_LETTRES = ["zéro", "une", "deux", "trois", "quatre", "cinq", "six", "sept",
    "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze",
    "seize", "dix-sept", "dix-huit", "dix-neuf", "vingt"];
  const compte = $("#compte");
  const filtres = $("#filtres");
  let filtreEnCours = null;

  /* le compte affiché suit le nombre réel de photos (modifiable via /admin) */
  compte.textContent = `${EN_LETTRES[LISTE.length] || LISTE.length} photos, zéro mensonge.`;

  filtres.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cat]");
    if (!btn) return;
    const cat = btn.dataset.cat;
    $$("button", filtres).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));

    clearTimeout(filtreEnCours);
    figures.forEach((f) => {
      const visible = cat === "tout" || f.dataset.cat === cat;
      if (visible) {
        f.hidden = false;
        requestAnimationFrame(() => f.classList.remove("part"));
      } else {
        f.classList.add("part");
      }
    });
    filtreEnCours = setTimeout(() => {
      figures.forEach((f) => { if (f.classList.contains("part")) f.hidden = true; });
      positionne();
    }, 320);

    $("#galerie").classList.toggle("galerie--filtree", cat !== "tout");

    const n = figures.filter((f) => cat === "tout" || f.dataset.cat === cat).length;
    const mot = EN_LETTRES[n] || n;
    const de = /^[aeiouâàéèêîôû]/i.test(cat) ? "d'" : "de ";
    compte.textContent = cat === "tout"
      ? `${mot} photos, zéro mensonge.`
      : `${mot} photo${n > 1 ? "s" : ""} ${de}${cat}, toujours zéro mensonge.`;
  });

  /* ------------------------------------------------------------------
     le voile (lightbox)
  ------------------------------------------------------------------ */
  const voile = $("#voile");
  const voileImg = $("#voile-img");
  const voileTitre = $("#voile-titre");
  const voileMeta = $("#voile-meta");
  const voileDesc = $("#voile-desc");
  const voilePhrase = $("#voile-phrase");
  const voileNum = $("#voile-num");
  const arrierePlan = [$(".entete"), $("main"), $(".pied")].filter(Boolean);
  let indexCourant = -1;
  let ouvreur = null;
  let voileTimer = null;
  let navTimer = null;
  let navFin = null;

  const visiblesIdx = () => figures.filter((f) => !f.hidden).map((f) => +f.dataset.index);

  function remplitVoile(i) {
    const p = LISTE[i];
    const [w, h] = RATIOS[p.taille] || RATIOS.moyenne;
    const liste = visiblesIdx();
    const rang = liste.indexOf(i) + 1;
    const largeur = largeurVoile();
    voileImg.width = w;
    voileImg.height = h;
    voileImg.src = urlPhoto(p, largeur);
    voileImg.alt = p.alt || p.titre;
    voileTitre.textContent = p.titre;
    voileMeta.textContent = `${p.lieu} · ${p.date} · ${p.categorie}`;
    voileDesc.textContent = p.description;
    voilePhrase.textContent = `« ${p.phrase} »`;
    voileNum.textContent = `n°${String(i + 1).padStart(2, "0")} — ${rang} / ${liste.length}`;
    /* précharge les voisines, à la même largeur adaptée */
    [1, -1].forEach((d) => {
      const j = liste[(liste.indexOf(i) + d + liste.length) % liste.length];
      if (j != null && j !== i) { const im = new Image(); im.src = urlPhoto(LISTE[j], largeur); }
    });
    indexCourant = i;
  }

  function ouvrirVoile(i, origine) {
    if (voile.classList.contains("ouvert")) return;
    clearTimeout(voileTimer);
    ouvreur = origine || document.activeElement;
    remplitVoile(i);
    voile.hidden = false;
    /* le fond devient inerte pour le clavier ET les lecteurs d'écran */
    arrierePlan.forEach((el) => { el.inert = true; el.setAttribute("aria-hidden", "true"); });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      voile.classList.add("ouvert");
      /* le focus ne peut entrer qu'une fois le voile visible */
      $("#voile-fermer").focus();
    }));
    document.documentElement.classList.add("fige");
  }

  function fermerVoile() {
    voile.classList.remove("ouvert");
    document.documentElement.classList.remove("fige");
    arrierePlan.forEach((el) => { el.inert = false; el.removeAttribute("aria-hidden"); });
    voileTimer = setTimeout(() => { voile.hidden = true; }, 300);
    if (ouvreur && ouvreur.isConnected) ouvreur.focus();
  }

  function naviguer(d) {
    const liste = visiblesIdx();
    if (liste.length < 2) return;
    const pos = liste.indexOf(indexCourant);
    const suivant = liste[(pos + d + liste.length) % liste.length];
    /* l'index logique avance tout de suite : les clics rapides s'enchaînent */
    indexCourant = suivant;
    clearTimeout(navTimer);
    clearTimeout(navFin);
    voile.classList.add("change");
    navTimer = setTimeout(() => {
      remplitVoile(suivant);
      voileImg.addEventListener("load", () => voile.classList.remove("change"), { once: true });
      navFin = setTimeout(() => voile.classList.remove("change"), 600);
    }, mouvReduit ? 0 : 160);
  }

  $("#voile-fermer").addEventListener("click", fermerVoile);
  $("#voile-prec").addEventListener("click", () => naviguer(-1));
  $("#voile-suiv").addEventListener("click", () => naviguer(1));
  voile.addEventListener("click", (e) => { if (e.target === voile) fermerVoile(); });

  document.addEventListener("keydown", (e) => {
    if (voile.hidden) return;
    if (e.key === "Escape") fermerVoile();
    else if (e.key === "ArrowLeft") naviguer(-1);
    else if (e.key === "ArrowRight") naviguer(1);
    else if (e.key === "Tab") {
      const focusables = $$("button", voile);
      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
      else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
    }
  });

  /* balayage tactile dans le voile (jamais à la souris : la sélection
     de texte et les drags ne doivent pas naviguer) */
  let toucheX = null;
  voile.addEventListener("pointerdown", (e) => {
    toucheX = e.pointerType === "mouse" ? null : e.clientX;
  }, { passive: true });
  voile.addEventListener("pointercancel", () => { toucheX = null; }, { passive: true });
  voile.addEventListener("pointerup", (e) => {
    if (toucheX == null) return;
    const delta = e.clientX - toucheX;
    if (Math.abs(delta) > 60) naviguer(delta > 0 ? -1 : 1);
    toucheX = null;
  }, { passive: true });

  /* ------------------------------------------------------------------
     apparitions au défilement
  ------------------------------------------------------------------ */
  if (!mouvReduit && "IntersectionObserver" in window) {
    const obs = new IntersectionObserver((entrees) => {
      entrees.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("vu");
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });
    $$("[data-reveal]").forEach((el, i) => {
      el.style.setProperty("--d", `${(i % 5) * 50}ms`);
      obs.observe(el);
    });
  } else {
    $$("[data-reveal]").forEach((el) => el.classList.add("vu"));
  }

  /* ------------------------------------------------------------------
     en-tête collée après défilement
  ------------------------------------------------------------------ */
  const entete = $("#entete");
  const surveilleHaut = () => entete.classList.toggle("colle", scrollY > 40);
  addEventListener("scroll", surveilleHaut, { passive: true });
  surveilleHaut();

  /* ------------------------------------------------------------------
     toast — bout de papier messager
  ------------------------------------------------------------------ */
  const toast = $("#toast");
  let toastTimer = null;
  let toastCache = null;
  function ecrireToast(msg, duree = 5200) {
    clearTimeout(toastTimer);
    clearTimeout(toastCache);
    toast.hidden = false;
    /* le texte est posé une fois l'élément dévoilé, pour que role=status l'annonce */
    toast.textContent = msg;
    requestAnimationFrame(() => toast.classList.add("montre"));
    toastTimer = setTimeout(() => {
      toast.classList.remove("montre");
      toastCache = setTimeout(() => { toast.hidden = true; }, 350);
    }, duree);
  }

  /* ------------------------------------------------------------------
     easter egg — sept clics sur la marque
  ------------------------------------------------------------------ */
  let clicsMarque = 0;
  $("#marque").addEventListener("click", () => {
    clicsMarque += 1;
    if (clicsMarque === 7) {
      document.body.classList.add("grand-soir");
      flash(persoHero);
      ecrireToast("bravo. tu as cliqué sept fois sur une virgule. il ne se passera rien de plus. (c'était déjà pas mal.)", 7000);
    } else if (clicsMarque === 3) {
      ecrireToast("continue, tu chauffes.", 2600);
    }
  });

  /* ------------------------------------------------------------------
     phrase inattendue si le visiteur s'attarde
  ------------------------------------------------------------------ */
  if (!sessionStorage.getItem("virgule-vu")) {
    let inactif = null;
    let dernier = 0;
    const evenements = ["pointermove", "scroll", "keydown", "click"];
    const repartir = () => {
      const t = Date.now();
      if (t - dernier < 1000) return;
      dernier = t;
      clearTimeout(inactif);
      inactif = setTimeout(() => {
        sessionStorage.setItem("virgule-vu", "1");
        evenements.forEach((ev) => removeEventListener(ev, repartir));
        ecrireToast("toujours là ? prends ton temps. les photos n'ont pas bougé depuis tout à l'heure.", 6500);
      }, 45000);
    };
    evenements.forEach((ev) => addEventListener(ev, repartir, { passive: true }));
    repartir();
  }
})();
