import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/ui/theme-provider"

import { AuthProvider } from "@/components/contexts/AuthContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { BrandingProvider } from "@/contexts/BrandingContext";

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <BrandingProvider>
          <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <Pages />
            <Toaster />
          </ThemeProvider>
        </BrandingProvider>
      </WebSocketProvider>
    </AuthProvider>
  )
}

export default App