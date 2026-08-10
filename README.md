# virgule. — portfolio

Le portfolio de Virgile, photographe. Sérieux sur les photos, beaucoup moins sur l'identité visuelle.

## Ouvrir le site

Aucune installation, aucun build : ouvre simplement `index.html` dans un navigateur.
(Les polices et les images de démonstration ont besoin d'une connexion internet.)

Pour un petit serveur local :

```bash
npx http-server -p 4173 .
```

puis ouvre <http://localhost:4173>.

## Ajouter / remplacer des photos

Tout se passe dans **`js/photos-data.js`**. Chaque photo est un objet :

```js
{
  image: "photos/ma-photo.jpg",   // chemin vers ton fichier (ou une URL)
  alt: "description pour les lecteurs d'écran",
  titre: "le titre de la photo",
  categorie: "paysages",          // paysages | macro | animaux | portraits
                                  // architecture | détails | lumière
  date: "mai 2025",
  lieu: "Vercors",
  description: "petit texte affiché dans la vue en grand.",
  phrase: "la petite phrase absurde qui apparaît au survol.",
  taille: "grande",               // grande | panorama | haute | moyenne | petite
}
```

- **`taille`** contrôle la place de la photo dans la grille éditoriale :
  `grande` (4:3, large), `panorama` (16:10, très large), `haute` (3:4, verticale),
  `moyenne` (4:3), `petite` (1:1). Respecte à peu près ces proportions.
- Mets tes fichiers dans un dossier `photos/` à la racine, et utilise `image:`.
- Les entrées actuelles utilisent `picsum:` (images de démonstration à remplacer).
- L'ordre du tableau = l'ordre d'affichage. Alterne les tailles pour garder
  une composition vivante.

## Personnaliser

- **Email / Instagram** : dans `index.html`, section `#contact`
  (`bonjour@virgule-photo.fr` et `@virgule.photo` sont des exemples à remplacer).
- **Couleurs** : variables CSS en haut de `css/styles.css` (`--creme`, `--rouille`, …).
- **Le personnage** : dessiné en SVG dans `js/main.js` (`personnageSVG`).
- **Textes** : tout est dans `index.html`, en clair.

## Petits secrets

- Les yeux du personnage suivent le curseur.
- Cliquer sur une photo déclenche un flash d'appareil avant de l'ouvrir en grand.
- Navigation clavier : `Échap` ferme la vue en grand, `←` / `→` naviguent.
- Il existe un easter egg. Indice : le logo, sept fois.

## Structure

```
index.html          — la page (hero, galerie, à propos, contact)
css/styles.css      — toute la direction artistique
js/photos-data.js   — TES photos (le seul fichier à toucher au quotidien)
js/main.js          — personnage SVG, galerie, lightbox, micro-interactions
```
