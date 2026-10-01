import 'bulma/css/bulma.min.css';
import '@/styles/globals.css';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';

export default function App({ Component, pageProps }) {
  // Sync HTML theme attribute on mount to avoid style mismatch
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Component {...pageProps} />
      </main>
    </div>
  );
}
