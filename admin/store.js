/* Service Mode: the working copy of content/*.json.
   Holds the files as the server sent them (parsed, notes and all), tracks which
   are dirty, validates through the same validator the build uses, applies a
   valid result to the running game, and saves. The relative import resolves to
   /tools/content/validate.mjs in the browser. */
import { validateContent, memSource, ContentError } from '../tools/content/validate.mjs';

const Admin = (globalThis.Admin = globalThis.Admin || {});

const split = (p) => (Array.isArray(p) ? p.map(String) : String(p).split('.').filter((s) => s !== ''));

export const store = {
  base: '',                 // '' in the browser; tests point it at a server
  headers: {},              // extra request headers (a browser adds Origin itself; node does not)
  files: {},                // rel -> parsed JSON (the working copy)
  stamp: {},                // rel -> mtimeMs at the last load / save
  dirty: new Set(),         // rel of files edited since
  error: null,              // the ContentError from the last validate, or null
  applyError: null,         // an exception thrown while pushing into the game
  listeners: new Set(),

  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  emit() { for (const fn of this.listeners) fn(this); },

  async load() {
    const r = await fetch(this.base + '/admin/api/content');
    if (!r.ok) throw new Error('could not load content: HTTP ' + r.status);
    const body = await r.json();
    this.files = {};
    for (const [rel, raw] of Object.entries(body.files)) this.files[rel] = JSON.parse(raw);
    this.stamp = body.stamp;
    this.dirty.clear();
    this.error = null;
    this.emit();
  },

  get(rel, path) {
    let v = this.files[rel];
    for (const k of split(path)) { if (v == null) return undefined; v = v[k]; }
    return v;
  },

  /* Edit, then validate; a valid result is applied to the game. Returns the
     validate() result. An invalid edit stays in the working copy, so the field
     shows what was typed beside the reason it was refused, and the game keeps
     the last valid content. */
  set(rel, path, value) {
    const keys = split(path);
    if (!keys.length || !(rel in this.files)) throw new Error('no such field: ' + rel + ' ' + keys.join('.'));
    let o = this.files[rel];
    for (const k of keys.slice(0, -1)) {
      if (o[k] == null) throw new Error('no such field: ' + rel + ' ' + keys.join('.'));
      o = o[k];
    }
    o[keys[keys.length - 1]] = value;
    this.dirty.add(rel);
    const res = this.validate();
    if (res.built) {
      this.applyError = null;
      try { Admin.applyBuilt(res.built, globalThis.G); } catch (e) { this.applyError = e; console.error(e); }
    }
    this.emit();
    return res;
  },

  /* { built } or { error }. Anything that is not a ContentError is a bug, not
     a verdict on the content, so it is rethrown. */
  validate() {
    try {
      const built = validateContent(memSource(this.files));
      this.error = null;
      return { built };
    } catch (e) {
      if (!(e instanceof ContentError)) throw e;
      this.error = e;
      return { error: e };
    }
  },

  /* POST only the dirty files. Resolves to { ok:true } or { ok:false, reason,
     ... } where reason is 'invalid' | 'changed' | 'busy' | 'build' | 'server' | 'network'. */
  async save() {
    if (!this.dirty.size) return { ok: true, nothing: true };
    const v = this.validate();
    if (v.error) { this.emit(); return { ok: false, reason: 'invalid', error: v.error }; }
    const rels = [...this.dirty];
    const files = {}, stamp = {};
    for (const rel of rels) { files[rel] = JSON.stringify(this.files[rel]); if (rel in this.stamp) stamp[rel] = this.stamp[rel]; }
    let r, j;
    try {
      r = await fetch(this.base + '/admin/api/save', {
        method: 'POST', headers: { 'content-type': 'application/json', ...this.headers }, body: JSON.stringify({ files, stamp }),
      });
      j = await r.json();
    } catch (e) { return { ok: false, reason: 'network', message: String(e && e.message || e) }; }
    if (r.status === 200) {
      Object.assign(this.stamp, j.stamp);
      for (const rel of rels) this.dirty.delete(rel);
      this.emit();
      return { ok: true, build: j.build };
    }
    if (r.status === 409) return { ok: false, reason: j.error === 'busy' ? 'busy' : 'changed', files: j.files || [] };
    if (r.status === 422) {
      this.error = new ContentError(j.file, j.path, j.message);
      this.emit();
      return { ok: false, reason: 'invalid', error: this.error };
    }
    if (j && j.error === 'build') {   // written, but the build failed: the files are saved
      Object.assign(this.stamp, j.stamp || {});
      for (const rel of rels) this.dirty.delete(rel);
      this.emit();
      return { ok: false, reason: 'build', output: j.output };
    }
    return { ok: false, reason: 'server', message: (j && j.message) || 'HTTP ' + r.status };
  },
};

Admin.store = store;
