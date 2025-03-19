"use client";

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { FaSpinner } from 'react-icons/fa';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useStore();
  const router = useRouter();
  const loginMutation = trpc.task.login.useMutation({
    onSuccess: (user) => {
      login(user);
      router.push('/');
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Admin Login</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button
            type="submit"
            disabled={loginMutation.isLoading}
            className="login-btn"
          >
            {loginMutation.isLoading ? (
              <FaSpinner className="spinner" />
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}