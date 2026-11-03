// frontend/src/styles/muiTheme.js
import { createTheme } from '@mui/material/styles';

export const getMuiTheme = (darkMode) =>
  createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#2563eb' },
      background: {
        default: darkMode ? '#0b1220' : '#ffffff',
        paper: darkMode ? '#111827' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Cairo", system-ui, -apple-system, Segoe UI, Roboto, Arial',
    },
    shape: { borderRadius: 12 },
  });