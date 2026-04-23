import http from 'node:http';

/**
 * Minimal Convex HTTP client — calls the local Convex dev server directly.
 * Avoids importing the full Convex browser SDK (which needs Vite/React globals).
 */
export class ConvexClient {
  constructor(url, adminSecret) {
    const u = new URL(url);
    this.host = u.hostname;
    this.port = parseInt(u.port) || 3210;
    this.adminSecret = adminSecret;
  }

  /** Call a Convex query function */
  async query(path, args) {
    return this._request('GET', path, args);
  }

  /** Call a Convex mutation function */
  async mutation(path, args) {
    return this._request('POST', path, args);
  }

  async _request(method, path, args, retries = 3) {
    const body = JSON.stringify({ path, args, format: 'json' });
    const base = method === 'GET' ? '/api/query' : '/api/mutation';

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await new Promise((resolve, reject) => {
          const req = http.request(
            {
              hostname: this.host,
              port: this.port,
              path: base,
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
            },
            (res) => {
              let data = '';
              res.on('data', (c) => (data += c));
              res.on('end', () => {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.status === 'error') {
                    reject(new Error(parsed.errorMessage || 'Convex error'));
                  } else {
                    resolve(parsed.value);
                  }
                } catch {
                  reject(new Error(`Non-JSON response: ${data.slice(0, 200)}`));
                }
              });
            },
          );
          req.on('error', reject);
          req.write(body);
          req.end();
        });
      } catch (err) {
        const isConnectionError = err.message?.includes('ECONNREFUSED') || err.message?.includes('ECONNRESET');
        if (isConnectionError && attempt < retries) {
          // Wait before retrying: 2s, 4s, 8s
          const delay = 2000 * Math.pow(2, attempt - 1);
          console.warn(`  Convex connection error, retrying in ${delay}ms (attempt ${attempt}/${retries})...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
  }

  /** Check if a recipe already exists by source_url + title */
  async checkDuplicate(sourceUrl, recipeTitle) {
    return this.query('functions/recipes:checkDuplicate', {
      sourceUrl,
      recipeTitle,
      adminSecret: this.adminSecret,
    });
  }

  /** Insert a recipe document */
  async createRecipe(recipe) {
    return this.mutation('functions/recipes:create', {
      recipe,
      adminSecret: this.adminSecret,
    });
  }
}
