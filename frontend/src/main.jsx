// frontend/src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';
import './index.css';
import './styles/landing.css';
import './styles/globals.css';

import App from './App.jsx';
import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import ThemeContext, { ThemeProviderCustom } from './contexts/ThemeContext';
import { AuthProvider } from './hooks/useAuth';
import { getMuiTheme } from './styles/muiTheme';

const MuiThemeBridge = ({ children }) => {
  const { darkMode } = React.useContext(ThemeContext);
  const theme = React.useMemo(() => getMuiTheme(darkMode), [darkMode]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

// Get Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <ThemeProviderCustom>
        <MuiThemeBridge>
          <AuthProvider>
            <App />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  fontFamily: 'Cairo, sans-serif',
                },
              }}
            />
          </AuthProvider>
        </MuiThemeBridge>
      </ThemeProviderCustom>
    </ClerkProvider>
  </React.StrictMode>
);