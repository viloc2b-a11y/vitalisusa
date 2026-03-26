// Runtime config for static deployments (GitHub Pages / Netlify).
// Replace values in your deployment pipeline or before deploy.
// Never use service_role keys on the frontend. Use anon/public key only.
window.VITALIS_RUNTIME_CONFIG = {
  supabaseUrl: "__SUPABASE_URL__",
  supabaseAnonKey: "__SUPABASE_ANON_KEY__"
};
