import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { AuthShell, AuthSwitchLink } from '@/components/layout/AuthShell';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/store/AuthContext';
import { useToast } from '@/store/ToastContext';

export function Login() {
  const { login, loginAsDemo } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login({ email, password });
      showToast(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.onboardingComplete ? '/app' : '/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginAsDemo();
      showToast('Signed in as demo student.');
      navigate('/app');
    } catch {
      setError('Could not start the demo. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your personalized study plan."
      footer={
        <>
          New to Nova? <AuthSwitchLink to="/signup" label="Create an account" />
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={16} />}
          required
        />
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock size={16} />}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="text-ink-400 transition hover:text-ink-600 dark:hover:text-ink-200"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          required
        />
        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-ink-600 dark:text-ink-300">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-primary-600 focus:ring-primary-500"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
            Forgot password?
          </Link>
        </div>
        {error && (
          <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm font-medium text-error-700 dark:border-error-700 dark:bg-error-700/20 dark:text-error-200">
            {error}
          </div>
        )}
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Sign in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-ink-200 dark:bg-ink-800" />
        OR
        <span className="h-px flex-1 bg-ink-200 dark:bg-ink-800" />
      </div>
      <Button variant="outline" fullWidth size="lg" onClick={demoLogin} loading={loading}>
        <span className="text-base">G</span> Continue with Google
      </Button>
      <button
        onClick={demoLogin}
        className="mt-3 w-full text-center text-sm font-medium text-primary-600 transition hover:text-primary-700 dark:text-primary-400"
      >
        Or explore the demo student →
      </button>
    </AuthShell>
  );
}
