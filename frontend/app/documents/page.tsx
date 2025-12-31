"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Simple markdown renderer for chat messages
function renderMarkdown(text: string) {
    // Split by lines and process
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    let inList = false;
    let listItems: string[] = [];

    const processLine = (line: string, key: number) => {
        // Bold text: **text** or __text__
        let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        processed = processed.replace(/__(.*?)__/g, '<strong>$1</strong>');
        // Italic: *text* or _text_
        processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        processed = processed.replace(/_([^_]+)_/g, '<em>$1</em>');
        // Code: `text`
        processed = processed.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:0.125rem 0.25rem;border-radius:0.25rem;font-size:0.8em">$1</code>');

        return <span key={key} dangerouslySetInnerHTML={{ __html: processed }} />;
    };

    lines.forEach((line, i) => {
        // Bullet points: - or *
        if (line.trim().match(/^[-*]\s+/)) {
            if (!inList) {
                inList = true;
                listItems = [];
            }
            listItems.push(line.trim().replace(/^[-*]\s+/, ''));
        } else {
            // Close previous list if exists
            if (inList) {
                elements.push(
                    <ul key={`list-${i}`} style={{ margin: '0.5rem 0', paddingLeft: '1.25rem' }}>
                        {listItems.map((item, j) => (
                            <li key={j} style={{ marginBottom: '0.25rem' }}>{processLine(item, j)}</li>
                        ))}
                    </ul>
                );
                inList = false;
                listItems = [];
            }

            // Empty line = paragraph break
            if (line.trim() === '') {
                elements.push(<br key={`br-${i}`} />);
            } else {
                elements.push(<p key={`p-${i}`} style={{ margin: '0.25rem 0' }}>{processLine(line, i)}</p>);
            }
        }
    });

    // Close any remaining list
    if (inList && listItems.length > 0) {
        elements.push(
            <ul key="list-final" style={{ margin: '0.5rem 0', paddingLeft: '1.25rem' }}>
                {listItems.map((item, j) => (
                    <li key={j} style={{ marginBottom: '0.25rem' }}>{processLine(item, j)}</li>
                ))}
            </ul>
        );
    }

    return elements;
}

export default function Documents() {
    const router = useRouter();

    // Auth State
    const [token, setToken] = useState<string | null>(null);
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // File Upload State
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Chat State
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Check auth on mount
    useEffect(() => {
        const savedToken = localStorage.getItem("rag_token");
        const savedWorkspaceId = localStorage.getItem("rag_workspace_id");
        const savedEmail = localStorage.getItem("rag_user_email");

        if (savedToken && savedWorkspaceId) {
            setToken(savedToken);
            setWorkspaceId(savedWorkspaceId);
            setUserEmail(savedEmail);
            setIsCheckingAuth(false);
        } else {
            // Redirect to login if not authenticated
            router.push("/auth/login");
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("rag_token");
        localStorage.removeItem("rag_refresh_token");
        localStorage.removeItem("rag_workspace_id");
        localStorage.removeItem("rag_user_email");
        router.push("/");
    };

    const uploadFiles = async () => {
        if (files.length === 0) {
            alert("Please select at least one file");
            return;
        }

        if (!token || !workspaceId) {
            setUploadError("Not authenticated");
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            const formData = new FormData();
            files.forEach((file) => formData.append("files", file));
            formData.append("workspace_id", workspaceId);
            formData.append("auto_process", "true");

            const res = await fetch(`${BACKEND_URL}/files/upload`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData,
            });

            if (!res.ok) {
                if (res.status === 401) {
                    handleLogout();
                    return;
                }
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || `Upload failed with status ${res.status}`);
            }

            const data = await res.json();
            setUploading(false);
            setUploaded(true);
            setMessages([{ role: "assistant", content: `Great! I've processed "${files[0].name}". ${data.message}. You can now ask me anything about its contents.` }]);

        } catch (error: any) {
            console.error("Upload error:", error);
            setUploadError(error.message || "Upload failed");
            setUploading(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || !workspaceId) return;

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch(`${BACKEND_URL}/chat/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    workspace_id: workspaceId,
                    message: input,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || "Chat query failed");
            }

            const data = await res.json();
            setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        } catch (error: any) {
            console.error("Chat error:", error);
            setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${error.message}. Make sure documents are uploaded and processed.` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (isCheckingAuth) {
        return (
            <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="animate-spin" style={{ width: '2rem', height: '2rem', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '9999px', margin: '0 auto 1rem' }} />
                    <p style={{ color: '#a3a3a3' }}>Loading...</p>
                </div>
            </div>
        );
    }

    const isReady = token && workspaceId;

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
            {/* Background Ambience */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'rgba(30,58,138,0.1)', borderRadius: '9999px', filter: 'blur(120px)' }} />
                <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'rgba(88,28,135,0.1)', borderRadius: '9999px', filter: 'blur(120px)' }} />
            </div>

            {/* Header */}
            <header style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
                <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem', height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
                        <img src="/logo.png" alt="Logo" style={{ width: '2rem', height: '2rem', objectFit: 'contain' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', letterSpacing: '-0.025em', color: 'rgba(255,255,255,0.9)' }}>DocuMind</span>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {userEmail && (
                            <span style={{ fontSize: '0.75rem', color: '#a3a3a3' }}>{userEmail}</span>
                        )}
                        <button
                            onClick={handleLogout}
                            style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main style={{ position: 'relative', zIndex: 10, paddingTop: '6rem', paddingBottom: '2rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
                <div style={{ maxWidth: '56rem', margin: '0 auto' }}>

                    {/* Title */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
                            {uploaded ? 'Ask Your Documents' : 'Upload & Chat'}
                        </h1>
                        <p style={{ fontSize: '1rem', color: '#a3a3a3' }}>
                            {uploaded ? 'Your knowledge base is ready. Start asking questions.' : 'Upload documents and chat with their contents using AI.'}
                        </p>
                    </div>

                    {/* Error Banner */}
                    {uploadError && (
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', textAlign: 'center' }}>
                            <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{uploadError}</p>
                        </div>
                    )}

                    {/* Two Column Layout */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="md:grid-cols-2">

                        {/* Upload Section */}
                        <div className="glass-card" style={{ borderRadius: '1rem', padding: '1.5rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                Documents
                            </h2>

                            <label style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                height: '10rem',
                                borderRadius: '0.75rem',
                                border: files.length > 0 ? '2px dashed rgba(59,130,246,0.5)' : '2px dashed #333',
                                background: files.length > 0 ? 'rgba(59,130,246,0.05)' : 'transparent',
                                cursor: uploaded ? 'default' : 'pointer',
                                transition: 'all 0.3s',
                                opacity: uploaded ? 0.6 : 1
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                    <div style={{
                                        width: '3rem', height: '3rem', marginBottom: '0.75rem', borderRadius: '9999px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: files.length > 0 || uploaded ? 'rgba(59,130,246,0.2)' : '#262626',
                                        color: files.length > 0 || uploaded ? '#60a5fa' : '#a3a3a3'
                                    }}>
                                        {uploaded ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: '#d4d4d4' }}>
                                        {uploaded ? `${files.length} file(s) loaded` : files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload'}
                                    </p>
                                    <p style={{ fontSize: '0.7rem', color: '#737373' }}>PDF (Max 10MB)</p>
                                </div>
                                {!uploaded && <input type="file" style={{ display: 'none' }} accept=".pdf" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />}
                            </label>

                            {files.length > 0 && !uploaded && (
                                <button
                                    onClick={uploadFiles}
                                    disabled={uploading || !isReady}
                                    className="shiny-cta"
                                    style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: uploading || !isReady ? 0.5 : 1, cursor: uploading || !isReady ? 'not-allowed' : 'pointer' }}
                                >
                                    {uploading ? 'Processing...' : 'Process Documents'}
                                </button>
                            )}

                            {uploaded && (
                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                    <span style={{ fontSize: '0.8rem', color: '#22c55e' }}>Ready to chat!</span>
                                </div>
                            )}
                        </div>

                        {/* Chat Section */}
                        <div className="glass-card" style={{ borderRadius: '1rem', padding: '1.5rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', minHeight: '24rem' }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                Chat
                            </h2>

                            {/* Messages Area */}
                            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '16rem' }}>
                                {messages.length === 0 && (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#525252' }}>
                                        <p style={{ fontSize: '0.875rem' }}>
                                            {uploaded ? 'Ask me anything about your documents!' : 'Upload documents first to start chatting.'}
                                        </p>
                                    </div>
                                )}
                                {messages.map((m, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                        <div style={{
                                            padding: '0.75rem 1rem', borderRadius: '0.75rem', maxWidth: '85%', fontSize: '0.875rem', lineHeight: 1.6,
                                            background: m.role === 'user' ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                                            color: m.role === 'user' ? '#fff' : '#d4d4d4'
                                        }}>
                                            {m.role === 'user' ? m.content : renderMarkdown(m.content)}
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.08)', color: '#737373', fontSize: '0.875rem' }}>
                                            <span className="animate-pulse">Thinking...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={!uploaded || loading}
                                    placeholder={uploaded ? "Ask something..." : "Upload documents first..."}
                                    style={{
                                        flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem',
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#fff', outline: 'none', transition: 'border 0.2s',
                                        opacity: !uploaded ? 0.5 : 1
                                    }}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!uploaded || loading || !input.trim()}
                                    style={{
                                        padding: '0.75rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500,
                                        background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer',
                                        opacity: !uploaded || loading || !input.trim() ? 0.5 : 1,
                                        transition: 'opacity 0.2s'
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
