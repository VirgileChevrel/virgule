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
     porte de sortie — ?fichiers
     --------------------------------------------------------------------
     Une liste enregistrée autrefois depuis /admin masque complètement
     js/photos-data.js, sur cet appareil seulement, et rien ne le signale en
     naviguant : on cherche longtemps pourquoi de nouvelles photos n'arrivent
     pas. Ouvrir n'importe quelle page avec ?fichiers rend la main aux fichiers
     du site. Ça n'efface que ce navigateur-ci, jamais le site.
  ------------------------------------------------------------------ */
  if (/[?&]fichiers(&|=|$)/.test(location.search)) {
    try { localStorage.removeItem("virgule-config"); } catch (e) { /* rien */ }
    location.replace(location.pathname + location.hash);
    return;
  }

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

  /* palmares-data.js n'est pas chargé sur toutes les pages : on ne veut pas
     qu'une page sans palmarès tombe sur un PALMARES inexistant */
  const PALMARES_BASE = (typeof PALMARES !== "undefined" && Array.isArray(PALMARES)) ? PALMARES : [];
  let BILLETS = (CONFIG && Array.isArray(CONFIG.palmares)) ? CONFIG.palmares : PALMARES_BASE;

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

  /* les calques posés sur le portrait, mêmes tracés que le personnage */
  const chapeauSVG = `<svg viewBox="39.7 -11.4 107.5 88" aria-hidden="true" focusable="false"><path fill="#18273C" stroke="#1B1610" stroke-width="1.6" stroke-linejoin="round" fill-rule="evenodd" d="M110.62 -8.62C116.24 -8.43 116.17 -2.42 116.65 1.98C117.43 9.13 118.9 15.87 120.68 22.84C121.18 24.79 121.23 26.83 121.78 28.76C122.7 32 124.71 35.45 125.16 38.73C125.4 40.5 124.74 41.71 123.54 42.93C123 43.47 120.85 44.75 120.94 45.75C120.98 46.25 121.99 45.96 122.46 45.77C124.09 45.12 126.44 43.98 127.7 42.74C129.14 41.32 129 39.08 130.04 37.43C131.84 34.59 135.99 33.42 139.16 33.3C140.68 33.25 142.81 33.38 143.54 35.04C144.65 37.53 142.6 40.78 140.93 42.43C136.37 46.94 130.1 50 124.41 52.81C112.56 58.66 100.85 63.29 88.19 67.08C76.35 70.62 63.78 74.09 51.27 72.7C48.96 72.44 46.19 72.09 44.41 70.4C42.37 68.46 42.23 65.04 44.38 63.12C46.96 60.82 53.59 59.31 56.89 60.3C58.56 60.81 61.65 66.85 63.95 64.08C64.61 63.29 62.73 61.97 62.42 61.59C60.88 59.72 60.1 57.35 59.31 55.1C56.24 46.34 52.59 38.13 48.5 29.8C46.83 26.41 43.04 23.06 42.51 19.26C42.19 16.98 43.64 15.17 45.32 13.85C48.39 11.44 52.46 9.57 55.94 7.83C64.32 3.64 73.06 -0.03 82.04 -2.73C84.32 -3.41 86.71 -3.58 88.97 -4.31C95.85 -6.53 103.26 -8.86 110.62 -8.62Z"/><path fill="#385086" fill-rule="evenodd" d="M128.35 47.57C128.23 48.29 125.98 49.42 125.54 49.68C122.42 51.59 119.11 53.29 115.86 54.96C100.99 62.58 84.37 67.51 67.8 69.4C62.47 70.01 56.77 70.45 51.46 69.43C50.95 69.33 47.78 68.84 47.55 67.97C47.41 67.41 48.73 67.83 49.31 67.89C52.58 68.24 49.84 68.05 53.4 68.38C56.56 68.67 59.74 68.71 62.91 68.52C72.96 67.93 82.71 65.71 92.37 62.99C100.41 60.72 108.45 57.79 115.91 54.02C118.66 52.64 121.38 51.18 124.1 49.72C125.08 49.19 126.06 48.63 127.05 48.1C127.46 47.87 128.43 47.1 128.35 47.57ZM120.92 30.78C122.1 31.67 122.41 34.03 122.71 35.31C123.14 37.07 123.74 39.14 123.44 40.98C122.94 44.14 118.44 46.07 115.96 47.47C112.68 49.34 109.05 50.63 105.57 52.08C96.3 55.94 86.76 58.93 76.92 60.93C73.17 61.7 66.44 63.7 62.95 61.28C60.85 59.83 59.62 55.82 59.22 53.43C59.06 52.47 59.03 51.71 59.82 51.01C61.09 49.87 63.38 49.64 64.95 49.26C68.28 48.47 71.58 47.59 74.89 46.71C85.04 43.98 94.99 40.45 104.74 36.56C108.88 34.91 112.94 33.14 117.06 31.44C118.01 31.05 119.86 29.97 120.92 30.78ZM92.32 -1.08C92.88 -1.08 89.02 0.58 88.72 0.68C85.64 1.75 82.53 2.79 79.46 3.9C72.18 6.52 65.07 9.43 57.92 12.36C56.19 13.07 54.47 13.8 52.72 14.47C52.09 14.72 51.33 15.45 50.78 15.06C50.33 14.73 51.59 14.28 52.06 13.98C53.05 13.36 54.1 12.8 55.14 12.29C57.97 10.9 60.89 9.67 63.78 8.42C70.28 5.59 77.11 3.07 83.91 1.05C86.47 0.3 89.61 -1.12 92.32 -1.08ZM54.72 18.13C56.87 18.76 57.79 21.63 58.64 23.41C61.08 28.53 63.45 33.68 65.63 38.91C66.33 40.58 68.75 44.84 65.92 45.89C62.94 47 61.44 43.08 60.54 41.1C58.45 36.54 56.48 31.9 54.21 27.42C53.21 25.44 51.58 23.23 51.23 21C50.92 18.99 52.8 17.57 54.72 18.13Z"/></svg>`;
  const moustacheSVG = `<svg viewBox="50.1 118.1 122 46.4" aria-hidden="true" focusable="false"><path fill="#A0744A" fill-rule="evenodd" d="M98.44 121.13C101.22 120.8 104.2 121.22 106.79 122.27C108.3 122.89 109.85 124.53 111.53 124.59C113.61 124.67 115.74 122.47 117.68 121.82C121.45 120.56 125.53 120.85 129.16 122.42C138.68 126.53 144.34 138.88 156.26 136.31C159.95 135.51 165.59 131.71 163.09 127.17C162.13 125.42 160.22 125.02 158.44 125.57C158.14 125.66 156.4 126.82 156.14 125.93C155.47 123.62 158.93 122.23 160.56 122.09C168.05 121.45 169.56 130.71 166.69 135.85C163.11 142.28 155.29 146.24 148.26 147.42C142.11 148.45 137.4 147.14 131.58 145.59C127.84 144.59 124.72 144.25 121.23 142.25C118.28 140.55 116.09 138.13 113.99 135.51C113.35 134.72 112.51 133.43 111.28 133.65C110.1 133.86 109.23 135.25 108.55 136.09C107.35 137.59 106.16 138.98 104.58 140.11C102.37 141.68 99.7 143.49 97.04 144.14C95.83 144.43 94.6 144.35 93.4 144.69C91.03 145.37 88.97 146.59 86.46 146.85C77.45 147.77 67.87 147.57 60.96 140.73C56.61 136.44 52.63 125.61 60.69 122.51C62.54 121.79 64.84 121.95 66.45 123.18C66.8 123.45 68.35 124.98 67.48 125.6C67.08 125.89 65.88 125.52 65.61 125.49C64.25 125.3 62.95 125.34 61.9 126.37C58.05 130.15 62.98 135.27 66.73 136.24C75.83 138.6 81.26 131.09 87.43 126.09C90.47 123.62 94.51 121.6 98.44 121.13ZM114.34 161.24C116.52 160.71 119.04 160.92 121.25 160.99C122.22 161.02 124.29 160.87 125.18 161.52C125.44 161.71 124.59 161.8 124.26 161.82C124.26 161.82 122.95 161.84 122.95 161.84C120.58 161.85 118.22 161.89 115.85 161.94C115.77 161.95 112.13 161.78 114.34 161.24Z"/></svg>`;

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
    return `<svg class="perso perso--${variante}" viewBox="0 -14 220 280"
      ${decoratif ? 'aria-hidden="true" focusable="false"' : 'role="img" aria-label="virgule, un petit personnage en forme de virgule, avec haut-de-forme bleu marine, lunettes rondes, moustache et appareil photo rétro"'}>
    <path class="queue" fill="#1B1610" fill-rule="evenodd" d="M175.89 155.45C179.8 154.05 187.02 154.41 190.3 157.13C191.9 158.46 193.04 160.48 194.38 162.06C195.89 163.83 197.14 165.31 197.66 167.65C198.77 172.61 196.92 178.22 198.83 183.01C200.15 186.32 203.79 188.07 205.83 190.88C210.5 197.27 209.84 206.97 205.54 213.38C201.14 219.94 194.43 220.12 187.24 220.14C181.78 220.16 176.31 220.27 170.85 220.36C167.2 220.42 163.22 220.12 159.66 221.05C155.97 222.02 153.83 225.13 151.47 227.86C147.77 232.15 144 236.38 139.77 240.16C127.52 251.07 112.06 259.35 95.87 262.26C92.32 262.9 88.73 263.39 85.12 263.47C79.92 263.59 66.82 261.85 72.06 253.37C74.52 249.39 80.53 247.26 84.27 244.66C91.57 239.58 101.22 231.71 104.53 223.17C105.91 219.59 103.59 216.67 102.98 213.2C102.31 209.45 102.49 205.48 102.53 201.68C102.56 199.05 102 194.3 104.32 192.34C107.08 190.01 113.15 191.19 116.45 191.06C124.78 190.73 133.11 188.85 140.75 185.48C149.87 181.45 158.51 175.35 165.22 167.96C167.13 165.84 168.94 163.65 170.57 161.31C172.03 159.19 173.28 156.38 175.89 155.45Z"/>
    <circle class="corps" cx="112" cy="120" r="72" fill="#1B1610"/>
    <g class="chapeau">
      <path class="chapeau-fond" fill="#18273C" stroke="#1B1610" stroke-width="1.6" stroke-linejoin="round" fill-rule="evenodd" d="M110.62 -8.62C116.24 -8.43 116.17 -2.42 116.65 1.98C117.43 9.13 118.9 15.87 120.68 22.84C121.18 24.79 121.23 26.83 121.78 28.76C122.7 32 124.71 35.45 125.16 38.73C125.4 40.5 124.74 41.71 123.54 42.93C123 43.47 120.85 44.75 120.94 45.75C120.98 46.25 121.99 45.96 122.46 45.77C124.09 45.12 126.44 43.98 127.7 42.74C129.14 41.32 129 39.08 130.04 37.43C131.84 34.59 135.99 33.42 139.16 33.3C140.68 33.25 142.81 33.38 143.54 35.04C144.65 37.53 142.6 40.78 140.93 42.43C136.37 46.94 130.1 50 124.41 52.81C112.56 58.66 100.85 63.29 88.19 67.08C76.35 70.62 63.78 74.09 51.27 72.7C48.96 72.44 46.19 72.09 44.41 70.4C42.37 68.46 42.23 65.04 44.38 63.12C46.96 60.82 53.59 59.31 56.89 60.3C58.56 60.81 61.65 66.85 63.95 64.08C64.61 63.29 62.73 61.97 62.42 61.59C60.88 59.72 60.1 57.35 59.31 55.1C56.24 46.34 52.59 38.13 48.5 29.8C46.83 26.41 43.04 23.06 42.51 19.26C42.19 16.98 43.64 15.17 45.32 13.85C48.39 11.44 52.46 9.57 55.94 7.83C64.32 3.64 73.06 -0.03 82.04 -2.73C84.32 -3.41 86.71 -3.58 88.97 -4.31C95.85 -6.53 103.26 -8.86 110.62 -8.62Z"/>
    <path class="chapeau-bande" fill="#385086" fill-rule="evenodd" d="M128.35 47.57C128.23 48.29 125.98 49.42 125.54 49.68C122.42 51.59 119.11 53.29 115.86 54.96C100.99 62.58 84.37 67.51 67.8 69.4C62.47 70.01 56.77 70.45 51.46 69.43C50.95 69.33 47.78 68.84 47.55 67.97C47.41 67.41 48.73 67.83 49.31 67.89C52.58 68.24 49.84 68.05 53.4 68.38C56.56 68.67 59.74 68.71 62.91 68.52C72.96 67.93 82.71 65.71 92.37 62.99C100.41 60.72 108.45 57.79 115.91 54.02C118.66 52.64 121.38 51.18 124.1 49.72C125.08 49.19 126.06 48.63 127.05 48.1C127.46 47.87 128.43 47.1 128.35 47.57ZM120.92 30.78C122.1 31.67 122.41 34.03 122.71 35.31C123.14 37.07 123.74 39.14 123.44 40.98C122.94 44.14 118.44 46.07 115.96 47.47C112.68 49.34 109.05 50.63 105.57 52.08C96.3 55.94 86.76 58.93 76.92 60.93C73.17 61.7 66.44 63.7 62.95 61.28C60.85 59.83 59.62 55.82 59.22 53.43C59.06 52.47 59.03 51.71 59.82 51.01C61.09 49.87 63.38 49.64 64.95 49.26C68.28 48.47 71.58 47.59 74.89 46.71C85.04 43.98 94.99 40.45 104.74 36.56C108.88 34.91 112.94 33.14 117.06 31.44C118.01 31.05 119.86 29.97 120.92 30.78ZM92.32 -1.08C92.88 -1.08 89.02 0.58 88.72 0.68C85.64 1.75 82.53 2.79 79.46 3.9C72.18 6.52 65.07 9.43 57.92 12.36C56.19 13.07 54.47 13.8 52.72 14.47C52.09 14.72 51.33 15.45 50.78 15.06C50.33 14.73 51.59 14.28 52.06 13.98C53.05 13.36 54.1 12.8 55.14 12.29C57.97 10.9 60.89 9.67 63.78 8.42C70.28 5.59 77.11 3.07 83.91 1.05C86.47 0.3 89.61 -1.12 92.32 -1.08ZM54.72 18.13C56.87 18.76 57.79 21.63 58.64 23.41C61.08 28.53 63.45 33.68 65.63 38.91C66.33 40.58 68.75 44.84 65.92 45.89C62.94 47 61.44 43.08 60.54 41.1C58.45 36.54 56.48 31.9 54.21 27.42C53.21 25.44 51.58 23.23 51.23 21C50.92 18.99 52.8 17.57 54.72 18.13Z"/>
    </g>
    <g class="yeux">
    <circle cx="90.44" cy="101.03" r="15.52" fill="#FBF6EA"/>
    <circle cx="130.11" cy="100.81" r="14.66" fill="#FBF6EA"/>
    <g class="oeil">
    <g class="pupille"><circle cx="93.57" cy="101.1" r="8.16" fill="#1B1610"/></g>
    <rect class="paupiere" x="74.92" y="85.51" width="31.04" height="31.04" rx="15.52" fill="#1B1610"/>
    </g>
    <g class="oeil">
    <g class="pupille"><circle cx="134.74" cy="101.43" r="7.74" fill="#1B1610"/></g>
    <rect class="paupiere" x="115.45" y="86.16" width="29.31" height="29.31" rx="14.66" fill="#1B1610"/>
    </g>
    <path class="sourcil" d="M76 80 Q 90 73 104 79" fill="none" stroke="#FBF6EA" stroke-width="3.5" stroke-linecap="round"/>
    <path class="sourcil" d="M117 79 Q 130 72 144 78" fill="none" stroke="#FBF6EA" stroke-width="3.2" stroke-linecap="round"/>
    <path class="lunettes" fill="#CFAE7F" fill-rule="evenodd" d="M88.04 81.01C94.85 80.26 101.05 83.71 105.02 89.02C106.71 91.28 107.42 96.19 110.47 96.93C114.73 97.96 115.4 92.57 117.14 89.96C120.01 85.68 124.64 82.35 129.71 81.41C136.45 80.16 142.8 82.62 146.99 87.97C148.42 89.79 149.51 93.86 151.65 94.83C154.17 95.97 157.73 93.56 160.12 92.93C160.7 92.78 162.93 92.11 163.35 93.09C163.76 94.04 161.53 94.91 161.1 95.11C158.52 96.31 154.75 96.6 152.7 98.7C150.89 100.57 151.05 103.75 150.22 106.09C147.89 112.61 143.23 117.86 136.09 118.96C128.15 120.18 120.6 117.08 116.62 109.85C115.44 107.72 114.95 105.45 114.38 103.11C114.1 101.95 113.77 100.52 112.52 100C110.72 99.24 109.31 100.95 108.66 102.38C107.17 105.71 106.77 109.2 104.52 112.23C98.89 119.8 87.35 121.48 79.52 116.46C76.3 114.39 73.76 111.06 72.66 107.38C71.85 104.66 72.22 100.92 70.2 98.71C68.1 96.42 64.04 96.55 61.37 95.26C60.84 95 59.03 94.09 59.69 93.1C60.29 92.2 62.09 92.73 62.84 92.9C65.03 93.4 68.9 95.8 71.11 94.74C72.99 93.84 73.73 90.62 74.86 89C77.99 84.56 82.61 81.6 88.04 81.01ZM130.06 83C136.64 82.03 143.91 85.32 147.17 91.27C152.42 100.82 147.42 114.99 136.24 117.34C134.14 117.78 131.9 117.69 129.81 117.28C124.48 116.25 119.56 112.77 117.51 107.62C113.55 97.68 118.73 84.67 130.06 83ZM86.2 83.03C94.79 82 103.03 86.09 105.99 94.57C109.51 104.66 101.89 116.48 91.4 117.59C81.3 118.66 73.67 110.78 73.29 101.06C73.01 93.63 77.93 84.02 86.2 83.03ZM97.82 121.4C98.74 121.32 100 121.32 100.9 121.36C100.9 121.36 102.56 121.47 102.56 121.47C106.59 121.9 99.49 121.83 98.66 121.82C98.09 121.82 95.43 121.61 97.82 121.4ZM120.92 121.51C122.06 121.08 124.44 121.19 125.55 121.69C125.84 121.82 124.94 121.95 124.62 121.96C123.81 122.01 122.68 121.99 121.87 121.9C121.53 121.86 120.6 121.63 120.92 121.51Z"/>
    </g>
    <g class="moustache"><path fill="#A0744A" fill-rule="evenodd" d="M98.44 121.13C101.22 120.8 104.2 121.22 106.79 122.27C108.3 122.89 109.85 124.53 111.53 124.59C113.61 124.67 115.74 122.47 117.68 121.82C121.45 120.56 125.53 120.85 129.16 122.42C138.68 126.53 144.34 138.88 156.26 136.31C159.95 135.51 165.59 131.71 163.09 127.17C162.13 125.42 160.22 125.02 158.44 125.57C158.14 125.66 156.4 126.82 156.14 125.93C155.47 123.62 158.93 122.23 160.56 122.09C168.05 121.45 169.56 130.71 166.69 135.85C163.11 142.28 155.29 146.24 148.26 147.42C142.11 148.45 137.4 147.14 131.58 145.59C127.84 144.59 124.72 144.25 121.23 142.25C118.28 140.55 116.09 138.13 113.99 135.51C113.35 134.72 112.51 133.43 111.28 133.65C110.1 133.86 109.23 135.25 108.55 136.09C107.35 137.59 106.16 138.98 104.58 140.11C102.37 141.68 99.7 143.49 97.04 144.14C95.83 144.43 94.6 144.35 93.4 144.69C91.03 145.37 88.97 146.59 86.46 146.85C77.45 147.77 67.87 147.57 60.96 140.73C56.61 136.44 52.63 125.61 60.69 122.51C62.54 121.79 64.84 121.95 66.45 123.18C66.8 123.45 68.35 124.98 67.48 125.6C67.08 125.89 65.88 125.52 65.61 125.49C64.25 125.3 62.95 125.34 61.9 126.37C58.05 130.15 62.98 135.27 66.73 136.24C75.83 138.6 81.26 131.09 87.43 126.09C90.47 123.62 94.51 121.6 98.44 121.13ZM114.34 161.24C116.52 160.71 119.04 160.92 121.25 160.99C122.22 161.02 124.29 160.87 125.18 161.52C125.44 161.71 124.59 161.8 124.26 161.82C124.26 161.82 122.95 161.84 122.95 161.84C120.58 161.85 118.22 161.89 115.85 161.94C115.77 161.95 112.13 161.78 114.34 161.24Z"/></g>
    <g class="appareil-g">
    <circle cx="192.78" cy="201.49" r="16.74" fill="#1B1610"/>
    <path fill="#F2E7CE" stroke="#1B1610" stroke-width="2.2" stroke-linejoin="round" fill-rule="evenodd" d="M173.95 158.44C177.18 156.73 185.57 156.53 188.29 159.29C189.41 160.42 189.7 162.04 190.84 163.18C194.09 166.44 195.43 167.73 195.51 172.72C195.55 175.8 196.4 181.35 193.73 183.64C192.32 184.85 190.3 185.17 188.63 185.83C184.64 187.43 181.26 190.91 181.62 195.51C181.94 199.55 184.86 199.89 187.02 202.43C187.25 202.71 186.3 202.41 185.96 202.3C184.83 201.91 183.28 200.89 182.03 201.14C179.91 201.57 180.21 205.64 180.29 207.08C180.44 209.64 181.21 211.73 183.14 213.48C183.49 213.79 187.21 216.02 186.21 216.81C184.63 218.07 180.76 217.81 178.88 217.97C170.95 218.67 162.79 218.48 154.83 218.39C142.61 218.24 130.32 218.74 118.13 217.74C114.71 217.46 108.43 218.33 106.29 214.88C105.02 212.83 105.26 209.74 105.2 207.45C105.04 201.56 105.49 195.69 105.33 189.81C105.24 186.81 105.91 183.9 105.86 180.92C105.8 177.57 104.23 173.86 106.44 170.8C107.84 168.85 110.45 168.75 111.93 166.97C112.94 165.76 112.91 164.08 113.88 162.86C115.81 160.4 121.51 160.76 123.99 162.06C127.1 163.69 126.41 167.97 130.74 167.85C134.64 167.75 137.65 164.59 141.59 164.16C150.32 163.23 159.83 165.54 168.4 163.63C171.63 162.91 171.37 159.81 173.95 158.44ZM102.67 177.97C103.98 178.34 103.36 182.17 103.13 182.97C103.12 183 102.75 184.44 102.18 183.76C101.32 182.73 101.5 180.6 101.74 179.43C101.85 178.86 102.11 177.81 102.67 177.97Z"/>
    <path fill="#7F8A79" stroke="#1B1610" stroke-width="1.4" stroke-linejoin="round" fill-rule="evenodd" d="M172.68 181.6C177.94 180.83 183.62 181.03 188.91 181.29C190.21 181.35 191.64 181.44 192.9 181.82C193.4 181.96 194.43 182.26 194.17 182.71C193.88 183.22 190 182.79 189.42 182.9C186.64 183.41 183.7 185.1 181.81 187.2C178.64 190.71 176.67 198.52 176.23 203.13C175.87 206.86 177.45 210.62 172.54 211.21C171.29 211.36 169.26 211.35 168.01 211.31C167.41 211.29 164.43 211.47 163.98 210.56C163.66 209.91 165.12 208.11 165.36 207.7C167.23 204.57 169.27 201.44 169.96 197.8C170.49 195 170.28 192.16 169.64 189.4C169.26 187.79 167.65 184.88 168.31 183.2C168.83 181.91 171.6 181.76 172.68 181.6ZM107.44 182.08C109.13 181.07 111.63 181.26 113.49 181.24C114.76 181.22 117.07 181.24 118.35 181.28C120.48 181.35 123.85 181.1 125.61 182.63C126.91 183.75 126.67 185.59 126.48 187.08C126.01 190.71 125.36 194.12 125.9 197.8C126.38 201.12 127.81 203.76 129.42 206.63C129.92 207.53 131.12 209.24 130.1 210.28C128.06 212.33 122.33 211.4 119.78 211.4C116.27 211.4 109.21 212.65 106.54 209.69C105.2 208.21 105.29 205.82 105.23 203.98C105.12 200.22 105.33 196.48 105.42 192.72C105.49 189.85 104.44 183.9 107.44 182.08Z"/>
    <path fill="#A9522F" stroke="#1B1610" stroke-width="1.4" stroke-linejoin="round" fill-rule="evenodd" d="M113.87 161.85C114.41 161.65 114.99 162.26 115.57 162.14C118.5 161.52 121.44 160.59 124.46 161.91C126.08 162.61 126.72 164.71 125.01 165.79C122.8 167.19 119.82 165.99 117.44 165.97C116.35 165.95 115.02 166.35 114.09 165.55C113.36 164.93 112.56 162.36 113.87 161.85Z"/>
    <path fill="#1B1610" fill-rule="evenodd" d="M169.04 160.8C170.03 160.26 171.38 161.26 172.23 161.6C174.23 162.39 176.28 162.35 178.39 162.34C180.74 162.34 183.13 162.49 185.48 162.3C187.26 162.15 189.26 161.08 191.02 161.24C194.05 161.49 195.71 164.64 195.97 167.28C196.15 169.22 196.09 171.22 196.07 173.17C196.05 174.83 196.24 176.99 195.41 178.51C194.56 180.06 192.77 180.21 191.21 180.31C187.25 180.57 183.22 180.36 179.26 180.36C177.28 180.36 175.29 180.38 173.31 180.34C173.31 180.34 171.58 180.3 171.58 180.3C171.11 180.27 169.73 180.25 170.18 180.08C171.88 179.44 174.63 179.93 176.41 179.93C180.41 179.93 184.41 179.96 188.4 179.93C190.37 179.91 193.52 180.26 194.83 178.35C196.09 176.49 195.67 173.28 195.62 171.18C195.58 169.53 195.64 167.52 194.77 166.04C193.56 164 190.85 164.05 188.81 164C183.51 163.85 178.17 164.27 172.88 163.93C171.51 163.84 169.59 163.74 168.77 162.38C168.48 161.88 168.44 161.13 169.04 160.8ZM176.35 168.19C178.61 167.34 184.36 167.23 186.21 169.02C188 170.75 187.44 174.49 185.16 175.49C182.99 176.44 178.49 176.54 176.38 175.38C174.25 174.2 173.77 169.16 176.35 168.19Z"/>
    <circle cx="149.55" cy="194.18" r="19.27" fill="#F2E7CE" stroke="#1B1610" stroke-width="1.6"/>
    <circle cx="149.55" cy="194.18" r="15.87" fill="#1B1610"/>
    <circle cx="149.55" cy="194.18" r="11.77" fill="#3B4A42"/>
    <circle cx="149.55" cy="194.18" r="8.27" fill="#141310"/>
    <circle cx="143.76" cy="188.39" r="3.08" fill="#FBF6EA"/>
    <g class="eclair-g" stroke="#D9A62E" stroke-width="4.5" stroke-linecap="round">
    <line x1="150" y1="150" x2="150" y2="134"/>
    <line x1="137" y1="155" x2="127" y2="143"/>
    <line x1="163" y1="155" x2="173" y2="143"/>
    <line x1="131" y1="166" x2="116" y2="162"/>
    <line x1="169" y1="166" x2="184" y2="162"/>
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
  /* sur téléphone, les formats larges occupent toute la grille (voir styles.css) :
     annoncer une largeur trop petite ferait charger la variante 700 px, puis
     l'étirer — c'est exactement ce qui donne une photo « compressée ». */
  const SIZES = {
    grande:   "(max-width: 719px) 92vw, (max-width: 1100px) 66vw, 50vw",
    panorama: "(max-width: 719px) 92vw, 78vw",
    haute:    "(max-width: 719px) 78vw, (max-width: 1100px) 45vw, 38vw",
    moyenne:  "(max-width: 719px) 92vw, (max-width: 1100px) 45vw, 38vw",
    petite:   "(max-width: 719px) 78vw, (max-width: 1100px) 34vw, 30vw",
  };

  /* une photo peut annoncer ses vraies proportions (ratio: "3/2") : c'est elles
     qui réservent la place avant le chargement, sinon on retombe sur celles de
     l'emplacement et la page sursaute quand l'image arrive. Dans tous les cas
     l'image s'affiche à ses proportions naturelles, jamais déformée. */
  function ratioPhoto(p) {
    const parts = String(p.ratio || "").split(/[/:x]/).map(Number);
    if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) return parts;
    return RATIOS[p.taille] || RATIOS.moyenne;
  }

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

  /* le nom d'un événement voyage dans l'URL : « Camille & Jonas » devient
     « camille-jonas ». C'est la même règle des deux côtés — les billets du
     palmarès, sur l'accueil, pointent vers photos.html?evenement=<cette forme>. */
  const slug = (s) => String(s)
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  function urlPhoto(p, largeur) {
    const [w, h] = ratioPhoto(p);
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

  /* une carte photo — le même objet sur les deux pages, seule la grille
     qui l'accueille change. `i` est le rang dans LISTE : c'est lui qui sert
     de clé au voile, quel que soit l'ordre d'affichage. */
  function carte(p, i) {
    const [w, h] = ratioPhoto(p);
    const num = String(i + 1).padStart(2, "0");
    /* l'export du panneau /admin omet les champs vides : tout est optionnel ici */
    const titre = p.titre || "sans titre";
    const meta = [p.categorie || "sans catégorie", p.lieu].filter(Boolean).join(" · ");
    /* rotation pseudo-aléatoire mais jamais imperceptible (>= 0.5°) */
    let tilt = ((((i * 137 + 41) % 100) / 100) * 2.6 - 1.3);
    if (Math.abs(tilt) < 0.5) tilt += tilt < 0 ? -0.5 : 0.5;
    const fig = document.createElement("figure");
    fig.className = `photo t-${p.taille}`;
    fig.dataset.cat = p.categorie || "sans catégorie";
    /* l'événement d'où vient la photo, sous sa forme d'URL : c'est cette clé
       que les billets du palmarès demandent en arrivant sur la page */
    if (p.evenement) fig.dataset.evt = slug(p.evenement);
    fig.dataset.index = i;
    fig.style.setProperty("--tilt", `${tilt.toFixed(2)}deg`);
    fig.setAttribute("data-reveal", "");
    fig.innerHTML = `
      <button class="photo-cadre" type="button" aria-haspopup="dialog" aria-label="agrandir « ${esc(titre)} »">
        <span class="photo-fen"><img src="${urlPhoto(p, 1100)}" ${srcsetPhoto(p)}
          alt="${esc(p.alt || titre)}" width="${w}" height="${h}"
          loading="lazy" decoding="async"></span>
        ${p.phrase ? `<span class="photo-phrase">${esc(p.phrase)}</span>` : ""}
      </button>
      <figcaption class="photo-legende">
        <span class="photo-num">n°${num}</span>
        <span class="photo-titre">${esc(titre)}</span>
        <span class="photo-meta">${esc(meta)}</span>
      </figcaption>`;
    fig.querySelector(".photo-cadre").addEventListener("click", (e) => {
      const origine = e.currentTarget;
      flash(null);
      setTimeout(() => ouvrirVoile(i, origine), mouvReduit ? 0 : 120);
    });
    return fig;
  }

  const grille = $("#grille");                 /* accueil : la sélection */
  const figures = [];
  /* figures est rempli dans l'ordre d'affichage : c'est cet ordre que
     suivent « précédente » et « suivante » dans le voile. */

  function ajoute(p, i, dans) {
    const fig = carte(p, i);
    dans.appendChild(fig);
    figures.push(fig);
  }

  /* ---------- l'accueil : les clichés favoris ---------- */
  if (grille) {
    const paires = LISTE.map((p, i) => [p, i]);
    const favoris = paires.filter(([p]) => p.favori);
    /* aucune photo cochée ? on montre les premières plutôt qu'une page vide */
    (favoris.length ? favoris : paires.slice(0, 6)).forEach(([p, i]) => ajoute(p, i, grille));
  }

  /* ---------- photos.html : tout le fonds, une grille + les filtres ---------- */
  /* le filtre demandé dans l'URL ne peut être appliqué qu'une fois `compte` et
     `enLettres` déclarés, plus bas : on garde le geste sous le coude ici et on
     le déclenche à ce moment-là */
  let filtreDArrivee = null;
  const grilleTout = $("#grille-tout");
  if (grilleTout) {
    LISTE.forEach((p, i) => ajoute(p, i, grilleTout));

    /* la barre de filtres se construit depuis ce qui est réellement présent
       dans les données : une catégorie inventée dans photos-data.js a son
       bouton, une catégorie vidée n'encombre plus la barre. Même chose pour
       les événements, qui forment un second groupe — deux axes de tri
       différents (le sujet, la prestation), donc deux rangées séparées plutôt
       qu'une seule barre où l'on ne saurait plus ce qu'on trie. */
    const filtres = $("#filtres");
    if (filtres) {
      const ORDRE_CATS = ["paysages", "macro", "animaux", "portraits", "architecture", "détails", "lumière"];
      const presentes = [...new Set(LISTE.map((p) => p.categorie || "sans catégorie"))];
      const cats = [
        ...ORDRE_CATS.filter((c) => presentes.includes(c)),
        ...presentes.filter((c) => !ORDRE_CATS.includes(c)).sort((a, b) => a.localeCompare(b, "fr")),
      ];
      /* les événements gardent l'ordre de photos-data.js : à toi de mettre le
         plus récent en premier, comme dans le palmarès de l'accueil */
      const evenements = [...new Set(LISTE.map((p) => p.evenement).filter(Boolean))];

      const bouton = (cle, val, texte, actif) =>
        `<button type="button" data-${cle}="${esc(val)}" aria-pressed="${String(actif)}">${esc(texte)}</button>`;

      let html = `<p class="filtres-titre" id="filtres-sujet">par sujet</p>`
        + `<div class="filtres-groupe" role="group" aria-labelledby="filtres-sujet">`
        + ["tout", ...cats].map((c) => bouton("cat", c, c, c === "tout")).join("")
        + `</div>`;
      if (evenements.length) {
        html += `<p class="filtres-titre" id="filtres-evt">par événement</p>`
          + `<div class="filtres-groupe" role="group" aria-labelledby="filtres-evt">`
          + evenements.map((e) => bouton("evt", slug(e), e, false)).join("")
          + `</div>`;
      }
      filtres.innerHTML = html;

      let filtreEnCours = null;
      /* un seul filtre actif à la fois, tous groupes confondus : filtrer sur
         « paysages » ET sur un mariage donnerait presque toujours zéro photo */
      function applique(btn) {
        const cat = btn.dataset.cat;
        const evt = btn.dataset.evt;
        const garde = (f) => (evt ? f.dataset.evt === evt : cat === "tout" || f.dataset.cat === cat);
        $$("button", filtres).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));

        clearTimeout(filtreEnCours);
        /* la liste à masquer est arrêtée maintenant, d'après le filtre lui-même.
           En relisant la classe .part au bout des 320ms, on dépendait de
           requestAnimationFrame pour l'avoir retirée à temps — or rAF est gelé
           dans un onglet en arrière-plan, et des photos à garder finissaient
           masquées au retour. */
        const aMasquer = figures.filter((f) => !garde(f));
        figures.forEach((f) => {
          if (garde(f)) {
            f.hidden = false;
            requestAnimationFrame(() => f.classList.remove("part"));
          } else {
            f.classList.add("part");
          }
        });
        filtreEnCours = setTimeout(() => {
          aMasquer.forEach((f) => { f.hidden = true; });
        }, 320);

        /* l'URL suit le filtre événement : la page reste partageable, et un
           retour arrière depuis une photo ne perd pas la sélection */
        const url = new URL(location.href);
        if (evt) url.searchParams.set("evenement", evt);
        else url.searchParams.delete("evenement");
        history.replaceState(null, "", url);

        annonce(figures.filter(garde).length, cat, evt && btn.textContent);
      }

      filtres.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-cat], button[data-evt]");
        if (btn) applique(btn);
      });

      /* arrivée depuis un billet du palmarès : ?evenement=camille-jonas */
      filtreDArrivee = () => {
        const demande = new URLSearchParams(location.search).get("evenement");
        if (!demande) return;
        const btn = $(`button[data-evt="${CSS.escape(demande)}"]`, filtres);
        if (btn) applique(btn);
        /* événement annoncé au palmarès mais dont aucune photo n'est encore
           publiée : on le dit, plutôt que d'afficher une page vide */
        else if (compte) compte.textContent = "aucune photo pour cet événement — pour l'instant, les voici toutes.";
      };
    }
  }

  /* ------------------------------------------------------------------
     le palmarès — un billet d'entrée par prestation couverte
  ------------------------------------------------------------------ */
  const MOIS = ["janv.", "févr.", "mars", "avril", "mai", "juin",
    "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const palmaresListe = $("#palmares-liste");
  let revelationPrete = false;

  /* « 2026-06 » → { mois: "juin", an: "2026" }. Une date incomplète ou farfelue
     ne casse pas le billet : elle s'affiche telle quelle dans la souche. */
  function litDate(d) {
    const m = /^(\d{4})-(\d{2})$/.exec(String(d || "").trim());
    if (!m) return { mois: String(d || ""), an: "", brut: "" };
    return { mois: MOIS[Number(m[2]) - 1] || m[2], an: m[1], brut: `${m[1]}-${m[2]}` };
  }

  function rendPalmares() {
    if (!palmaresListe) return;
    palmaresListe.innerHTML = BILLETS.map((b, i) => {
      const { mois, an, brut } = litDate(b.date);
      /* le lien se déduit du nom : il tombe donc forcément sur la même clé que
         le champ `evenement` des photos, sans slug à recopier à la main */
      const cible = `photos.html?evenement=${encodeURIComponent(slug(b.quoi || ""))}`;
      return `<li class="billet" data-reveal data-billet="${i}">
        <time class="billet-souche"${brut ? ` datetime="${brut}"` : ""}>
          <span class="billet-mois">${esc(mois)}</span>
          <span class="billet-an">${esc(an)}</span>
        </time>
        <span class="billet-corps">
          ${b.genre ? `<span class="billet-genre">${esc(b.genre)}</span>` : ""}
          <a class="billet-quoi billet-lien" href="${esc(cible)}">${esc(b.quoi || "sans titre")}</a>
          ${b.ou ? `<span class="billet-ou">${esc(b.ou)}</span>` : ""}
        </span>
        <span class="billet-num" aria-hidden="true"></span>
      </li>`;
    }).join("");
    /* au premier rendu, l'observateur d'apparitions n'existe pas encore : il
       balaiera la page juste après et trouvera les billets. Aux rendus
       suivants (mode édition), il est déjà passé — les billets neufs seraient
       donc restés invisibles, on les montre directement. */
    if (revelationPrete) $$("[data-reveal]", palmaresListe).forEach((el) => el.classList.add("vu"));
  }
  rendPalmares();

  /* ------------------------------------------------------------------
     le compte annoncé — il suit le nombre réel de photos (modifiable /admin).
     Sur l'accueil il présente la sélection, sur photos.html il sert aussi
     de réponse aux filtres (voir plus haut).
  ------------------------------------------------------------------ */
  const EN_LETTRES = ["zéro", "une", "deux", "trois", "quatre", "cinq", "six", "sept",
    "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze",
    "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const DIZAINES = { 20: "vingt", 30: "trente", 40: "quarante", 50: "cinquante", 60: "soixante" };
  /* le fonds finira par dépasser vingt photos : « six préférées, sur 22 en tout »
     mélangeait les lettres et les chiffres dans la même phrase. Au-delà de
     soixante-neuf, le français se complique pour rien — on repasse au chiffre. */
  function enLettres(n) {
    if (EN_LETTRES[n]) return EN_LETTRES[n];
    const d = Math.floor(n / 10) * 10;
    const u = n % 10;
    if (!DIZAINES[d]) return n;
    if (u === 0) return DIZAINES[d];
    if (u === 1) return `${DIZAINES[d]} et une`;
    return `${DIZAINES[d]}-${EN_LETTRES[u]}`;
  }
  const compte = $("#compte");
  if (compte) {
    compte.textContent = compte.dataset.compte === "selection"
      ? `${enLettres(figures.length)} préférées, sur ${enLettres(LISTE.length)} en tout.`
      : `${enLettres(LISTE.length)} photos, zéro mensonge.`;
  }

  /* la phrase qui répond aux filtres. Déclarée en `function` pour être hissée :
     applique() l'appelle depuis le bloc des filtres, écrit plus haut. */
  function annonce(n, cat, nomEvt) {
    if (!compte) return;
    if (nomEvt) {
      compte.textContent = `${enLettres(n)} photo${n > 1 ? "s" : ""} de « ${nomEvt} ».`;
      return;
    }
    if (cat === "tout") {
      compte.textContent = `${enLettres(n)} photos, zéro mensonge.`;
      return;
    }
    const de = /^[aeiouâàéèêîôû]/i.test(cat) ? "d'" : "de ";
    compte.textContent = `${enLettres(n)} photo${n > 1 ? "s" : ""} ${de}${cat}, toujours zéro mensonge.`;
  }

  /* maintenant que le compte sait parler, on peut honorer le ?evenement= de l'URL */
  if (filtreDArrivee) filtreDArrivee();

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
  /* .lien-evasion compris : enfant direct de <body>, il resterait
     atteignable au clavier derrière le voile ouvert */
  const arrierePlan = [$(".lien-evasion"), $(".entete"), $("main"), $(".pied")].filter(Boolean);
  let indexCourant = -1;
  let ouvreur = null;
  let voileTimer = null;
  let navTimer = null;
  let navFin = null;

  /* les photos en cours de départ (.part) ne comptent déjà plus :
     sans ça, ouvrir le voile pendant les 320 ms du fondu de filtrage
     ferait défiler des photos censées avoir disparu */
  const visiblesIdx = () => figures
    .filter((f) => !f.hidden && !f.classList.contains("part"))
    .map((f) => +f.dataset.index);

  function remplitVoile(i) {
    const p = LISTE[i];
    const [w, h] = ratioPhoto(p);
    const liste = visiblesIdx();
    const rang = liste.indexOf(i) + 1;
    const largeur = largeurVoile();
    voileImg.width = w;
    voileImg.height = h;
    voileImg.src = urlPhoto(p, largeur);
    voileImg.alt = p.alt || p.titre || "";
    voileTitre.textContent = p.titre || "sans titre";
    voileMeta.textContent = [p.lieu, p.date, p.categorie].filter(Boolean).join(" · ");
    voileDesc.textContent = p.description || "";
    voilePhrase.textContent = p.phrase ? `« ${p.phrase} »` : "";
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
    /* une navigation encore en vol ne doit pas remplir un voile fermé,
       ni laisser « change » cacher l'image à la prochaine ouverture */
    clearTimeout(navTimer);
    clearTimeout(navFin);
    voile.classList.remove("ouvert", "change");
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
  revelationPrete = true;

  /* ------------------------------------------------------------------
     machine à écrire — le texte s'écrit tout seul, une virgule bleue
     tient lieu de curseur.

     Les lettres sont posées dans le DOM dès le départ, simplement
     transparentes : la place est déjà réservée, donc rien ne saute
     pendant que ça s'écrit. Elles restent en `inline` (pas en
     inline-block) pour ne pas autoriser une coupure au milieu d'un mot.
  ------------------------------------------------------------------ */
  const PAUSES = { ",": 280, ";": 260, ":": 220, ".": 420, "!": 420, "?": 420, "…": 460 };

  function decoupeEnLettres(noeud, lettres) {
    [...noeud.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const c of n.textContent) {
          const s = document.createElement("span");
          s.className = "lettre";
          s.textContent = c;
          lettres.push(s);
          frag.appendChild(s);
        }
        n.replaceWith(frag);
      } else if (n.nodeName === "BR") {
        lettres.push(n);
      } else if (n.nodeType === 1) {
        decoupeEnLettres(n, lettres);
      }
    });
  }

  function machineAEcrire(el, opts = {}) {
    if (!el || mouvReduit || el.dataset.ecrit) return;
    /* onglet en arrière-plan : le navigateur ralentit les minuteurs à environ
       un par seconde et la phrase s'écrirait au compte-gouttes. On attend. */
    if (document.hidden) {
      document.addEventListener("visibilitychange", () => machineAEcrire(el, opts), { once: true });
      return;
    }
    const { vitesse = 42, depart = 300 } = opts;
    el.dataset.ecrit = "1";

    /* les lecteurs d'écran reçoivent la phrase entière, pas la version
       découpée en lettres : copie invisible + animation masquée pour eux */
    const srOnly = document.createElement("span");
    srOnly.className = "sr-only";
    srOnly.textContent = (el.innerText || el.textContent).replace(/\s+/g, " ").trim();
    const anime = document.createElement("span");
    anime.setAttribute("aria-hidden", "true");
    while (el.firstChild) anime.appendChild(el.firstChild);
    el.append(srOnly, anime);

    const lettres = [];
    decoupeEnLettres(anime, lettres);
    if (!lettres.length) return;

    el.classList.add("ecrit");
    const curseur = document.createElement("span");
    curseur.className = "curseur";
    curseur.setAttribute("aria-hidden", "true");
    curseur.innerHTML = "<i>,</i>";
    anime.prepend(curseur);

    let i = 0;
    const suivante = () => {
      const n = lettres[i];
      let pause = vitesse;
      if (n.nodeName === "BR") {
        /* c'est là que le site marque vraiment une pause */
        pause = 540;
      } else {
        n.classList.add("la");
        pause += PAUSES[n.textContent] || 0;
      }
      n.after(curseur);
      i += 1;
      if (i < lettres.length) setTimeout(suivante, pause);
      else setTimeout(() => curseur.classList.add("fini"), 1100);
    };
    setTimeout(suivante, depart);
  }

  machineAEcrire($(".hero-phrase"), { depart: 420 });

  /* la promesse de contact s'écrit quand on arrive dessus */
  const promesse = $(".contact-promesse");
  if (promesse && !mouvReduit && "IntersectionObserver" in window) {
    const obsEcrit = new IntersectionObserver((entrees) => {
      entrees.forEach((en) => {
        if (!en.isIntersecting) return;
        obsEcrit.unobserve(en.target);
        machineAEcrire(en.target, { vitesse: 26, depart: 350 });
      });
    }, { threshold: 0.6 });
    obsEcrit.observe(promesse);
  }

  /* ------------------------------------------------------------------
     la flèche manuscrite se dessine au lieu d'apparaître.
     La classe est posée ici : sans JS, pas de pointillés, donc pas de
     risque de flèche invisible.
  ------------------------------------------------------------------ */
  if (!mouvReduit) {
    $$(".annot-courbe").forEach((svg) => {
      svg.classList.add("anime");
      $$("path", svg).forEach((p, i) => {
        p.style.setProperty("--trait", p.getTotalLength().toFixed(1));
        p.style.setProperty("--retard", `${1200 + i * 340}ms`);
      });
    });
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
     easter egg — taper « virgule » : le personnage salue de son chapeau
  ------------------------------------------------------------------ */
  {
    const MOT = "virgule";
    let tape = "";
    addEventListener("keydown", (e) => {
      /* on ignore la frappe dans un champ, et les touches spéciales */
      if (e.key.length !== 1 || e.target?.closest?.("input, textarea, [contenteditable]")) return;
      tape = (tape + e.key.toLowerCase()).slice(-MOT.length);
      if (tape !== MOT || !persoHero) return;
      tape = "";
      persoHero.classList.remove("salut");
      void persoHero.getBoundingClientRect();
      persoHero.classList.add("salut");
      setTimeout(() => persoHero.classList.remove("salut"), 1200);
      ecrireToast("il te salue. c'est tout ce qu'il sait faire, mais il le fait bien.", 4200);
    });
  }

  /* ------------------------------------------------------------------
     easter egg — code konami : une petite parade traverse le bas de l'écran
  ------------------------------------------------------------------ */
  {
    const CODE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let rang = 0;
    let enCours = false;
    addEventListener("keydown", (e) => {
      const touche = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      rang = touche === CODE[rang] ? rang + 1 : (touche === CODE[0] ? 1 : 0);
      if (rang < CODE.length || enCours) return;
      rang = 0;
      enCours = true;
      const parade = document.createElement("div");
      parade.className = "parade";
      parade.setAttribute("aria-hidden", "true");
      for (let i = 0; i < 6; i++) {
        const slot = document.createElement("div");
        slot.className = "perso-slot";
        slot.style.animationDelay = `${i * 0.55}s`;
        slot.style.bottom = `${(i % 3) * 9}px`;
        slot.innerHTML = personnageSVG("parade");
        parade.appendChild(slot);
      }
      document.body.appendChild(parade);
      ecrireToast("six virgules. c'est déjà une phrase, techniquement.", 5000);
      setTimeout(() => parade.remove(), 11000);
      setTimeout(() => { enCours = false; }, 11000);
    });
  }

  /* un mot pour ceux qui ouvrent la console */
  console.log(
    "%cvirgule.%c\ntu regardes sous le capot. c'est la même chose qu'ouvrir\nle dos d'un appareil : ça se démonte, mais il y a du film dedans.\n\nessaie de taper « virgule » sur la page. ou le code konami.",
    "font: italic 700 22px Georgia, serif; color:#385086",
    "font: 13px/1.6 ui-monospace, monospace; color:#4A4234"
  );

  /* ------------------------------------------------------------------
     phrase inattendue si le visiteur s'attarde
     (sessionStorage peut lever si le stockage est bloqué : dans ce cas,
     on considère la phrase déjà vue et on n'installe rien)
  ------------------------------------------------------------------ */
  let phraseDejaVue = true;
  try { phraseDejaVue = !!sessionStorage.getItem("virgule-vu"); } catch (e) { /* stockage bloqué */ }
  if (!phraseDejaVue) {
    let inactif = null;
    let dernier = 0;
    const evenements = ["pointermove", "scroll", "keydown", "click"];
    const repartir = () => {
      const t = Date.now();
      if (t - dernier < 1000) return;
      dernier = t;
      clearTimeout(inactif);
      inactif = setTimeout(() => {
        try { sessionStorage.setItem("virgule-vu", "1"); } catch (e) { /* tant pis */ }
        evenements.forEach((ev) => removeEventListener(ev, repartir));
        ecrireToast("toujours là ? prends ton temps. les photos n'ont pas bougé depuis tout à l'heure.", 6500);
      }, 45000);
    };
    evenements.forEach((ev) => addEventListener(ev, repartir, { passive: true }));
    repartir();
  }

  /* ------------------------------------------------------------------
     le mode édition — les crayons sur le site lui-même
     --------------------------------------------------------------------
     /admin pose un drapeau de session en s'ouvrant ; on ne charge js/edition.js
     que s'il est là. Un visiteur ordinaire ne télécharge donc rien de tout ça.

     Ce drapeau n'est PAS une sécurité : n'importe qui peut le poser à la main,
     l'empreinte du mot de passe étant dans le source de /admin. Ce n'est pas
     grave tant que l'édition ne fait qu'écrire dans le localStorage de celui
     qui édite — la publication, elle, passe par les fichiers à retélécharger
     depuis /admin. Ne jamais rien enregistrer côté serveur ici.
  ------------------------------------------------------------------ */
  let editionOuverte = false;
  try { editionOuverte = !!sessionStorage.getItem("virgule-admin-ouvert"); } catch (e) { /* rien */ }
  if (editionOuverte) {
    /* la passerelle que js/edition.js utilise pour relire et réappliquer,
       sans redéclarer ce que main.js sait déjà faire */
    window.VIRGULE_EDITION = {
      config: () => CONFIG,
      poseConfig: (c) => { CONFIG = c; },
      texteVersHtml,
      slug,
      litDate,
      poseBillets: (liste) => { BILLETS = liste; rendPalmares(); },
      billets: () => BILLETS,
      photos: () => LISTE,
      toast: ecrireToast,
    };
    const s = document.createElement("script");
    s.src = "js/edition.js";
    document.body.appendChild(s);
  }
})();
