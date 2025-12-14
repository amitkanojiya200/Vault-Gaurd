// src/App.jsx
import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';

import Splash from './components/Splash';
import NavBar from './components/NavBar';
import Footer from './components/Footer';

import { RouteProvider, RouterView, useRoute, ROUTES } from './router/Router';

// This component sits INSIDE RouteProvider so it can see the route
function AppShell() {
  const { route } = useRoute();
  const isAuthScreen = route === ROUTES.LOGIN || route === ROUTES.REGISTER;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hide NavBar on Login/Register */}
      {!isAuthScreen && <NavBar />}

      <main className="flex-1">
        <RouterView />
      </main>

      {/* Hide Footer on Login/Register */}
      {!isAuthScreen && <Footer />}
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <AnimatePresence>
        {showSplash && <Splash key="splash" onDone={() => setShowSplash(false)} />}
      </AnimatePresence>

      {!showSplash && (
        <RouteProvider>
          <AppShell />
        </RouteProvider>
      )}
    </div>
  );
}
