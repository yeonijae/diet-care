import React, { useState, useEffect } from 'react';

interface RouterProps {
  children: (route: string, setRoute: (route: string) => void) => React.ReactNode;
}

export const Router: React.FC<RouterProps> = ({ children }) => {
  const [route, setRoute] = useState<string>(() => {
    // Get initial route from URL
    const path = window.location.pathname;
    return path === '/' ? 'patient' : path.substring(1);
  });

  useEffect(() => {
    // Update URL when route changes
    const path = route === 'patient' ? '/' : `/${route}`;
    window.history.pushState({}, '', path);
  }, [route]);

  useEffect(() => {
    // Handle browser back/forward buttons
    const handlePopState = () => {
      const path = window.location.pathname;
      setRoute(path === '/' ? 'patient' : path.substring(1));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return <>{children(route, setRoute)}</>;
};
