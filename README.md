# E33.EXE

Clair Obscur: Expedition 33 — personal weapon, Picto, skill and loadout tracker.

## GitHub Pages deployment

1. Create a **public** repository on GitHub named `e33-exe`.
2. Upload `index.html` to the root of the repository on the `main` branch.
3. Open repository **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**, choose `main` and `/(root)`, then save.
5. GitHub will display the published site URL once deployed, typically `https://YOUR-USERNAME.github.io/e33-exe/`.

## Updating

Replace `index.html` in the same repository (same path) and commit the changes. Keep the same Pages URL so browser localStorage remains available on that browser/profile.

## Progress storage

Your game tracking state is stored locally in the browser via `localStorage`, not in GitHub. Hosting does **not** sync data across devices; private windows, clearing browser storage, or changing browsers can lose progress. Plan for Export/Import Progress support as a future safeguard.

## Notes

This app is self-contained: styles, scripts and data are embedded in `index.html`. The source repository must be public to use GitHub Pages under GitHub Free for this project.
