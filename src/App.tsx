import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import UserLogin from './pages/UserLogin';
import PathLabLogin from './pages/PathLabLogin';
import PathLabSignUp from './pages/PathLabSignUp';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import RecordUpload from './pages/RecordUpload';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import AuthGuard from './components/auth/AuthGuard';
import { Toaster } from './components/ui/toaster';
import { RecordsProvider } from './contexts/RecordsContext';

function App() {
  return (
    <div className="App">
      <RecordsProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/user-login" element={<UserLogin />} />
          <Route path="/pathlab-login" element={<PathLabLogin />} />
          <Route path="/pathlab-signup" element={<PathLabSignUp />} />
          <Route path="/records/upload" element={<RecordUpload />} />
          <Route path="/dashboard" element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          } />
          <Route path="/records" element={
            <AuthGuard>
              <Records />
            </AuthGuard>
          } />
          <Route path="/profile" element={
            <AuthGuard>
              <Profile />
            </AuthGuard>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </RecordsProvider>
    </div>
  );
}

export default App;