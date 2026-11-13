import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { RetroOSProvider } from './context/RetroOSContext';
import { CRTMonitorShell } from './components/CRTMonitorShell';
import { CRTDioramaStage } from './components/CRTDioramaStage';
import { NotFoundPage } from './pages/404';

export const App: React.FC = () => {
  const [is404, setIs404] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    const hash = window.location.hash;
    return path === '/404' || path === '/404.html' || hash === '#/404' || hash === '#404';
  });

  useEffect(() => {
    const handleRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      setIs404(path === '/404' || path === '/404.html' || hash === '#/404' || hash === '#404');
    };

    window.addEventListener('popstate', handleRoute);
    window.addEventListener('hashchange', handleRoute);
    return () => {
      window.removeEventListener('popstate', handleRoute);
      window.removeEventListener('hashchange', handleRoute);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);

      // Handle direct hash navigation into Retro OS views
      const handleHashNavigation = () => {
        const hash = window.location.hash;
        if (hash === '#work' || hash === '#projects') {
          window.dispatchEvent(new CustomEvent('retro-os-open', { detail: 'projects' }));
        } else if (hash === '#about' || hash === '#skills' || hash === '#architecture') {
          window.dispatchEvent(new CustomEvent('retro-os-open', { detail: 'about' }));
        } else if (hash === '#contact' || hash === '#resume') {
          window.dispatchEvent(new CustomEvent('retro-os-open', { detail: 'resume' }));
        }
      };

      if (window.location.hash && !window.location.hash.startsWith('#/404')) {
        handleHashNavigation();
      }

      window.addEventListener('hashchange', handleHashNavigation);
      return () => {
        window.removeEventListener('hashchange', handleHashNavigation);
      };
    }
  }, []);

  if (is404) {
    return (
      <ThemeProvider>
        <RetroOSProvider initialSection="projects">
          <main
            id="main-content"
            role="main"
            className="w-screen h-[100dvh] m-0 p-0 overflow-hidden"
            style={{
              width: '100vw',
              height: '100dvh',
              margin: 0,
              padding: 0,
              overflow: 'hidden',
              backgroundColor: '#c8c2ab',
            }}
          >
            <CRTMonitorShell initialBoot={false}>
              <NotFoundPage
                onReturnHome={() => {
                  setIs404(false);
                  if (typeof window !== 'undefined') {
                    if (window.location.hash.startsWith('#/404') || window.location.hash.startsWith('#404')) {
                      window.location.hash = '';
                    } else {
                      window.history.pushState(null, '', '/');
                    }
                  }
                }}
              />
            </CRTMonitorShell>
          </main>
        </RetroOSProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <RetroOSProvider initialSection="projects">
        <main
          id="main-content"
          role="main"
          className="w-screen h-[100dvh] m-0 p-0 overflow-hidden"
          style={{
            width: '100vw',
            height: '100dvh',
            margin: 0,
            padding: 0,
            overflow: 'hidden',
            backgroundColor: '#c8c2ab',
          }}
        >
          <CRTMonitorShell>
            <CRTDioramaStage id="hero" />
          </CRTMonitorShell>
        </main>
      </RetroOSProvider>
    </ThemeProvider>
  );
};

export default App;
