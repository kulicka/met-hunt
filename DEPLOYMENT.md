# Deployment

## Option A — Fly.io (recommended, same as drawable-trouble)

The repo has a `Dockerfile` and `fly.toml` (app `met-hunt`, region `ewr`, port 8080,
HTTPS forced, machines stop when idle).

**From the Fly dashboard:** Launch an app → from GitHub → pick `kulicka/met-hunt`.
Fly reads `fly.toml` and builds the `Dockerfile`. If the name `met-hunt` is taken,
pick another and update `app =` in `fly.toml`.

**Or from a terminal with flyctl:**

```sh
git clone https://github.com/kulicka/met-hunt.git && cd met-hunt
fly launch --copy-config --no-deploy
fly secrets set ANTHROPIC_API_KEY=sk-ant-... RATE_LIMIT_SALT=any-long-random-string
fly deploy
```

Without `ANTHROPIC_API_KEY` the game still runs; photo checks fall back to the
grown-up check.

**Automatic deploys:** `.github/workflows/fly-deploy.yml` runs the tests and
deploys every push to `main` once the repo has a `FLY_API_TOKEN` secret
(`fly tokens create deploy -a met-hunt`, then GitHub → Settings → Secrets →
Actions). Until then the deploy steps are skipped.

**Closures on Fly:** the image is fixed, so update closures without a rebuild with
`fly secrets set CLOSURES_JSON="$(cat data/closures.json)"` (this restarts the
machines), or edit `data/closures.json` and redeploy.

Note: the in-memory rate limit is per machine, so with two machines the effective
limit is doubled. That is fine at this scale.

## Option B — Same VPS as drawable-trouble (pm2 + nginx)

This runs next to `drawable-trouble` on the same server: drawable-trouble keeps
port 3000, Hidden Treasures uses port 3001, and nginx routes each domain (or
subdomain) to its app.

> Use HTTPS for this app. Phones only install the offline service worker on a
> secure origin, and the game sends children's photos to the server.

### 1. Point a domain at the server

Add a DNS `A` record such as `hunt.yourdomain.com` → your server's IP.

### 2. Deploy the app

```sh
ssh root@YOUR_SERVER_IP
git clone https://github.com/kulicka/met-hunt.git
cd met-hunt
npm ci
npm run build
```

Create `ecosystem.config.cjs` (keeps the API key out of the repo; this file is gitignored):

```js
module.exports = {
  apps: [{
    name: "met-hunt",
    script: "node_modules/next/dist/bin/next",
    args: "start -p 3001",
    env: {
      NODE_ENV: "production",
      ANTHROPIC_API_KEY: "sk-ant-...",
      RATE_LIMIT_SALT: "any-long-random-string",
    },
  }],
};
```

```sh
pm2 start ecosystem.config.cjs
pm2 save
```

Without `ANTHROPIC_API_KEY` the game still runs; photo checks answer
"checker is taking a break" and fall back to the grown-up check.

### 3. Configure nginx

```sh
nano /etc/nginx/sites-available/met-hunt
```

```nginx
server {
    listen 80;
    server_name hunt.yourdomain.com;

    # Photos are resized on the phone, but leave headroom.
    client_max_body_size 5m;

    # Do not write request bodies (children's photos) to nginx logs or disk.
    location /api/verify {
        proxy_pass http://localhost:3001;
        proxy_request_buffering off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```sh
ln -s /etc/nginx/sites-available/met-hunt /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
certbot --nginx -d hunt.yourdomain.com
```

### Updating

```sh
cd ~/met-hunt
git pull
npm ci
npm run build
pm2 restart met-hunt
```

## Before a museum visit

Check The Met’s [gallery closures page](https://www.metmuseum.org/de/plan-your-visit/gallery-closures)
and update `data/closures.json` on the server. It is read on every request, so
no rebuild or restart is needed. Phones pick it up the next time they have signal.
