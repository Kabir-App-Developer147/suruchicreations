/* ============================================================
   GURMIT LAMBA ART — SUPABASE NETWORK PIPELINE
   ============================================================ */

// TODO: Replace these with your actual Supabase Project configuration tokens
const SUPABASE_URL = "https://znfczlamyiccmavrgyin.supabase.co ";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZmN6bGFteWljY21hdnJneWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MjgwMzIsImV4cCI6MjA5NjQwNDAzMn0.l6SsEP0E-JREF59jFBtbXVlw6NQTbtZeYfjIa3VieRE";

const dbHeaders = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json"
};

async function dbFetch(table, options = {}) {
  const query = options.query ? `?${options.query}` : "";
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  
  const config = {
    method: options.method || "GET",
    headers: { ...dbHeaders, ...options.headers }
  };
  if (options.body) config.body = JSON.stringify(options.body);

  try {
    const res = await fetch(url, config);
    if (!res.ok) throw new Error(`Database Error HTTP Status: ${res.status}`);
    if (config.method === "GET") return await res.json();
    return true;
  } catch (err) {
    console.error(`Pipeline failure on [${table}]:`, err);
    return config.method === "GET" ? [] : false;
  }
}

// ── EXPORTED DATABASE INTERFACES ───────────────────────────
async function getProducts() {
  return await dbFetch("products", { query: "order=created_at.desc" });
}

async function saveProductToDB(product) {
  return await dbFetch("products", {
    method: "POST",
    headers: { "Prefer": "resolution=merge-duplicates" },
    body: product
  });
}

async function deleteProductFromDB(id) {
  return await dbFetch("products", { method: "DELETE", query: `id=eq.${id}` });
}

async function getVideos() {
  return await dbFetch("videos", { query: "order=created_at.desc" });
}

async function saveVideoToDB(video) {
  return await dbFetch("videos", {
    method: "POST",
    headers: { "Prefer": "resolution=merge-duplicates" },
    body: video
  });
}

async function deleteVideoFromDB(id) {
  return await dbFetch("videos", { method: "DELETE", query: `id=eq.${id}` });
}

async function getOrders() {
  return await dbFetch("orders", { query: "order=created_at.desc" });
}

async function saveOrderToDB(order) {
  return await dbFetch("orders", { method: "POST", body: order });
}

async function updateOrderStatusInDB(id, status) {
  return await dbFetch("orders", {
    method: "PATCH",
    query: `id=eq.${id}`,
    body: { status }
  });
}

async function deleteOrderFromDB(id) {
  return await dbFetch("orders", { method: "DELETE", query: `id=eq.${id}` });
}