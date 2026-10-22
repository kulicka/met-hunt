# Deployment Guide — same VPS as drawable-trouble

This runs next to `drawable-trouble` on the same server: drawable-trouble keeps
port 3000, Hidden Treasures uses port 3001, and nginx routes each domain (or
subdomain) to its app.

> Use HTTPS for this app. Phones only install the offline service worker on a
> secure origin, and the game sends children's photos to the server.

## 1. Point a domain at the server

Add a DNS `A` record such as `hunt.yourdomain.com` → your server's IP.

## 2. Deploy the app

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

## 3. Configure nginx

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

## Updating

```sh
cd ~/met-hunt
git pull
npm ci
npm run build
pm2 restart met-hunt
```

## Before a museum visit

Check The Met's [gallery closures page](https://www.metmuseum.org/visit/gallery-closures)
and update `src/data/gallery-status.ts`, then redeploy.
