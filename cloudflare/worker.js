/* chasm. sur Cloudflare
 * - Sert le jeu (dossier public/).
 * - /api/... : classement du tournoi, gardé dans un Durable Object (une seule « salle »).
 *   GET    /api/etat                 → { tour, res }
 *   POST   /api/resultats            → ajoute un score (une équipe en fin de partie)
 *   DELETE /api/resultats/:id        → supprime un score        (code animateur)
 *   POST   /api/tour  {tour}         → change le tour en cours   (code animateur)
 *   Les scores saisis à la main (man:true) demandent aussi le code animateur.
 * Code animateur : secret ADMIN_CODE (npx wrangler secret put ADMIN_CODE). */

const TEAMS = ['peres', 'rennes', 'bonhommes', 'lutins', 'pains'];
const json = (o, status = 200) => Response.json(o, { status, headers: { 'Cache-Control': 'no-store' } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) {
      const stub = env.TOURNOI.get(env.TOURNOI.idFromName('chasm'));
      return stub.fetch(req);
    }
    return env.ASSETS.fetch(req);
  },
};

export class Tournoi {
  constructor(state, env) { this.state = state; this.env = env; }

  async load() {
    const s = (await this.state.storage.get('etat')) || { tour: 1, res: [] };
    return s;
  }
  async save(s) { await this.state.storage.put('etat', s); return s; }
  isAdmin(req) {
    const code = this.env.ADMIN_CODE;
    return !!code && req.headers.get('X-Admin') === code;
  }

  async fetch(req) {
    const url = new URL(req.url);
    const p = url.pathname.replace(/^\/api/, '');
    let s = await this.load();

    if (req.method === 'GET' && p === '/etat') return json(s);

    if (req.method === 'POST' && p === '/resultats') {
      let b; try { b = await req.json(); } catch (e) { return json({ err: 'json' }, 400); }
      const man = !!b.man;
      if (man && !this.isAdmin(req)) return json({ err: 'code' }, 401);
      const score = Math.round(Number(b.score));
      if (!TEAMS.includes(b.eq) || !(score >= 0 && score <= 50000)) return json({ err: 'données' }, 400);
      const r = {
        id: crypto.randomUUID().slice(0, 12), eq: b.eq,
        tour: Math.max(1, Math.min(99, Math.round(Number(b.tour)) || s.tour)),
        score, seg: Math.max(0, Math.min(5, Math.round(Number(b.seg)) || 0)),
        win: !!b.win, man, at: Date.now(),
      };
      s.res.push(r);
      if (s.res.length > 2000) s.res = s.res.slice(-2000);
      return json(await this.save(s));
    }

    if (req.method === 'DELETE' && p.startsWith('/resultats/')) {
      if (!this.isAdmin(req)) return json({ err: 'code' }, 401);
      const id = decodeURIComponent(p.slice('/resultats/'.length));
      s.res = s.res.filter(r => r.id !== id);
      return json(await this.save(s));
    }

    if (req.method === 'POST' && p === '/tour') {
      if (!this.isAdmin(req)) return json({ err: 'code' }, 401);
      let b; try { b = await req.json(); } catch (e) { return json({ err: 'json' }, 400); }
      s.tour = Math.max(1, Math.min(99, Math.round(Number(b.tour)) || 1));
      return json(await this.save(s));
    }

    return json({ err: 'inconnu' }, 404);
  }
}
