"use client";
import { useState } from "react";
import Link from "next/link";

export default function Chat() {
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("https://your-backend.com/chat/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    workspace_id: "YOUR_WORKSPACE_ID",
                    message: input,
                }),
            });

            const data = await res.json();
            setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        } catch (error) {
            setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
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

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 p-6 flex flex-col transition-colors">
            <div className="max-w-3xl mx-auto w-full flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-primary dark:text-blue-300">
                        Chat with AI
                    </h2>
                    <Link href="/documents" className="text-sm text-gray-500 hover:text-primary dark:text-gray-400">
                        ← Back to Documents
                    </Link>
                </div>

                <div className="flex-grow overflow-y-auto space-y-4 mb-4 min-h-[400px] bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    {messages.length === 0 && (
                        <p className="text-gray-400 dark:text-gray-500 text-center mt-20">
                            Ask me anything about your documents!
                        </p>
                    )}
                    {messages.map((m, i) => (
                        <div
                            key={i}
                            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <p
                                className={`px-4 py-2 rounded-lg max-w-[70%] ${m.role === "user"
                                        ? "bg-primary text-white"
                                        : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
                                    }`}
                            >
                                {m.content}
                            </p>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <p className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                Thinking...
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-grow border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Ask something..."
                        disabled={loading}
                    />
                    <button
                        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
