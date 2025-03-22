This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn
# or
pnpm
# or
bun
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Here, we use `app` router for building the tool, while `pages` router for building the documentation. So, ensure that conflicting routes are not present in both the routers.

> [!NOTE] Pages router do not work with turbopack, so you need to use the `dev` command to run the project if wish to see the documentation, else you can use `dev:turbo` command for developing just the tool.

## Disclaimer

While building this project in Dockerized form or publishing the website in production, I encourage you to upload videos (as maintaining it in `git lfs` is going to cost it), please keep all the related videos in [this folder](/public/video/). All the videos are currently uploaded in this [gdrive folder](https://drive.google.com/drive/folders/1LvPTY8Z559shYoWTaSOHFuWOFKGG8QHv), you can download them from there and upload them in the above-mentioned folder.

## Learn More

- To learn more about Next.js, take a look at the following resources:

  - [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
  - [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

- For graphql queries, you can check out the apollo client documentation [here](https://www.apollographql.com/docs/react/).

- For styling, you can check out the tailwindcss documentation [here](https://tailwindcss.com/docs).

- We use shadcn component library for building the components. You can check out the documentation [here](https://ui.shadcn.com/docs).

- For state management, take a look at the zustand documentation [here](https://zustand.docs.pmnd.rs/getting-started/introduction).

- For graph visualization, we use sigma.js hence, react-sigma. Documentation of both the libraries are useful to understand the working of the graph.

  - [Sigma.js](https://sigmajs.org/docs/). Also, this library uses graphology library for its backend implementation, so you can check out the documentation of graphology [here](https://graphology.github.io/).
  - [React-Sigma](https://sim51.github.io/react-sigma/docs/start-setup/)
