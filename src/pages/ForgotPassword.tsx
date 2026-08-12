import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { AuthShell, AuthSwitchLink } from '@/components/layout/AuthShell';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/authService';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll send a reset link to your email."
      footer={
        <>
          Remembered it? <AuthSwitchLink to="/login" label="Back to sign in" />
        </>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-accent-200 bg-accent-50 p-6 text-center dark:border-accent-800 dark:bg-accent-900/30">
          <CheckCircle2 size={36} className="mx-auto text-accent-600 dark:text-accent-400" />
          <h3 className="mt-3 font-display text-lg font-semibold text-ink-900 dark:text-ink-50">Check your inbox</h3>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            If an account exists for <span className="font-semibold">{email}</span>, a reset link is on its way.
          </p>
          <Link to="/login" className="mt-5 inline-block">
            <Button variant="outline">
              <ArrowLeft size={16} /> Back to sign in
            </Button>
          </Link>
        </div>
      ) : (
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
          {error && (
            <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm font-medium text-error-700 dark:border-error-700 dark:bg-error-700/20 dark:text-error-200">
              {error}
            </div>
          )}
          <Button type="submit" fullWidth size="lg" loading={loading}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
