import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  optimizeDeps: {
    exclude: [
      'graph-state',
      'react-graph-state',
      'swr-graph-state',
    ],
  }
})
