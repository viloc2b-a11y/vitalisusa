// Runtime config for static deployments (GitHub Pages / Netlify).
// Replace values in your deployment pipeline or before deploy.
// Never use service_role keys on the frontend. Use anon/public key only.
window.VITALIS_RUNTIME_CONFIG = {
  supabaseUrl: "https://vitalis-usa-supabase-b9a7d6-187-124-92-65.traefik.me",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzM4MzgzMDYsImV4cCI6MTg5Mzk1NjAwMCwicm9sZSI6ImFub24ifQ.YbicOaQGPEDe0OvpCHJlNDlS7Wdb-MoOmCD7PSKGnCg"
};
