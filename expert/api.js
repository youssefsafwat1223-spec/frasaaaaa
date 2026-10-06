import { config } from './config.js';
const KEY = 'frasa.auth.session';
export class Api {
  constructor(cfg = config) { this.cfg = cfg; this.session = JSON.parse(sessionStorage.getItem(KEY) || 'null'); this.refreshing = null; }
  remember(session) { this.session = session; sessionStorage.setItem(KEY, JSON.stringify(session)); }
  clear() { this.session = null; sessionStorage.removeItem(KEY); }
  async request(path, { method = 'GET', body, headers = {}, anonymous = false } = {}) {
    if (!anonymous && this.session && this.session.expires_at * 1000 < Date.now() + 30000) await this.refresh();
    const res = await fetch(this.cfg.url + path, { method, headers: { apikey: this.cfg.publicKey, 'Content-Type': 'application/json', ...(!anonymous && this.session ? { Authorization: 'Bearer ' + this.session.access_token } : {}), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = await res.json().catch(() => null);
    if (!res.ok) { const e = new Error(data?.error_description || data?.message || data?.error || 'تعذر الاتصال بالخادم'); e.status = res.status; e.code = data?.code; throw e; }
    return data;
  }
  async login(email, password) { const data = await this.request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password }, anonymous: true }); this.remember({ ...data, expires_at: data.expires_at || Math.floor(Date.now()/1000) + data.expires_in }); return data.user; }
  async refresh() {
    if (!this.refreshing) this.refreshing = (async () => {
      try { const data = await this.request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: this.session.refresh_token }, anonymous: true }); this.remember({ ...data, expires_at: data.expires_at || Math.floor(Date.now()/1000)+data.expires_in }); }
      catch(e) { if (e.status === 400 || e.status === 401) this.clear(); throw e; }
      finally { this.refreshing = null; }
    })();
    return this.refreshing;
  }
  async logout() { try { if (this.session) await this.request('/auth/v1/logout', { method:'POST' }); } finally { this.clear(); } }
  async user() { if (!this.session) return null; return this.request('/auth/v1/user'); }
  async rows(table, query) { return this.request(`/rest/v1/${table}?${query}`); }
  async bootstrap() {
    const user = await this.user(); if (!user) return null;
    const profile = (await this.rows('annotators', `select=user_id,display_name,role,active&user_id=eq.${user.id}`))[0];
    if (!profile?.active) return { user, profile, inactive:true };
    const [types, schemas, tags] = await Promise.all([
      this.rows('face_types','select=code,name_ar,sort_order&order=sort_order.asc'),
      this.rows('annotation_schemas','select=version,form&order=version.asc'),
      this.rows('reasoning_tags','select=code,label_ar&active=eq.true&order=label_ar.asc')
    ]);
    // Read active version separately. Historical versions are used for edits.
    const active = await this.rows('annotation_schemas','select=version&active=eq.true');
    const queue = [];
    for (let start=0;;start+=500) {
      const page = await this.rows('my_queue',`select=queue_item_id,position,batch_no&order=position.asc&offset=${start}&limit=500`);
      queue.push(...page); if(page.length<500) break;
    }
    const submitted = new Set();
    for (let start=0;;start+=500) {
      const page = await this.rows('annotations',`select=queue_item_id&annotator_id=eq.${user.id}&status=eq.submitted&offset=${start}&limit=500&order=queue_item_id.asc`);
      page.forEach(a=>submitted.add(a.queue_item_id)); if(page.length<500) break;
    }
    return { user, profile, types, schemas, tags, activeVersion:active[0]?.version, queue, submitted };
  }
  async load(id) {
    const rows = await this.rows('annotations',`select=id,queue_item_id,schema_version,image_usable,unusable_reason,features,primary_type,secondary_type,confidence,unsure,notes,duration_ms,started_at,status,revision&queue_item_id=eq.${id}`);
    const a=rows[0] || null;
    if (a) a.tags = (await this.rows('annotation_reasoning_tags',`select=tag_code&annotation_id=eq.${a.id}`)).map(t=>t.tag_code);
    return a;
  }
  async image(id) { return this.request('/functions/v1/signed-face-url',{ method:'POST',body:{queue_item_id:id} }); }
  async save(id,payload,submit) { return this.request('/rest/v1/rpc/save_annotation',{ method:'POST',body:{p_queue_item_id:id,p_payload:payload,p_submit:submit} }); }
}
