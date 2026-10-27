import { Navigate } from 'react-router-dom';
import LoginPage from 'pages/auth/Login';

// ==============================|| AUTH ROUTING (INSTANT) ||============================== //

const LoginRoutes = {
  path: '/',
  children: [
    {
      path: '/',
      children: [
        {
          path: '/login',
          element: <LoginPage />
        },
        {
          path: '/register',
          element: <Navigate to="/login" replace />
        }
      ]
    }
  ]
};

export default LoginRoutes;
