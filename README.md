# הבית של שרית ויונה · 3D

An interactive 3D model of a two-storey house, built with [three.js](https://threejs.org) from the
architect's 1:50 plans. Walls, openings, stairs and roofs come from the vector drawings; the furniture
follows the layouts sketched on the plans.

- **Exterior view:** orbit around the house and garden, and switch floors to see each storey from above.
- **Walk-through:** first-person tour with collisions and stairs (keyboard and mouse, or touch joysticks).
- **Time of day:** real sun position over the Jerusalem hills; the lights come on after sunset.

## Develop

```bash
npm install
npm run dev
```

`npm run build` writes the static site to `dist/`. Pushing to `main` deploys it to GitHub Pages.

Textures: CC0 from [Poly Haven](https://polyhaven.com); Jerusalem stone, tiles and rugs are generated in the browser.
