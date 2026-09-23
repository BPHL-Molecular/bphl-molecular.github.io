# BPHL Bioinformatics

Florida Department of Health bioinformatics website. Built with React, Vite, Three.js, and GSAP.

## Development

Use Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

React and React DOM are pinned to the version supported by React Three Fiber. Keep `package-lock.json` in version control.

## Project structure

| Location                   | Contents                                                    |
| -------------------------- | ----------------------------------------------------------- |
| `src/pages/`               | Home, team, training, pipelines, and not-found pages        |
| `src/components/sections/` | Homepage copy, research areas, and pipeline links           |
| `src/components/layout/`   | Header, footer, route navigation, and story progress        |
| `src/components/three/`    | Persistent particle scene, shaders, and sequence labels     |
| `src/data/team.js`         | Shared team profiles                                        |
| `src/config/assets.js`     | Model, map, and portrait references                         |
| `src/config/visual.js`     | Particle counts, scroll timing, and rotation limits         |
| `src/lib/`                 | Point-cloud generators, surface sampling, and training data |
| `src/styles/globals.css`   | Imports shared, section, and responsive styles              |

The homepage scrolls through a sphere, DNA, a pathogen, aligned reads, a network, and Florida. Each shape uses the same number of points. The shader interpolates their positions in one Canvas. Sequencing data is illustrative.

## Assets

The pathogen stage loads precomputed coordinates from `src/assets/points/`: 38,000 desktop points (456 KB) or 14,000 mobile/reduced-motion points (168 KB). The browser does not download or parse a GLB. Coordinates preserve the original model's deterministic sampling, normalization, and ordering.

To regenerate them, temporarily restore `src/assets/3D/corona_virus.glb`, start `npm run dev`, and run `node scripts/export-pathogen.mjs` in another terminal. The export checks every saved coordinate against the sampled value. Re-export when changing particle counts in `src/config/visual.js`; the unit tests check that assets exist for both counts. The original model is kept locally in ignored `artifacts/source-models/`.

The Florida point cloud uses `src/assets/SVG/florida.svg`. Use filled SVG paths.

Team photos belong in `src/assets/Team/`, named `team-placeholder-01.jpg` through `team-placeholder-10.jpg`. Filenames and directory case matter on Linux. Missing portraits use CSS silhouettes. Edit profiles in `src/data/team.js`.

Only referenced assets are included in the build. Missing or invalid visual assets retain procedural fallbacks.

## Motion

`src/config/visual.js` controls:

- `particleCount` and `reducedParticleCount`: desktop and mobile/reduced-motion density.
- `pointSize` and `maxPixelRatio`: particle size and rendering resolution.
- `heroScroll` and `heroMorphFraction`: hero pin duration and the portion used for its morph.
- `chapterScroll` and `chapterMorphScroll`: later pin durations and transition lengths.
- `autoRotateSpeed` and `maxReadableDragDeg`: rotation and drag limits.

Scroll distances are measured in viewport heights. Scrolling uses native browser behavior. Reduced motion disables pinning and continuous rotation. The scene pauses off-screen; unsupported WebGL falls back to a static image. Sampled point clouds are cached across viewport changes.

## Training materials

The training page reads public documents from the StaPH-B southeast-region repository. It filters by filename, supports search, and caches validated results in session storage for 30 minutes. Failed requests show a retry button and a direct repository link. Storage errors do not block fetched results. No GitHub token is needed.

## Checks

```sh
npm run lint
npm run test:unit
npm run build
npm run format:check
# Start npm run dev in another terminal first:
npm run test:browser
npm run test:pages
```

Browser checks use installed Google Chrome by default. Set `BROWSER_CHANNEL` to `msedge` for Edge, or `chromium` for Playwright's bundled browser. Set `BASE_URL` to test another local server. Reports and screenshots go to ignored `artifacts/`.

The checks cover particle generation, training parsing/cache failures, navigation, scroll morphs, drag behavior, responsive layouts, reduced motion, and automated accessibility rules. Headless WebGL checks do not replace testing on physical mobile devices.

## GitHub Pages

Use the contents of this `bphl-bioinformatics` folder as the repository root: `package.json`, `src`, and `.github` must sit at the top level.

1. Create a repository under BPHL-Molecular and push the project to its `main` branch.
2. In the repository's **Settings → Pages**, choose **GitHub Actions** as the source.
3. Run **Deploy website** in the Actions tab, or push another commit to `main`.

The workflow installs the locked dependencies, checks the source, builds the site, and deploys only `dist/`. It reads the Pages base path automatically; no repository name or access token belongs in the source.

- A repository named `BPHL-Molecular.github.io` serves `https://bphl-molecular.github.io/`.
- A repository named `bphl-bioinformatics` serves `https://bphl-molecular.github.io/bphl-bioinformatics/`.

The build creates directory entry points for `/team/`, `/training/`, and `/pipelines/`, plus `404.html`. Direct visits and refreshes work on static hosting without a server rewrite. Add any future public routes to `scripts/prepare-pages.mjs`.

Local production preview:

```sh
npm run build
npm run preview
```

To test a repository subpath locally in PowerShell:

```powershell
$env:PAGES_BASE_PATH = '/bphl-bioinformatics/'
npm run build
npm run test:deployment
Remove-Item Env:PAGES_BASE_PATH
```

`npm run test:deployment` checks the compiled site with a static file server that has no SPA fallback, including nested routes, assets, and the return-to-home link. It uses installed Chrome by default, like the other browser checks.

Replace placeholder team profiles, contact details, and draft notices before publishing. Training requests contact GitHub; all fonts and visual assets are local. The site has no forms or analytics.

The Three.js chunk is lazy-loaded and may trigger Vite's size advisory. React Three Fiber currently produces a Three.Clock deprecation notice with the pinned Three.js version; it does not affect rendering.

## Version control

The workspace and project `.gitignore` files exclude dependencies, builds, browser artifacts, local settings, assistant folders, environment files, and common credential files. They keep source, required assets, the lockfile, and example environment files.

Ignore rules apply to untracked files. Inspect `git status` and the staged diff before pushing; Git cannot use ignore rules to remove files that were already committed.
