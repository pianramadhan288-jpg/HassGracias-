import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Fix: cast process to any to avoid TS error 'Property cwd does not exist on type Process'
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Safely expose the API_KEY. 
      // Vercel injects env vars into process.env during build.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
      // Fallback for other process.env usage to prevent crash
      'process.env': {} 
    }
  };
});