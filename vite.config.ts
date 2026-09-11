import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom y no el entorno de node: casi todo lo que hay para probar acá toca
    // el DOM, el localStorage o los eventos de window.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/test/**/*.test.{ts,tsx}'],
    // El CSS de Tailwind no cambia ningún comportamiento y procesarlo en cada
    // archivo de test cuesta más que todo lo demás junto.
    css: false,
    restoreMocks: true,
  },
})
