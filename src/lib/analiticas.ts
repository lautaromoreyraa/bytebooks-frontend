const HOST = 'bytebooks.lautaromoreyra.dev'
const TOKEN = 'd02af22d1273476b8f4b10b63b692b8c'

export function iniciarAnaliticas(): void {
  if (typeof document === 'undefined' || window.location.hostname !== HOST) return
  const script = document.createElement('script')
  script.defer = true
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  script.dataset.cfBeacon = JSON.stringify({ token: TOKEN })
  document.body.appendChild(script)
}
