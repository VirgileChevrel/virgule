/* ==========================================================================
   virgule. — le mode édition
   --------------------------------------------------------------------------
   Ce fichier n'est chargé QUE si /admin a posé son drapeau de session
   (voir la fin de js/main.js). Un visiteur ordinaire ne le télécharge jamais,
   et ses styles ne sont pas dans css/styles.css pour la même raison.

   Tout ce qu'il fait, c'est écrire dans le localStorage de celui qui édite.
   Rien ne part sur un serveur, rien n'est publié : publier, c'est retourner
   sur /admin et retélécharger js/photos-data.js et js/site-config.js.
   C'est ce qui rend acceptable que le drapeau de session soit falsifiable —
   un curieux ne modifierait que sa propre copie, dans son propre navigateur.
   ========================================================================== */
(() => {
  "use strict";

  const API = window.VIRGULE_EDITION;
  if (!API) return;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const CLE = "virgule-config";

  /* ------------------------------------------------------------------
     la config de travail
     --------------------------------------------------------------------
     On garde les MÊMES objets que ceux affichés par main.js (pas de copie) :
     modifier une photo dans la fiche modifie du même geste ce qui sera
     enregistré, sans risque que les deux versions divergent.
  ------------------------------------------------------------------ */
  const conf = API.config() && typeof API.config() === "object" ? API.config() : {};
  if (!conf.textes || typeof conf.textes !== "object") conf.textes = {};
  API.poseConfig(conf);

  /* le stockage du navigateur plafonne autour de 5 Mo : mieux vaut prévenir à
     l'approche que laisser un enregistrement échouer sans raison visible */
  function previensDuPoids() {
    let taille = 0;
    try { taille = (localStorage.getItem(CLE) || "").length; } catch (e) { return; }
    const mo = taille / 1024 / 1024;
    if (mo > 3) {
      API.toast(`attention : tes réglages pèsent ${mo.toFixed(1)} Mo, la limite du navigateur est autour de 5. dépose plutôt tes images dans le dossier photos/ et donne leur chemin.`, 8000);
    }
  }

  let sauvegardeEnCours = null;
  function enregistre(message) {
    conf.photos = API.photos();
    conf.palmares = API.billets();
    try {
      localStorage.setItem(CLE, JSON.stringify(conf));
      clearTimeout(sauvegardeEnCours);
      marqueNonPublie();
      if (message) API.toast(message, 2600);
    } catch (e) {
      API.toast("impossible d'enregistrer : le stockage du navigateur est plein ou bloqué.", 6000);
    }
  }

  /* ------------------------------------------------------------------
     les styles du mode édition — injectés ici, jamais servis aux visiteurs
  ------------------------------------------------------------------ */
  const style = document.createElement("style");
  style.textContent = `
    body.edition { padding-bottom: 5.5rem; }
    /* tout ce qui se modifie porte un liseré : on voit d'un coup d'œil le
       périmètre du crayon, sans avoir à survoler la page au hasard */
    body.edition [data-texte],
    body.edition .photo,
    body.edition .billet { outline: 1px dashed rgba(56, 80, 134, 0.5); outline-offset: 3px; }
    body.edition [data-texte]:hover,
    body.edition .photo:hover,
    body.edition .billet:hover { outline-color: var(--bleu); outline-style: solid; }

    .ed-crayon {
      position: absolute;
      z-index: 60;
      display: grid;
      place-items: center;
      width: 1.9rem; height: 1.9rem;
      padding: 0;
      font-size: 0.9rem;
      line-height: 1;
      cursor: pointer;
      background: var(--bleu);
      color: var(--ivoire);
      border: 1.5px solid var(--noir);
      border-radius: 50%;
      box-shadow: 0 2px 0 rgba(27, 22, 16, 0.35);
    }
    .ed-crayon:hover { background: var(--moutarde); color: var(--noir); }
    /* le crayon des textes est unique et se déplace : coller un bouton dans
       chacun des 27 emplacements casserait des mises en page qui reposent sur
       du positionnement absolu ou des transformations */
    .ed-crayon-texte { position: fixed; display: none; }
    .ed-crayon-texte.la { display: grid; }
    .photo .ed-crayon, .billet .ed-crayon { top: -0.7rem; left: -0.7rem; }

    .ed-barre {
      position: fixed;
      left: 0; right: 0; bottom: 0;
      z-index: 70;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.6rem;
      padding: 0.7rem clamp(1rem, 4vw, 2rem);
      background: var(--noir);
      color: var(--ivoire);
      font-family: var(--sans);
      font-size: 0.85rem;
    }
    .ed-barre-titre { font-family: var(--main); font-size: 1.35rem; margin-right: auto; }
    .ed-barre-titre .point { color: var(--moutarde); }
    .ed-etat { font-size: 0.78rem; opacity: 0.75; }
    .ed-btn {
      font: inherit;
      cursor: pointer;
      padding: 0.35rem 0.9rem;
      background: transparent;
      color: var(--ivoire);
      border: 1.5px solid var(--ivoire);
      border-radius: var(--tordu);
      text-decoration: none;
    }
    .ed-btn:hover { background: var(--ivoire); color: var(--noir); }
    .ed-btn-fort { background: var(--moutarde); border-color: var(--moutarde); color: var(--noir); }

    .ed-voile { position: fixed; inset: 0; z-index: 80; background: rgba(27, 22, 16, 0.45); }
    .ed-fiche {
      position: fixed;
      z-index: 81;
      left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      width: min(30rem, calc(100vw - 2rem));
      max-height: min(38rem, calc(100vh - 2rem));
      overflow: auto;
      padding: 1.4rem 1.5rem 1.5rem;
      background: var(--ivoire);
      border: 1.5px solid var(--noir);
      box-shadow: 0 10px 0 rgba(27, 22, 16, 0.2);
    }
    .ed-fiche h2 {
      margin: 0 0 1.1rem;
      font-family: var(--serif);
      font-style: italic;
      font-size: 1.5rem;
    }
    .ed-champ { display: block; margin-bottom: 0.9rem; }
    .ed-champ > span {
      display: block;
      margin-bottom: 0.25rem;
      font-size: 0.72rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--encre);
    }
    .ed-champ input, .ed-champ textarea, .ed-champ select {
      font: inherit;
      width: 100%;
      padding: 0.45rem 0.6rem;
      background: #fff;
      color: var(--noir);
      border: 1.5px solid var(--noir);
      border-radius: 0;
    }
    .ed-champ textarea { min-height: 5.5rem; resize: vertical; line-height: 1.4; }
    .ed-aide { margin: -0.4rem 0 1rem; font-size: 0.75rem; color: var(--encre); }
    .ed-coche { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.9rem; font-size: 0.9rem; }
    .ed-coche input { width: auto; }
    .ed-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 1.2rem; }
    .ed-actions .ed-btn { color: var(--noir); border-color: var(--noir); }
    .ed-actions .ed-btn:hover { background: var(--noir); color: var(--ivoire); }
    .ed-actions .ed-btn-fort { background: var(--bleu); border-color: var(--bleu); color: var(--ivoire); }
    .ed-actions .ed-btn-fort:hover { background: var(--noir); border-color: var(--noir); }
    .ed-supprimer { margin-left: auto; border-color: #8c2f2f !important; color: #8c2f2f !important; }
    .ed-supprimer:hover { background: #8c2f2f !important; color: var(--ivoire) !important; }

    .ed-ajout { margin: 1.6rem 0 0; }
  `;
  document.head.appendChild(style);
  document.body.classList.add("edition");

  /* ------------------------------------------------------------------
     charger une image depuis l'ordinateur
     --------------------------------------------------------------------
     Le fichier ne peut pas être déposé dans photos/ — un site statique n'écrit
     pas sur son propre serveur. Il est donc gardé dans le navigateur, en clair
     dans la config. Une photo d'appareil moderne y ferait 4 à 6 Mo, et le
     base64 en rajoute un tiers : à ce compte-là, une seule image remplirait le
     stockage. On la redimensionne donc avant de la garder.
  ------------------------------------------------------------------ */
  const COTE_MAX = 1600;

  function optimiseImage(fichier) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(fichier);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const ech = Math.min(1, COTE_MAX / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * ech));
        c.height = Math.max(1, Math.round(img.height * ech));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        /* webp d'abord — environ un tiers plus léger que le jpeg à qualité
           égale. Un navigateur qui ne sait pas l'écrire renvoie du png sans
           prévenir : on le repère et on bascule sur du jpeg, parce qu'un png
           de photographie pèserait plusieurs fois le poids du jpeg. */
        let d = c.toDataURL("image/webp", 0.82);
        if (!d.startsWith("data:image/webp")) d = c.toDataURL("image/jpeg", 0.82);
        resolve({ url: d, w: c.width, h: c.height, ko: Math.round((d.length * 3) / 4 / 1024) });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image illisible")); };
      img.src = url;
    });
  }

  /* ------------------------------------------------------------------
     la fiche d'édition — un petit formulaire au milieu de l'écran
     --------------------------------------------------------------------
     champs : [{ cle, libelle, type, aide, options, valeur }]
     type : "texte" | "ligne" | "mois" | "liste" | "coche" | "fichier"
  ------------------------------------------------------------------ */
  let ficheOuverte = null;

  function fermeFiche() {
    if (!ficheOuverte) return;
    ficheOuverte.voile.remove();
    ficheOuverte.fiche.remove();
    const rendre = ficheOuverte.rendreLeFocus;
    ficheOuverte = null;
    document.removeEventListener("keydown", auClavier);
    if (rendre && document.contains(rendre)) rendre.focus();
  }

  function auClavier(e) {
    if (e.key === "Escape") { e.preventDefault(); fermeFiche(); }
  }

  function ouvreFiche({ titre, champs, onValide, onSupprime, rendreLeFocus }) {
    fermeFiche();
    const voile = document.createElement("div");
    voile.className = "ed-voile";
    const fiche = document.createElement("div");
    fiche.className = "ed-fiche";
    fiche.setAttribute("role", "dialog");
    fiche.setAttribute("aria-modal", "true");
    fiche.setAttribute("aria-label", titre);

    const corps = champs.map((c) => {
      const id = `ed-${c.cle}`;
      const v = c.valeur == null ? "" : String(c.valeur);
      if (c.type === "coche") {
        return `<label class="ed-coche"><input type="checkbox" id="${id}"${c.valeur ? " checked" : ""}> ${c.libelle}</label>`;
      }
      let saisie;
      if (c.type === "fichier") {
        saisie = `<input type="file" id="${id}" accept="image/*">`
          + `<p class="ed-aide" data-etat-fichier="${c.cle}"></p>`;
      } else if (c.type === "texte") saisie = `<textarea id="${id}">${v.replace(/</g, "&lt;")}</textarea>`;
      else if (c.type === "mois") saisie = `<input type="month" id="${id}" value="${v.replace(/"/g, "&quot;")}">`;
      else if (c.type === "liste") {
        saisie = `<select id="${id}">${c.options.map((o) =>
          `<option value="${o.replace(/"/g, "&quot;")}"${o === v ? " selected" : ""}>${o}</option>`).join("")}</select>`;
      } else saisie = `<input type="text" id="${id}" value="${v.replace(/"/g, "&quot;")}">`;
      return `<label class="ed-champ"><span>${c.libelle}</span>${saisie}</label>`
        + (c.aide ? `<p class="ed-aide">${c.aide}</p>` : "");
    }).join("");

    fiche.innerHTML = `<h2>${titre}</h2>${corps}
      <div class="ed-actions">
        <button type="button" class="ed-btn ed-btn-fort" data-valide>enregistrer</button>
        <button type="button" class="ed-btn" data-annule>annuler</button>
        ${onSupprime ? `<button type="button" class="ed-btn ed-supprimer" data-supprime>supprimer</button>` : ""}
      </div>`;

    document.body.append(voile, fiche);
    ficheOuverte = { voile, fiche, rendreLeFocus };
    document.addEventListener("keydown", auClavier);
    voile.addEventListener("click", fermeFiche);

    /* l'image choisie est redimensionnée de façon asynchrone : on garde le
       résultat sur le champ lui-même, pour que la lecture reste synchrone */
    champs.filter((c) => c.type === "fichier").forEach((c) => {
      const el = $(`#ed-${c.cle}`, fiche);
      const dit = $(`[data-etat-fichier="${c.cle}"]`, fiche);
      const valide = $("[data-valide]", fiche);
      el.addEventListener("change", async () => {
        const f = el.files[0];
        if (!f) { el.imagePrete = null; dit.textContent = ""; return; }
        dit.textContent = "lecture de l'image…";
        valide.disabled = true;
        try {
          const r = await optimiseImage(f);
          el.imagePrete = r;
          dit.textContent = `prête : ${r.w}×${r.h} px, environ ${r.ko} Ko. elle remplacera l'image en enregistrant.`;
        } catch (e) {
          el.imagePrete = null;
          dit.textContent = "ce fichier n'a pas pu être lu comme une image.";
        }
        valide.disabled = false;
      });
    });

    const lit = () => {
      const out = {};
      champs.forEach((c) => {
        const el = $(`#ed-${c.cle}`, fiche);
        if (c.type === "coche") out[c.cle] = el.checked;
        else if (c.type === "fichier") out[c.cle] = el.imagePrete || null;
        else out[c.cle] = el.value;
      });
      return out;
    };
    $("[data-valide]", fiche).addEventListener("click", () => { const v = lit(); fermeFiche(); onValide(v); });
    $("[data-annule]", fiche).addEventListener("click", fermeFiche);
    if (onSupprime) {
      $("[data-supprime]", fiche).addEventListener("click", () => { fermeFiche(); onSupprime(); });
    }
    const premier = $("textarea, input, select", fiche);
    if (premier) premier.focus();
  }

  /* ------------------------------------------------------------------
     les textes — un crayon unique qui suit l'élément survolé
  ------------------------------------------------------------------ */
  const crayonTexte = document.createElement("button");
  crayonTexte.type = "button";
  crayonTexte.className = "ed-crayon ed-crayon-texte";
  crayonTexte.textContent = "✎";
  crayonTexte.title = "modifier ce texte";
  document.body.appendChild(crayonTexte);
  let cibleTexte = null;

  function placeCrayon(el) {
    cibleTexte = el;
    const r = el.getBoundingClientRect();
    crayonTexte.style.top = `${Math.max(4, r.top - 10)}px`;
    crayonTexte.style.left = `${Math.min(innerWidth - 36, r.right - 8)}px`;
    crayonTexte.classList.add("la");
    crayonTexte.setAttribute("aria-label", `modifier « ${el.dataset.texte} »`);
  }

  document.addEventListener("mouseover", (e) => {
    const el = e.target.closest && e.target.closest("[data-texte]");
    if (el) placeCrayon(el);
    else if (!e.target.closest || !e.target.closest(".ed-crayon-texte")) crayonTexte.classList.remove("la");
  });
  /* au clavier aussi : le mode édition doit rester utilisable sans souris */
  document.addEventListener("focusin", (e) => {
    const el = e.target.closest && e.target.closest("[data-texte]");
    if (el) placeCrayon(el);
  });
  addEventListener("scroll", () => { if (cibleTexte) placeCrayon(cibleTexte); }, { passive: true });

  crayonTexte.addEventListener("click", () => {
    if (!cibleTexte) return;
    const el = cibleTexte;
    const cle = el.dataset.texte;
    /* on repart du texte affiché, pas de la config : si la clé n'a jamais été
       modifiée, l'écrire depuis zéro serait absurde */
    const actuel = conf.textes[cle] != null
      ? conf.textes[cle]
      : el.innerHTML.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?em>/gi, "").replace(/<[^>]+>/g, "").trim();
    ouvreFiche({
      titre: `texte « ${cle} »`,
      rendreLeFocus: crayonTexte,
      champs: [{
        cle: "valeur", libelle: "le texte", type: "texte", valeur: actuel,
        aide: "un retour à la ligne fait un saut de ligne. une ligne entière entre parenthèses s'affiche en italique.",
      }],
      onValide: ({ valeur }) => {
        conf.textes[cle] = valeur;
        $$(`[data-texte="${CSS.escape(cle)}"]`).forEach((n) => { n.innerHTML = API.texteVersHtml(valeur); });
        enregistre("texte enregistré");
      },
    });
  });

  /* ------------------------------------------------------------------
     les photos — un crayon au coin de chaque carte
  ------------------------------------------------------------------ */
  const TAILLES = ["grande", "panorama", "haute", "moyenne", "petite"];

  function fichePhoto(fig) {
    const photos = API.photos();
    const p = photos[Number(fig.dataset.index)];
    if (!p) return;
    ouvreFiche({
      titre: "cette photo",
      champs: [
        { cle: "titre", libelle: "titre", type: "ligne", valeur: p.titre },
        { cle: "categorie", libelle: "catégorie", type: "ligne", valeur: p.categorie },
        { cle: "lieu", libelle: "lieu", type: "ligne", valeur: p.lieu },
        { cle: "date", libelle: "date (texte libre)", type: "ligne", valeur: p.date },
        {
          cle: "evenement", libelle: "événement", type: "ligne", valeur: p.evenement,
          aide: "doit être écrit à l'identique sur toutes les photos du même événement, et pareil que le billet du palmarès.",
        },
        { cle: "description", libelle: "description (en grand format)", type: "texte", valeur: p.description },
        { cle: "phrase", libelle: "la petite phrase au survol", type: "ligne", valeur: p.phrase },
        { cle: "alt", libelle: "description pour les lecteurs d'écran", type: "texte", valeur: p.alt },
        {
          cle: "fichier", libelle: "remplacer l'image", type: "fichier",
          aide: `choisis une image sur ton ordinateur : elle est réduite à ${COTE_MAX} px avant d'être gardée. pratique pour voir tout de suite le résultat — mais pour publier, mieux vaut déposer le fichier dans le dossier photos/ et donner son chemin ci-dessous.`,
        },
        { cle: "image", libelle: "chemin du fichier", type: "ligne", valeur: p.image, aide: "par exemple photos/mon-mariage.webp — ou photos/mon-mariage-{w}.webp si tu as préparé plusieurs largeurs." },
        { cle: "taille", libelle: "taille", type: "liste", options: TAILLES, valeur: p.taille || "moyenne" },
        { cle: "favori", libelle: "la montrer sur l'accueil", type: "coche", valeur: !!p.favori },
      ],
      onValide: (v) => {
        const avant = { taille: p.taille, favori: !!p.favori, image: p.image };
        const fichier = v.fichier;
        delete v.fichier;
        Object.keys(v).forEach((k) => {
          if (k === "favori") p.favori = v.favori;
          else if (String(v[k]).trim() === "") delete p[k];
          else p[k] = v[k];
        });
        /* l'image chargée l'emporte sur le chemin saisi : c'est le geste le
           plus explicite des deux */
        if (fichier) {
          p.image = fichier.url;
          delete p.picsum;
          /* les proportions suivent la nouvelle image, sinon la page réserve la
             place de l'ancienne et sursaute au chargement */
          p.ratio = `${fichier.w}/${fichier.h}`;
        }
        /* ces trois-là changent la grille elle-même : plutôt que de la
           reconstruire à moitié, on recharge — c'est la seule façon d'être sûr
           que l'écran montre exactement ce qui est enregistré */
        const refonte = avant.taille !== p.taille || avant.favori !== !!p.favori || avant.image !== p.image;
        /* une image en clair dans la config gonfle vite : on le dit tant que le
           stockage tient encore, plutôt que d'échouer sans prévenir plus tard */
        if (fichier) previensDuPoids();
        enregistre(refonte ? "photo enregistrée — la page se recharge" : "photo enregistrée");
        if (refonte) { setTimeout(() => location.reload(), 700); return; }
        const t = $(".photo-titre", fig);
        const m = $(".photo-meta", fig);
        const ph = $(".photo-phrase", fig);
        const img = $(".photo-fen img", fig);
        if (t) t.textContent = p.titre || "sans titre";
        if (m) m.textContent = [p.categorie || "sans catégorie", p.lieu].filter(Boolean).join(" · ");
        if (ph) ph.textContent = p.phrase || "";
        if (img) img.alt = p.alt || p.titre || "";
        fig.dataset.cat = p.categorie || "sans catégorie";
        if (p.evenement) fig.dataset.evt = API.slug(p.evenement);
        else delete fig.dataset.evt;
      },
    });
  }

  /* ------------------------------------------------------------------
     le palmarès — crayon par billet, plus un bouton pour en ajouter un
  ------------------------------------------------------------------ */
  function ficheBillet(index) {
    const liste = API.billets().slice();
    const neuf = index == null;
    const b = neuf ? { date: "", genre: "", quoi: "", ou: "" } : liste[index];
    if (!b) return;
    ouvreFiche({
      titre: neuf ? "un nouveau billet" : "ce billet",
      champs: [
        { cle: "date", libelle: "mois", type: "mois", valeur: b.date, aide: "le nom du mois s'écrit tout seul, et les billets se rangent du plus récent au plus ancien." },
        { cle: "genre", libelle: "genre", type: "ligne", valeur: b.genre, aide: "mariage, gaming, concert… ce que tu veux." },
        {
          cle: "quoi", libelle: "nom de l'événement", type: "ligne", valeur: b.quoi,
          aide: "sert aussi de lien vers la galerie : écris-le pareil que le champ « événement » des photos.",
        },
        { cle: "ou", libelle: "lieu", type: "ligne", valeur: b.ou },
      ],
      onValide: (v) => {
        const majl = { ...b, ...v };
        if (neuf) liste.push(majl); else liste[index] = majl;
        /* rangés du plus récent au plus ancien, toujours : un palmarès dans le
           désordre n'a jamais l'air d'un palmarès, et ça évite une poignée de
           flèches « monter / descendre » à l'écran */
        liste.sort((x, y) => String(y.date || "").localeCompare(String(x.date || "")));
        API.poseBillets(liste);
        poseCrayonsBillets();
        enregistre(neuf ? "billet ajouté" : "billet enregistré");
      },
      onSupprime: neuf ? null : () => {
        liste.splice(index, 1);
        API.poseBillets(liste);
        poseCrayonsBillets();
        enregistre("billet supprimé");
      },
    });
  }

  function crayonPour(cible, libelle, action) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ed-crayon";
    b.textContent = "✎";
    b.title = libelle;
    b.setAttribute("aria-label", libelle);
    b.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); action(); });
    cible.appendChild(b);
  }

  function poseCrayonsBillets() {
    const liste = $("#palmares-liste");
    if (!liste) return;
    $$(".billet", liste).forEach((li, i) => {
      if (!$(".ed-crayon", li)) crayonPour(li, "modifier ce billet", () => ficheBillet(i));
    });
  }

  $$("#grille .photo, #grille-tout .photo").forEach((fig) => {
    crayonPour(fig, "modifier cette photo", () => fichePhoto(fig));
  });
  poseCrayonsBillets();

  const zonePalmares = $("#palmares");
  if (zonePalmares) {
    const p = document.createElement("p");
    p.className = "ed-ajout";
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ed-btn ed-btn-fort";
    b.style.cssText = "color:var(--noir);border-color:var(--noir)";
    b.textContent = "+ ajouter un billet";
    b.addEventListener("click", () => ficheBillet(null));
    p.appendChild(b);
    $("#palmares-liste").after(p);
  }

  /* ------------------------------------------------------------------
     la barre du bas
  ------------------------------------------------------------------ */
  const barre = document.createElement("div");
  barre.className = "ed-barre";
  barre.innerHTML = `
    <span class="ed-barre-titre">mode édition<span class="point">.</span></span>
    <span class="ed-etat" id="ed-etat" role="status"></span>
    <a class="ed-btn ed-btn-fort" href="admin/index.html">publier depuis /admin</a>
    <button type="button" class="ed-btn" id="ed-quitter">quitter</button>`;
  document.body.appendChild(barre);

  /* le chemin vers /admin dépend de la page : les pages sont à la racine, mais
     mieux vaut le calculer que le supposer si le site déménage dans un sous-dossier */
  $("a", barre).href = new URL("admin/", location.href.replace(/[^/]*$/, "")).pathname;

  function marqueNonPublie() {
    const e = $("#ed-etat");
    if (e) e.textContent = "modifications enregistrées dans ce navigateur — pas encore publiées";
  }
  const etat = $("#ed-etat");
  let dejaModifie = false;
  try { dejaModifie = !!localStorage.getItem(CLE); } catch (e) { /* rien */ }
  if (etat) {
    etat.textContent = dejaModifie
      ? "modifications enregistrées dans ce navigateur — pas encore publiées"
      : "clique sur un crayon pour modifier";
  }

  $("#ed-quitter").addEventListener("click", () => {
    try { sessionStorage.removeItem("virgule-admin-ouvert"); } catch (e) { /* rien */ }
    location.reload();
  });
})();
