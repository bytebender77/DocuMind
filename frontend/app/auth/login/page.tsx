"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${BACKEND_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || "Login failed");
            }

            const data = await res.json();
            localStorage.setItem("rag_token", data.access_token);
            localStorage.setItem("rag_refresh_token", data.refresh_token);
            localStorage.setItem("rag_user_email", email);

            // Fetch and store workspace
            const wsRes = await fetch(`${BACKEND_URL}/workspaces/`, {
                headers: { "Authorization": `Bearer ${data.access_token}` }
            });

            if (wsRes.ok) {
                const workspaces = await wsRes.json();
                if (workspaces.length > 0) {
                    localStorage.setItem("rag_workspace_id", workspaces[0].id);
                }
            }

            router.push("/documents");
        } catch (err: any) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Background */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '50%', height: '50%', background: 'rgba(30,58,138,0.15)', borderRadius: '9999px', filter: 'blur(120px)' }} />
                <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50%', height: '50%', background: 'rgba(88,28,135,0.15)', borderRadius: '9999px', filter: 'blur(120px)' }} />
            </div>

            <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '400px', padding: '2rem' }}>
                {/* Logo */}
                <Link href="/" style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img src="/logo.png" alt="Logo" style={{ width: '2.5rem', height: '2.5rem' }} />
                        <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#fff' }}>DocuMind</span>
                    </div>
                </Link>

                {/* Card */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem', padding: '2rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600, textAlign: 'center', marginBottom: '0.5rem' }}>Welcome back</h1>
                    <p style={{ fontSize: '0.875rem', color: '#a3a3a3', textAlign: 'center', marginBottom: '1.5rem' }}>Sign in to your account</p>

                    {error && (
                        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', color: '#ef4444', fontSize: '0.875rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#d4d4d4' }}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                style={{
                                    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#d4d4d4' }}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
                                    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="shiny-cta"
                            style={{
                                width: '100%', padding: '0.875rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#737373' }}>
                        Don't have an account?{' '}
                        <Link href="/auth/signup" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 500 }}>
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
