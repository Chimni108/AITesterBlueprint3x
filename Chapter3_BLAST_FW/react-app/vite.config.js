import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const jiraTarget = env.VITE_JIRA_BASE_URL || 'https://testlearn.atlassian.net'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/jira': {
          target: jiraTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/jira/, ''),
          secure: true,
        },
      },
    },
  }
})
