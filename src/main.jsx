import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import App from './App.jsx'
import { CMSProvider } from "@/context/CMSContext";

createRoot(document.getElementById('root')).render(
  <CMSProvider>
    <StrictMode>
      <App />
    </StrictMode>
  </CMSProvider>
)
