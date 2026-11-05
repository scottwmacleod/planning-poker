This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

```bash
npm install
npm run dev
```

This starts two servers:

- the Next.js app on [http://localhost:3000](http://localhost:3000)
- the room server (a [PartyServer](https://github.com/cloudflare/partykit/tree/main/packages/partyserver) Durable Object, run locally by `wrangler dev`) on `localhost:1999`

No Cloudflare account is needed for local development. Run them separately with `npm run dev:next` and `npm run dev:party`.

The app connects to the room server at `NEXT_PUBLIC_PARTYKIT_HOST` (default `localhost:1999`), on the path `/parties/main/<room id>`.

The room server lives in `party/server.ts` and is configured in `wrangler.jsonc`. After changing `wrangler.jsonc`, run `npm run cf-typegen` to regenerate `party/worker-configuration.d.ts`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
