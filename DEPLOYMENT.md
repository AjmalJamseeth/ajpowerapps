# Deploying AJapps — Go-Live Guide

## The short version

AJapps is a **100% static site** — no database, no API routes, no server-side
rendering, no environment variables. Every one of its ~130 pages (58
calculators, 59 worked examples, 10 guides, home, resources) is pre-built
into plain HTML/CSS/JS at build time. That's confirmed by:

- No `route.ts` API routes anywhere in `src/app`
- No `"use server"` server actions
- No middleware
- No use of `cookies()`, `headers()`, or `useSearchParams()` that would force
  dynamic rendering
- No `next/image` (which would need an image-optimization server)
- Both dynamic-looking routes (`/examples/[slug]`, `/guides/[slug]`) use
  `generateStaticParams()`, so they're pre-rendered at build time too

This is the cheapest possible category of site to host — there's no compute
to pay for, ever, at any realistic traffic level for this project. The
feedback form works via `mailto:` / copy / download, so it needs no backend
either.

**The git repo is already set up.** I ran `git init`, confirmed the existing
`.gitignore` correctly excludes `node_modules`/`.next`/build artifacts, and
committed all 189 source files on the `main` branch. It's ready to push.

## Step-by-step: fastest path to live (Vercel, free)

Vercel is built by the Next.js team, detects this project automatically with
zero configuration, and is the fastest route to a live URL tonight.

1. **Create a GitHub repo** (github.com → New repository → e.g. `ajapps`,
   private or public, don't initialize with a README since this repo
   already has one).
2. **Push the code** — from the `ajapps` folder:
   ```
   git remote add origin https://github.com/<your-username>/ajapps.git
   git push -u origin main
   ```
3. **Sign up / log in at vercel.com** (free, use the GitHub login for the
   smoothest flow).
4. **"Add New… → Project"** → select the `ajapps` repo → Vercel
   auto-detects "Next.js" as the framework → click **Deploy**.
5. Wait ~1-2 minutes for the build. You'll get a live URL immediately:
   `ajapps-<something>.vercel.app` (or a cleaner `ajapps.vercel.app` if that
   subdomain is free).
6. **(Optional) Custom domain** — buy a domain (Namecheap, Google Domains/
   Squarespace, Cloudflare Registrar are all reasonable, ~$10-15/year for a
   `.com`), then in Vercel: Project → Settings → Domains → add it. Vercel
   gives you the DNS records to add at your registrar, and issues a free
   SSL certificate automatically within minutes of the DNS propagating.

That's it — no server to manage, no scaling to think about, SSL/HTTPS
included automatically, and every future `git push` to `main` auto-deploys.

## Cost breakdown

| Item | Cost |
|---|---|
| Hosting (Vercel Hobby tier) | **$0/month** — plenty for this site's traffic |
| SSL certificate | **$0** — automatic, included |
| Subdomain (`ajapps.vercel.app`) | **$0** |
| Custom domain (optional, e.g. `ajapps.com`) | **~$10-15/year** (registrar fee, not Vercel) |
| **Total to go live tomorrow** | **$0** (or ~$1/month amortized if you add a custom domain) |

Vercel's free Hobby tier includes 100GB of bandwidth/month and unlimited
static requests — for a calculator reference site, that's very unlikely to
be exceeded even with a meaningful amount of traffic. If it ever were, the
next tier up (Pro) is $20/month, but that's a "you'll know it's time"
problem, not a launch-day concern.

## Cost-effective alternatives (in case you want to compare)

All of these can host this exact project for **$0/month** since it's fully
static — the differences are mainly in workflow and limits, not price.

| Platform | Free tier | Notes |
|---|---|---|
| **Vercel** (recommended) | 100GB bandwidth/mo | Built by the Next.js team, zero-config, fastest setup |
| **Cloudflare Pages** | Unlimited bandwidth | Most generous free tier if traffic ever gets large; slightly more setup for Next.js specifics |
| **Netlify** | 100GB bandwidth/mo | Very similar to Vercel, equally easy for a Next.js static site |
| **GitHub Pages** | Unlimited (static only) | Requires adding `output: "export"` to `next.config.ts` and a bit more manual setup; no built-in preview deployments |

**Recommendation: start on Vercel.** If this ever needs a paid tier down the
line (very unlikely for a reference/calculator site), migrating between any
of these is a low-effort, low-risk move since the whole thing is static
files — there's no database or server state to migrate.

## Staying cost-effective long-term

- Don't add `next/image` optimization, server-side database calls, or API
  routes unless a future feature genuinely needs them — each of those moves
  the site from "free forever" territory into "pay for compute" territory.
- If a future feature (real user accounts, payments, a live database) does
  get added, that's the point to revisit hosting — a static-first site with
  a few serverless functions bolted on is still usually cheap, just not
  literally free.
- Keep the free Hobby/free-tier plan until there's an actual reason
  (commercial use restrictions, real traffic near a limit, need for a team
  seat) to upgrade — there's no benefit to paying earlier "just in case."

## What I can't do for you

Creating the GitHub account/repo, signing up for Vercel, and buying a domain
all require your own credentials and (for the domain) a payment method — I
can't do those steps for you. Everything else — the repo being ready, the
build being verified clean, this guide — is done. If you hit any snag during
the GitHub push or Vercel import, paste the error here and I'll help sort it
out.
