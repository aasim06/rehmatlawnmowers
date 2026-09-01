import LoginPage from 'pages/auth/Login';
import RegisterPage from 'pages/auth/Register';

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
          element: <RegisterPage />
        }
      ]
    }
  ]
};

export default LoginRoutes;
