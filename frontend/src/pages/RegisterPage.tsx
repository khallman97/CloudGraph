import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cloud, Network, Zap } from 'lucide-react';
import { useAuthStore } from '@/app/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signup, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    try {
      await signup({ email, password });
      navigate('/dashboard');
    } catch {
      // Error is already set in the store
    }
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-8">
            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <Cloud className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">CloudGraph IDE</h1>
          </div>

          <div className="space-y-6 mt-16">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Visual Infrastructure<br />as Code
            </h2>
            <p className="text-blue-100 text-lg max-w-md">
              Design AWS architecture visually and generate production-ready Terraform code instantly.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-white/10 rounded-lg mt-1">
              <Network className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Spatial Containment</h3>
              <p className="text-blue-100 text-sm">Drag resources into networks - no complex connections needed</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-white/10 rounded-lg mt-1">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Instant Code Generation</h3>
              <p className="text-blue-100 text-sm">Transform your diagrams into valid Terraform HCL</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 relative">
        {/* Theme toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardHeader className="space-y-2 pb-6">
            <div className="lg:hidden flex items-center justify-center mb-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Cloud className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center dark:text-white">Create Account</CardTitle>
            <CardDescription className="text-center text-slate-600 dark:text-slate-400">
              Sign up to start building cloud infrastructure
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              {displayError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md animate-in fade-in slide-in-from-top-2">
                  {displayError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-300">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
              <p className="text-sm text-center text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline transition-colors">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
