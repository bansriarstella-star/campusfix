import { useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { BookServicePage } from './pages/BookServicePage';
import { HomePage } from './pages/HomePage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProviderDashboardPage } from './pages/ProviderDashboardPage';
import { RequestDetailPage } from './pages/RequestDetailPage';
import { ServicesPage } from './pages/ServicesPage';

function AppRoutes() {
  const [locationUrl, setLocationUrl] = useState(
    () => window.location.pathname + window.location.search,
  );

  useEffect(() => {
    const onPopState = () => {
      setLocationUrl(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (path: string) => {
    if (path === locationUrl) return;
    window.history.pushState({}, '', path);
    setLocationUrl(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const parsed = new URL(locationUrl, window.location.origin);
  const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
  const params = parsed.searchParams;

  let content = <HomePage onNavigate={navigate} />;

  if (pathname === '/services') {
    content = (
      <ServicesPage
        initialCategory={params.get('category') ?? undefined}
        onNavigate={navigate}
      />
    );
  } else if (pathname === '/book') {
    content = (
      <BookServicePage
        initialServiceId={params.get('serviceId') ?? undefined}
        onNavigate={navigate}
      />
    );
  } else if (pathname === '/requests') {
    content = <MyRequestsPage onNavigate={navigate} />;
  } else if (pathname.startsWith('/requests/')) {
    const bookingId = decodeURIComponent(pathname.slice('/requests/'.length));
    content = (
      <RequestDetailPage
        bookingId={bookingId}
        justCreated={params.get('created') === '1'}
        onNavigate={navigate}
      />
    );
  } else if (pathname === '/profile') {
    content = <ProfilePage onNavigate={navigate} />;
  } else if (pathname === '/provider') {
    content = <ProviderDashboardPage />;
  } else if (pathname === '/admin') {
    content = <AdminDashboardPage />;
  }

  return (
    <Layout currentPath={pathname} onNavigate={navigate}>
      {content}
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}
