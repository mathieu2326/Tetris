# Tetris (HTML, CSS, JavaScript)

Un jeu Tetris complet, jouable dans une seule page, en HTML/CSS/JavaScript vanilla avec un canvas.

## Fonctionnalités

- Pièces standards : **I, O, T, S, Z, J, L**
- Contrôles clavier :
  - **Flèche gauche / droite** : déplacer
  - **Flèche bas** : descente douce (soft drop)
  - **Flèche haut** : rotation
  - **Espace** : chute instantanée (hard drop)
- Chute automatique avec vitesse qui augmente avec le niveau
- Système de score + nettoyage des lignes
- Détection de fin de partie
- Aperçu de la prochaine pièce
- Affichage score / niveau / lignes
- Bouton de redémarrage

## Lancer le jeu

1. Clonez ou téléchargez le dépôt.
2. Ouvrez `index.html` directement dans votre navigateur.

Aucune dépendance ni build ne sont nécessaires.

## Créer une icône sur le bureau (Linux)

Depuis la racine du projet :

```bash
./scripts/create_desktop_icon.sh
```

Le script crée `~/Desktop/Tetris.desktop` (ou le dossier défini par `XDG_DESKTOP_DIR`) et configure une icône qui ouvre directement le jeu.
