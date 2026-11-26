import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Brewing from './components/Brewing.jsx'
import { loadFortunes } from './lib/fortuneEngine.js'

const root = createRoot(document.getElementById('root'))

root.render(<Brewing />)

loadFortunes()
  .then(() =>
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  )
  .catch((err) => {
    console.error(err)
    root.render(<Brewing error={err} />)
  })
