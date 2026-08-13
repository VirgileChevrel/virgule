/* ==========================================================================
   virgule. — le palmarès
   --------------------------------------------------------------------------
   Les prestations que tu as couvertes, la plus récente en premier.

   {
     date: "2026-06",              // AAAA-MM — le mois s'écrit tout seul
     genre: "mariage",             // mariage | gaming | concert… ce que tu veux
     quoi: "Camille & Jonas",      // le nom de l'événement, ou celui des mariés
     ou: "Vercors",                // la ville ou la région
   }

   `quoi` sert aussi de lien : chaque billet renvoie vers la galerie déjà
   filtrée sur l'événement. Le site en fabrique l'adresse tout seul —
   « Camille & Jonas » devient photos.html?evenement=camille-jonas. Pour que le
   lien tombe sur des photos, écris EXACTEMENT la même chose dans le champ
   `evenement` des photos concernées, dans js/photos-data.js. Si rien ne
   correspond, la galerie le dit au lieu d'afficher une page vide.

   Tu peux aussi modifier tout ça sans ouvrir ce fichier : connecte-toi à
   /admin, le site passe en mode édition et un crayon apparaît sur chaque
   billet. N'oublie pas de retélécharger js/site-config.js pour publier.
   ========================================================================== */

const PALMARES = [
  { date: "2026-06", genre: "mariage", quoi: "Camille & Jonas", ou: "Vercors" },
  { date: "2026-04", genre: "gaming", quoi: "finale régionale eSport", ou: "Lyon" },
  { date: "2025-09", genre: "mariage", quoi: "Léa & Sam", ou: "Bretagne" },
  { date: "2025-03", genre: "gaming", quoi: "LAN Trophy #12", ou: "Grenoble" },
];
