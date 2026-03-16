'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, Loader2, Zap, CheckCircle2 } from 'lucide-react';
import { toast } from '@/lib/hooks/useToast';

type AuthMode = 'signin' | 'signup';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signin');
  const [signupDone, setSignupDone] = useState(false);
  const router = useRouter();

  // ── Demo mode: skip auth entirely ────────────────────────────────────────
  const handleDemoContinue = () => {
    setIsDemoLoading(true);
    router.push('/dashboard');
  };

  // ── Sign In ───────────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) { handleDemoContinue(); return; }

    setIsLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/dashboard');
      router.refresh();
    } catch (error: unknown) {
      toast({
        title: 'Sign in failed',
        description: error instanceof Error ? error.message : 'Invalid email or password.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Sign Up ───────────────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) { handleDemoContinue(); return; }

    setIsLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setSignupDone(true);
    } catch (error: unknown) {
      toast({
        title: 'Sign up failed',
        description: error instanceof Error ? error.message : 'Could not create account.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-100 p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg mb-3">
            <Dumbbell className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FitTrack</h1>
          <p className="text-sm text-gray-500 mt-1">Your personal fitness companion</p>
        </div>

        {/* Demo mode banner */}
        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
            <p className="text-sm font-medium text-amber-800 mb-1">Running in Demo Mode</p>
            <p className="text-xs text-amber-600">
              No Supabase configured — all data is stored locally on this device.
            </p>
          </div>
        )}

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">
              {isSupabaseConfigured
                ? mode === 'signin' ? 'Welcome back' : 'Create account'
                : 'Welcome back'}
            </CardTitle>
            <CardDescription>
              {isSupabaseConfigured
                ? mode === 'signin'
                  ? 'Sign in to your FitTrack account'
                  : 'Create your personal FitTrack account'
                : 'Continue in demo mode or sign in when Supabase is configured'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* ── Continue as Demo — only shown when Supabase is NOT configured ── */}
            {!isSupabaseConfigured && (
              <Button
                type="button"
                className="w-full h-12 gap-2 text-base bg-primary text-primary-foreground"
                onClick={handleDemoContinue}
                disabled={isDemoLoading}
              >
                {isDemoLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Zap className="h-4 w-4" />}
                Continue as Demo
              </Button>
            )}

            {/* ── Supabase auth section ── */}
            {isSupabaseConfigured && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      or continue with email
                    </span>
                  </div>
                </div>

                {/* Sign-in / Sign-up tabs */}
                <div className="flex rounded-lg bg-muted p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setSignupDone(false); }}
                    className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                      mode === 'signin'
                        ? 'bg-background shadow text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setSignupDone(false); }}
                    className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                      mode === 'signup'
                        ? 'bg-background shadow text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* ── Sign-up success state ── */}
                {signupDone ? (
                  <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
                    <p className="text-sm font-medium text-green-800">Check your email!</p>
                    <p className="text-xs text-green-600">
                      We sent a confirmation link to <strong>{email}</strong>.
                      Click it to activate your account, then sign in.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => { setMode('signin'); setSignupDone(false); }}
                    >
                      Back to Sign In
                    </Button>
                  </div>
                ) : (
                  /* ── Auth form ── */
                  <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={mode === 'signup' ? 6 : undefined}
                        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                        className="h-12"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 text-base"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                        </>
                      ) : (
                        mode === 'signin' ? 'Sign In' : 'Create Account'
                      )}
                    </Button>
                  </form>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          FitTrack v1.0 · Personal Fitness Tracker
        </p>
      </div>
    </div>
  );
}
