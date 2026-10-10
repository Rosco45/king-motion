# 👑 KING - Expérience Royale & Motion Design Liquide

Site web d'une seule page ultra-moderne conçu avec un rendu motion design d'or liquide et une ambiance bleu nuit royal / `#09090e`.

---

## ✨ Caractéristiques & Effets Visuels

1. **Logo Couronne Royale Vectorielle (SVG 4K)** :
   - Design majestueux à 5 pointes orné de cabochons et joyaux.
   - Tracé animé dynamique par contour doré (`stroke-dashoffset`).
   - Remplissage progressif simulant une montée d'or fondu avec équation de vagues liquides physiques.

2. **Typographie "KING" en Motion Design Liquide** :
   - Typographie sérif de haute joaillerie (`Cinzel Decorative` / `Cinzel`).
   - Vagues sinusoïdales montantes simulant un remplissage fluide et visqueux.
   - Reflets métalliques spéculaires animés balayant la surface dorée.
   - Gouttes d'or liquide suspendues qui s'étirent et tombent au bas des lettres avec effet de gravité et de tension de surface.

3. **Filtre de Fluide Organique (SVG Turbulence & Displacement)** :
   - Effet d'ondulation perpétuelle grâce à `feTurbulence` et `feDisplacementMap`.
   - Onde de choc liquide instantanée lors des clics ou via le bouton **"Vague d'Or"**.

4. **Palette Royale & Atmosphère Visuelle** :
   - **Fond** : Dégradé radial bleu roi profond (`#0f1d46`), bleu nuit (`#080e24`) et noir apparent (`#09090e`).
   - **Lumière** : Halo royal atmosphérique et lueurs dorées en arrière-plan.
   - **Texte & Couronne** : Dégradé multi-niveaux d'or 24 carats (`#FFF8D6` à `#78350F`) et rehauts scintillants.

5. **Interactions & Contrôles** :
   - **Mouvement fluide de la souris / tactile** : Génère un sillage de particules dorées et incline le logo en perspective 3D.
   - **Clic interactif** : Déclenche un éclat liquide doré avec micro-gouttelettes.
   - **Bouton Rejouer** : Relance toute la séquence cinématique de la goutte et du déversement d'or.
   - **Sélecteur de styles** : *Or Fondu 24K*, *Mercure Doré*, *Bleu Impérial*.
   - **Ambiance Sonore Web Audio API** : Synthèse procédurale d'un son de goutte d'eau (« plop ») et d'un accord harmonique royal chaleureux (100% autonome, sans fichier audio externe).

---

## 🚀 Comment Lancer et Prévisualiser

### Option 1 : Ouvrir directement dans votre navigateur
Double-cliquez simplement sur `index.html` ou ouvrez l'URL suivante dans votre navigateur :
```bash
file:///home/roserick/king-motion/index.html
```

### Option 2 : Serveur local rapide (Python ou Node)
Dans le dossier `/home/roserick/king-motion` :
```bash
python3 -m http.server 3000
```
Puis ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 📁 Structure des Fichiers

- [`index.html`](file:///home/roserick/king-motion/index.html) : Structure HTML5, vecteur SVG de la couronne royale, typographie KING et masques de clipping de fluide.
- [`style.css`](file:///home/roserick/king-motion/style.css) : Styles CSS3, dégradés d'or liquide, fonds bleu roi, animations clés et barre de contrôle vitrée (glassmorphism).
- [`script.js`](file:///home/roserick/king-motion/script.js) : Moteur de vagues liquides, particules sur canvas, synthèse sonore Web Audio et gestion des interactions.
