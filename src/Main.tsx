import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { Login } from './components/Login/Login';
import { ProtectedRoute } from './ProtectedRoute';
import { Tree } from './pages/Tree';
import { useDisablePinch } from './utils/useDisablePinch';

export const Main = () => {
  useDisablePinch();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/tree"
          element={
            <ProtectedRoute>
              <Tree />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};
