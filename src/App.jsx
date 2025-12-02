import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/ui/theme-provider"

import { AuthProvider } from "@/components/contexts/AuthContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";

function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <WebSocketProvider>
          <BrandingProvider>
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
              <Pages />
              <Toaster />
            </ThemeProvider>
          </BrandingProvider>
        </WebSocketProvider>
      </OrganizationProvider>
    </AuthProvider>
  )
}

export default App