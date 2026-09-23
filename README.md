# BPHL Molecular Bioinformatics

This is the website for the Florida Department of Health's molecular bioinformatics team. It covers our work, pipelines, training, and team.

## Run it locally

Use Node.js 22.12 or newer, then run:

```sh
npm ci
npm run dev
```

Open the address shown in the terminal.

## Make changes

- Homepage content is in `src/components/sections/`.
- Team names, roles, and descriptions are in `src/data/team.js`.
- Styles are in `src/styles/`.
- The navigation and footer are in `src/components/layout/`.

The ten team profiles are placeholders for now. The training and pipelines pages pull their listings from public GitHub repositories.

Before pushing, check the site with `npm run lint`, `npm run test:unit`, and `npm run build`.

## Publish

The GitHub repository should be named `bphl-molecular.github.io`. In **Settings → Pages**, choose **GitHub Actions** as the source. Pushing to `main` runs the deployment workflow.

The published site will be at [bphl-molecular.github.io](https://bphl-molecular.github.io/). Replace the team placeholders and check the contact details before sharing it.
