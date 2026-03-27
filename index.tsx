
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import App from './App';
import { AuthProvider } from './services/AuthContext';

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  throw new Error('Missing VITE_CONVEX_URL');
}
const convex = new ConvexReactClient(convexUrl);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConvexAuthProvider>
  </React.StrictMode>
);
