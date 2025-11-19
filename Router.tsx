import React, { useState, useEffect } from 'react';

interface RouterProps {
  children: (route: string, setRoute: (route: string) => void) => React.ReactNode;
}

export const Router: React.FC<RouterProps> = ({ children }) => {
  const [route, setRoute] = useState<string>(() => {
    // Get initial route from URL hash
    const hash = window.location.hash.substring(1) || '/';
    return hash === '/' ? 'patient' : hash.substring(1);
  });

  useEffect(() => {
    // Update URL hash when route changes
    const path = route === 'patient' ? '/' : `/${route}`;
    window.location.hash = path;
  }, [route]);

  useEffect(() => {
    // Handle hash changes
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1) || '/';
      setRoute(hash === '/' ? 'patient' : hash.substring(1));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return <>{children(route, setRoute)}</>;
};
