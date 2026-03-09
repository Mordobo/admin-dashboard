/**
 * Prueba de login contra la API (para depurar conexión Backoffice ↔ API).
 * Ejecutar: node scripts/test-login.mjs
 * Opcional: API_URL=https://mordobo-api-qa.onrender.com node scripts/test-login.mjs
 */
const API_URL = (process.env.API_URL || process.env.VITE_API_BASE_URL || "https://mordobo-api-qa.onrender.com").replace(/\/+$/, "");
const EMAIL = process.env.ADMIN_EMAIL || "admin@mordobo.com";
const PASSWORD = process.env.ADMIN_PASSWORD || "Admin123!";

console.log("→ API base:", API_URL);
console.log("→ Login:", EMAIL, "/", PASSWORD.replace(/./g, "*"));
console.log("");

const url = `${API_URL}/auth/login`;
try {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const data = await res.json().catch(() => ({}));
  console.log("Status:", res.status, res.statusText);
  console.log("Response:", JSON.stringify(data, null, 2));
  if (!res.ok) {
    console.log("\n❌ Login falló. Si es 401 invalid_credentials, el usuario no existe en la DB que usa esta API.");
    console.log("   Asegúrate de haber ejecutado el seed con el mismo DATABASE_URL que tiene la API en Render.");
    process.exit(1);
  }
  console.log("\n✅ Login OK. El Backoffice debería poder conectar con estas credenciales.");
} catch (err) {
  console.error("❌ Error de conexión:", err.message);
  console.log("   Revisa que la API esté levantada y que la URL sea correcta.");
  process.exit(1);
}
