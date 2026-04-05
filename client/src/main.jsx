import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  // removed React.StrictMode because PixiJS app creation behaves weirdly in dev mode with strict mode double rendering
  <App />
)
