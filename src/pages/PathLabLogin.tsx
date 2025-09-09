import PageTransition from '@/components/animations/PageTransition';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/CustomCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { motion } from 'framer-motion';
import { EyeIcon, EyeOffIcon, Lock, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const PathLabLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Login lab using API
      const response = await axios.post('http://localhost:5000/api/auth/lab/login', {
        email,
        password
      });
      
      // Set auth state in localStorage
      localStorage.setItem('userRole', 'pathlab');
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error: any) {
      if (error.response && error.response.data) {
        toast.error(error.response.data.error || 'Invalid email or password');
      } else {
        toast.error('An error occurred during login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold">Pathology Lab Login</h1>
              <p className="mt-2 text-gray-600">
                Sign in to upload and manage patient reports
              </p>
            </div>

            <Card className="backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="space-y-6 p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        id="email"
                        placeholder="lab@example.com"
                        type="email"
                        autoComplete="email"
                        required
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link to="/forgot-password" className="text-xs text-medical-blue hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        className="pl-10 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" />
                      <label htmlFor="remember" className="text-sm text-gray-600">
                        Remember me
                      </label>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign in as Lab'}
                </Button>

                <div className="relative flex items-center justify-center mt-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative px-4 text-sm bg-white">
                    <span className="text-gray-500">Or</span>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Need a lab account?{' '}
                    <Link to="/pathlab-signup" className="text-medical-blue hover:underline font-medium">
                      Register your lab
                    </Link>
                  </p>
                </div>

                <div className="text-center mt-2">
                  <p className="text-sm text-gray-600">
                    Are you a patient?{' '}
                    <Link to="/user-login" className="text-medical-blue hover:underline font-medium">
                      Sign in as Patient
                    </Link>
                  </p>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
        <Footer />
      </PageTransition>
    </>
  );
};

export default PathLabLogin;
