import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './secplus-quiz.jsx'
import { initSync } from './sync/sync-engine.js'

// Sync engine boot. Always exposes window.__secplusSync for DevTools
// validation; only starts the scanner / pull-merge-push cycle if a PAT +
// Gist ID are already saved. No UI yet — Settings → Advanced → Sync ships
// in Task 1.5c.
initSync()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
