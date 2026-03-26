/* global supabase */
(function initSupabaseClient(global) {
  function sanitize(value) {
    const normalized = String(value || "").trim();
    // Ignore template placeholders such as __SUPABASE_URL__
    if (!normalized || /^__.*__$/.test(normalized)) return "";
    return normalized;
  }

  function readMeta(name) {
    const el = document.querySelector(`meta[name="${name}"]`);
    return el ? el.getAttribute("content") || "" : "";
  }

  function getSupabaseConfig() {
    // Priority: runtime config file -> runtime globals -> meta tags.
    const runtime = global.VITALIS_RUNTIME_CONFIG || {};
    const url = sanitize(runtime.supabaseUrl || global.__VITALIS_SUPABASE_URL__ || readMeta("supabase-url"));
    const anonKey = sanitize(runtime.supabaseAnonKey || global.__VITALIS_SUPABASE_ANON_KEY__ || readMeta("supabase-anon-key"));
    return { url, anonKey };
  }

  function getSupabaseClient() {
    const { url, anonKey } = getSupabaseConfig();
    if (!url || !anonKey || !global.supabase || !global.supabase.createClient) return null;
    return global.supabase.createClient(url, anonKey);
  }

  global.VITALIS_SUPABASE = {
    getSupabaseConfig,
    getSupabaseClient
  };
})(window);
