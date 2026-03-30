# Host Nginx (production proxy)

Use `your-domain.com` in this folder on the host that serves **https://your-domain.com** (replace `your-domain.com` with your real hostname everywhere, including TLS paths and `server_name`).

## Deployment

1. Copy the server block(s) into your main nginx config, or symlink:
   ```bash
   sudo ln -s /path/to/raad-lms-frontend/nginx/your-domain.com /etc/nginx/conf.d/your-domain.com.conf
   ```
2. Ensure backend is listening on `127.0.0.1:8000` (e.g. Docker port `8000:80`).
3. Reload nginx: `sudo nginx -t && sudo systemctl reload nginx`.

## If `/api/v1/auth/csrf-cookie` returns 404

- **Cause:** Nginx must forward the **full path** to the backend. If `proxy_pass` uses a trailing slash (e.g. `http://raad_lms_backend/`), the `/api` prefix is stripped and the backend gets `/v1/auth/csrf-cookie` → 404.
- **Fix:** Use `proxy_pass http://raad_lms_backend$request_uri;` (or `proxy_pass http://raad_lms_backend;` with **no** trailing slash) so the backend receives `/api/v1/auth/csrf-cookie`.
- **Check:** `curl -I https://your-domain.com/api/v1/auth/csrf-cookie` should return `200`, and login at https://your-domain.com/login should work (e.g. admin@your-domain.com / password).
