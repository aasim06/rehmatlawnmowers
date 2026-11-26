import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import Loadable from 'components/Loadable';

const LoginPage = Loadable(lazy(() => import('pages/auth/Login')));

// ==============================|| AUTH ROUTING (INSTANT) ||============================== //

const LoginRoutes = {
  path: '/',
  children: [
    {
      path: 'login',
      element: <LoginPage />
    },
    {
      path: 'register',
      element: <Navigate to="/login" replace />
    }
  ]
};

export default LoginRoutes;
