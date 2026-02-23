import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

**File 3: `.gitignore`** (create at root)
```
node_modules/
dist/
.DS_Store
*.log
.env
```

After adding all three, Vercel will auto-redeploy. Your repo root should now have:
```
index.html        ← you just added
vite.config.js    ← you just added
.gitignore        ← you just added
package.json      ← already there
src/
  App.jsx         ← already there
  main.jsx        ← already there
