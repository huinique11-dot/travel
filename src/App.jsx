import { useEffect, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useAuth } from './store/index.js';
import { hasMaps, MAPS_KEY } from './lib/config.js';
import Login from './components/Login.jsx';
import TripList from './components/TripList.jsx';
import TripView from './components/TripView.jsx';

// 해시 라우팅: #/  ,  #/trip/{id}/{tab}
function useRoute() {
  const get = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const fn = () => setRoute(get());
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  return route;
}
export const go = (path) => { window.location.hash = path; };

function Routes() {
  const user = useAuth();
  const route = useRoute();
  if (user === undefined) return <div className="center-screen"><div className="spinner" /></div>;
  if (!user) return <Login />;
  if (route[0] === 'trip' && route[1]) return <TripView key={route[1]} user={user} tripId={route[1]} tab={route[2] || 'plan'} />;
  return <TripList user={user} />;
}

export default function App() {
  if (!hasMaps) return <Routes />;
  return (
    <APIProvider apiKey={MAPS_KEY} language="ko" region="KR" libraries={['places', 'marker']}>
      <Routes />
    </APIProvider>
  );
}
