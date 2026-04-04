import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Car, Mail, Lock, UserCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useAuth } from '../../context/AuthContext';
import { mockUsers } from '../../data/mockData';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'employee' | 'driver'>('employee');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mock authentication
    const user = mockUsers.find(u => u.email === email && u.role === role);
    
    if (user) {
      login(user);
      if (role === 'employee') {
        navigate('/employee/dashboard');
      } else {
        navigate('/driver/route');
      }
    } else {
      setError('Invalid credentials or role mismatch');
    }
  };

  // Quick login helper
  const quickLogin = (userRole: 'employee' | 'driver') => {
    const user = mockUsers.find(u => u.role === userRole);
    if (user) {
      setEmail(user.email);
      setPassword('demo123');
      setRole(userRole);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-blue-600 rounded-2xl p-4 mb-4 shadow-lg">
            <Car className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">TranspoRT</h1>
          <p className="text-gray-600 mt-2">Transport Route Management System</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Select Role</Label>
                <RadioGroup value={role} onValueChange={(value) => setRole(value as 'employee' | 'driver')}>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2 flex-1">
                      <RadioGroupItem value="employee" id="employee" />
                      <Label htmlFor="employee" className="cursor-pointer font-normal">
                        Employee
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 flex-1">
                      <RadioGroupItem value="driver" id="driver" />
                      <Label htmlFor="driver" className="cursor-pointer font-normal">
                        Driver
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Forgot Password */}
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Sign In
              </Button>

              {/* Demo Accounts */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center mb-3">Quick Demo Login:</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => quickLogin('employee')}
                  >
                    <UserCircle className="w-3 h-3 mr-1" />
                    Employee
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => quickLogin('driver')}
                  >
                    <Car className="w-3 h-3 mr-1" />
                    Driver
                  </Button>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
                    Sign Up
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-8">
          © 2026 TranspoRT. All rights reserved.
        </p>
      </div>
    </div>
  );
};
