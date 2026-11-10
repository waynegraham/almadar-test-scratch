This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

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

Use the Environment selector at the top of any page and click **Switch** to
choose staging or production. The choice is remembered in this browser for a
year and applies to CMS requests, IIIF thumbnails, and the image viewer across
pages. The current CMS URL is shown beside the selector.

New browser sessions start on **Staging**. **Local / configured URLs** explicitly
uses the existing environment variables (`NEXT_PUBLIC_STRAPI_URL`,
`STRAPI_URL`, or `STRAPI_HOST`/`STRAPI_PORT`, and `IIIF_SERVER`). Staging uses
`https://cms-staging-almadar.biennale.org.sa` and
`https://iiif-staging-almadar.biennale.org.sa`; production uses
`https://cms-almadar.biennale.org.sa` and `https://iiif-almadar.biennale.org.sa`.
Existing server-side API token and Cloudflare bypass settings continue to apply.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
