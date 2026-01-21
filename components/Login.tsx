
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../supabaseClient';
import supabaseApi from '../supabaseApi';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('invite');
      const e = params.get('email');
      if (e) setEmail(decodeURIComponent(e));
      if (t) setInviteToken(t);
      if (e) setInviteEmail(decodeURIComponent(e));
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password || (isRegistering && !name)) return;

    setLoading(true);
    try {
      if (isRegistering) {
        // Retry sign-up with exponential backoff on 429 Too Many Requests
        const maxAttempts = 3;
        let attempt = 0;
        let lastError: any = null;
        while (attempt < maxAttempts) {
          attempt += 1;
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } },
          });
          if (!signUpError) {
            // success
            // If the project does not require email confirmation, attempt to sign in immediately
            try {
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
              if (!signInError && signInData?.user) {
                const user = signInData.user;
                const displayName = (user.user_metadata as any)?.full_name || email.split('@')[0];
                try {
                  await supabaseApi.upsertProfile({ id: user.id, name: displayName, email });
                } catch (e) {
                  // ignore
                }
                if (inviteToken && inviteEmail && inviteEmail.toLowerCase() === email.toLowerCase()) {
                  try {
                    await supabaseApi.acceptInvitation(inviteToken, inviteEmail, user.id);
                    setMessage('Invite accepted — your camp should appear on your dashboard.');
                  } catch (e) {
                    console.warn('Failed to accept invite after sign-up sign-in', e);
                  }
                }
                onLogin({ id: user.id, name: displayName, email });
                lastError = null;
                return;
              }
            } catch (e) {
              // ignore sign-in attempt error and fallthrough to confirmation message
            }

            setMessage('Account created — check your email to confirm your account before signing in.');
            lastError = null;
            break;
          }
          lastError = signUpError;
          const status = (signUpError && (signUpError.status || signUpError.statusCode)) as number | undefined;
          const text = (signUpError && signUpError.message) || '';
          const isRate = status === 429 || /too many requests/i.test(text);
          if (!isRate) {
            // non-rate error: stop retrying
            break;
          }
          // if rate limited and we have attempts left, wait with backoff then retry
          if (attempt < maxAttempts) {
            const backoff = 1000 * Math.pow(2, attempt - 1);
            await new Promise((res) => setTimeout(res, backoff));
            continue;
          }
        }
        if (lastError) throw lastError;
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        const user = data.user;
        const displayName = (user.user_metadata as any)?.full_name || email.split('@')[0];

        // Ensure profile exists, then accept invite if present, then call onLogin
        try {
          await supabaseApi.upsertProfile({ id: user.id, name: displayName, email });
        } catch (e) {
          // ignore
        }

        if (inviteToken && inviteEmail && inviteEmail.toLowerCase() === email.toLowerCase()) {
          try {
            await supabaseApi.acceptInvitation(inviteToken, inviteEmail, user.id);
            setMessage('Invite accepted — your camp should appear on your dashboard.');
          } catch (e: any) {
            console.warn('Failed to accept invite after sign-in', e);
            setMessage('Signed in but failed to accept invite automatically.');
          }
        }

        onLogin({ id: user.id, name: displayName, email });
      }
    } catch (err: any) {
      console.error('Auth error', err);
      const msg = err?.message || err?.error_description || err?.error || JSON.stringify(err);
      setError(msg || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-900 p-4 font-sans">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-emerald-800/20">
        <div className="text-center mb-10">
          <h1 className="festival-font text-6xl text-emerald-700 mb-3 tracking-tighter">FestiPlanner</h1>
          <p className="text-slate-500 font-medium tracking-tight">Your camp, coordinated.</p>
        </div>
        {message && (
          <div className="mb-4">
            <div className="flex items-start space-x-3 bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-lg">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-emerald-800">{message}</div>
                <div className="text-xs text-emerald-700 mt-1">Check your inbox and follow the confirmation link to finish setup.</div>
              </div>
              <button onClick={() => setMessage(null)} className="text-emerald-600 hover:underline text-sm">Dismiss</button>
            </div>
          </div>
        )}
        {error && (
          <div className="mb-4">
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg">
              <div className="font-semibold text-red-700">{error}</div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1 ml-1">Display Name</label>
              <input 
                required
                type="text" 
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-slate-50 focus:bg-white"
                placeholder="Festival Frank"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1 ml-1">Email Address</label>
            <input 
              required
              type="email" 
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-slate-50 focus:bg-white"
              placeholder="frank@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1 ml-1">Password</label>
            <input 
              required
              type="password" 
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-slate-50 focus:bg-white"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit"
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-[0.98]"
          >
            {isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100">
          <p className="text-[10px] text-center text-slate-400 leading-relaxed">
            By continuing, you agree to our Terms of Service.<br/>Securely hosted with enterprise-grade encryption.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
