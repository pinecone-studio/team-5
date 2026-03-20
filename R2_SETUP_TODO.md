# R2 Direct Upload Setup TODO

The code changes are done. The account owner of `630398f7cca5a714a459a22c46cd6b52` needs to complete these steps.

## 1. Set CORS Policy on R2 Bucket

- Go to **Cloudflare Dashboard > R2 > `contracts` bucket > Settings > CORS Policy**
- Paste the following:

```json
{
  "rules": [
    {
      "AllowedOrigins": [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://web.ebmsteam10.workers.dev"
      ],
      "AllowedMethods": ["PUT", "GET"],
      "AllowedHeaders": ["Content-Type"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

## 2. Create R2 S3 API Token

- Go to **Cloudflare Dashboard > R2 > Manage R2 API Tokens**
- Click **Create API Token**
- Permission: **Object Read & Write**
- Scope: **`contracts`** bucket only
- Save the **Access Key ID** and **Secret Access Key**

## 3. Store Secrets in Worker

Run these commands from the `service/` directory:

```sh
wrangler secret put R2_ACCESS_KEY_ID
# paste the Access Key ID when prompted

wrangler secret put R2_SECRET_ACCESS_KEY
# paste the Secret Access Key when prompted
```

## 4. For Local Development

Add to `service/.env`:

```
R2_ACCESS_KEY_ID=<your access key id>
R2_SECRET_ACCESS_KEY=<your secret access key>
```

Then run `sh scripts/ensure-dev-vars.sh` to sync to `.dev.vars`.

## 5. Deploy

```sh
cd service && npx wrangler deploy
```
