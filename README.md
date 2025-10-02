
# Drone Part Picker (DPP)

A full-stack website which allows you to create, build, and share FPV drone builds
We have advanced calculations to give real-time estimates of the drone's performance,and real price data from our Web Scrapers.

## Features

- Real-Time Estimate: While building your drone you can see real time estimates of things like top speed of your drone, while these calculations are every changeing i find them personally close to my FPV drone build, but these calculations will always be updating and improving

- Custom Parts: I've already added 1k+ parts into our database, but in case that doesn't have what you need, you can always add more.There are also plans for you to be able to share custom parts and later add 3d models torender your drone.

### 3D Build Visualization

- The 3D viewer supports GLB/GLTF/OBJ/STL models via three.js (OrbitControls + GLTF/OBJ/STL loaders).
- You can see the viewer on a build details page at `/builds/[id]` under the “3D Visualization” section.
- Each component renders a placeholder shape by default; you can import a direct model URL per component from the component panel.
- Import Modal behavior:
  - Paste a page URL to scrape for `.glb/.gltf/.obj/.stl` links.
  - If you paste a direct model URL, it will be offered immediately even if the page has no other links.
  - If scraping returns no links but your input looks like a direct model URL, a “Use typed URL” action is shown.

API: `/api/models/scrape` uses axios + cheerio with a light robots.txt check to find model links on a page.

- Public Builds, and user profiles: Share your builds, Look and like other peoples builds.

- Personal Profiles

## Tech Stack

**Client:** NextJs, TailwindCSS

**Server:** NextAuth, Prisma

## Run Locally

Clone the project

set up the env.

```bash
  git clone https://link-to-project
```

Go to the project directory

```bash
  cd my-project
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run dev
```
goto localhost:3000

