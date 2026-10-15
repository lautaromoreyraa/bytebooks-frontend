/**
 * Cloudflare Web Analytics: cuenta sólo navegadores reales que ejecutan el
 * script, así que los barridos de bots no ensucian las métricas. Se carga
 * únicamente en el dominio publicado: ni el entorno local ni las URLs de
 * prueba de Vercel llegan a las estadísticas. El token es público (viaja en
 * el HTML); es el del sitio bytebooks.lautaromoreyra.dev en Web Analytics.
 */
const HOST = 'bytebooks.lautaromoreyra.dev'
const TOKEN = 'd02af22d1273476b8f4b10b63b692b8c'

export function iniciarAnaliticas(): void {
  // En la app nativa no hay document: las analíticas son sólo de la web.
  if (typeof document === 'undefined' || window.location.hostname !== HOST) return
  const script = document.createElement('script')
  script.defer = true
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  script.dataset.cfBeacon = JSON.stringify({ token: TOKEN })
  document.body.appendChild(script)
}
