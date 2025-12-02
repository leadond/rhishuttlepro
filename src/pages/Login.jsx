import React, { useState } from "react";
import { useAuth } from "@/components/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock, Mail, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";
import { useBranding } from "@/contexts/BrandingContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // 'login' | 'forgot-password'
  const { login, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { branding } = useBranding();
  
  // Get branded values with fallbacks
  const appName = branding?.enableCustomBranding && branding?.appName ? branding.appName : 'Shuttle Pro';
  const logoUrl = branding?.enableCustomBranding && branding?.logoUrl ? branding.logoUrl : '/src/assets/logo.png';
  const tagline = branding?.enableCustomBranding && branding?.tagline ? branding.tagline : 'Premium Fleet Management';

  const from = location.state?.from?.pathname || "/";

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      console.log('User already logged in, redirecting...', user);
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!", {
        description: `Successfully signed in to ${appName}`,
        duration: 3000,
      });
      // Don't navigate here - let the useEffect above handle navigation
      // once the user state is fully populated with roles from the database
    } catch (error) {
      console.error("Login error:", error);
      let message = "Failed to sign in";
      if (error.code === 'auth/invalid-credential') message = "Invalid email or password";
      if (error.code === 'auth/user-not-found') message = "No account found with this email";
      if (error.code === 'auth/wrong-password') message = "Incorrect password";
      toast.error(message);
      setLoading(false);
    }
    // Note: We don't set loading=false on success because we're waiting for redirect
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      toast.success("Reset link sent!", {
        description: "Check your email for password reset instructions.",
        duration: 5000,
      });
      setMode("login");
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Failed to send reset email: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1493238792000-8113da705763?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center relative">
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>

      <div className="relative z-10 w-full max-w-md px-4 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white shadow-2xl mb-6 transform hover:scale-105 transition-transform duration-300 p-2">
            <img src={logoUrl} alt={`${appName} Logo`} className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">{appName}</h1>
          <p className="text-slate-300 text-lg">{tagline}</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl ring-1 ring-white/20">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-slate-900">
              {mode === "login" ? "Welcome Back" : "Reset Password"}
            </CardTitle>
            <CardDescription className="text-center text-slate-500 font-medium">
              {mode === "login" 
                ? "Enter your credentials to access your dashboard" 
                : "Enter your email to receive a reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-semibold">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-primary focus:ring-primary transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-700 font-semibold">Password</Label>
                    <Button
                      variant="link"
                      className="px-0 font-semibold text-primary h-auto"
                      onClick={() => setMode("forgot-password")}
                      type="button"
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-primary focus:ring-primary transition-all"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:opacity-90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-slate-700 font-semibold">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-primary focus:ring-primary transition-all"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:opacity-90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <KeyRound className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full h-11 font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  onClick={() => setMode("login")}
                  type="button"
                >
                  Back to Login
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t pt-6 bg-slate-50/50 rounded-b-xl">
            <div className="text-center text-sm text-slate-500">
              Protected by enterprise-grade security.
              <br />
              Authorized personnel only.
            </div>
          </CardFooter>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm font-medium">
            &copy; {new Date().getFullYear()} {appName}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
