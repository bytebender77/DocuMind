/**
 * Embeddable Chat Widget for RAG-Powered AI Assistant
 * 
 * Usage:
 * <script src="https://your-backend.com/widget.js"
 *         data-workspace-id="WORKSPACE_UUID"
 *         data-api-url="https://your-backend.com"
 *         async>
 * </script>
 */

(function() {
    'use strict';

    // Get configuration from script tag
    const script = document.currentScript || document.querySelector('script[data-workspace-id]');
    if (!script) {
        console.error('Chat widget: Script tag not found');
        return;
    }

    const workspaceId = script.getAttribute('data-workspace-id');
    const apiUrl = script.getAttribute('data-api-url') || window.location.origin;

    if (!workspaceId) {
        console.error('Chat widget: data-workspace-id attribute is required');
        return;
    }

    // Widget state
    let isOpen = false;
    let messageHistory = [];
    let widgetSettings = {
        bot_name: "AI Assistant",
        primary_color: "#3b82f6",
        chat_position: "right",
        welcome_message: "Hi! How can I assist you?"
    };

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'rag-chat-widget';
    document.body.appendChild(widgetContainer);

    // Inject CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = `${apiUrl}/widget/widget.css`;
    document.head.appendChild(cssLink);

    // Create chat bubble button
    const bubbleButton = document.createElement('button');
    bubbleButton.className = 'rag-chat-bubble';
    bubbleButton.innerHTML = '💬';
    bubbleButton.setAttribute('aria-label', 'Open chat');
    bubbleButton.title = 'Ask AI Assistant';

    // Create chat window
    const chatWindow = document.createElement('div');
    chatWindow.className = 'rag-chat-window';
    chatWindow.style.display = 'none';

    // Chat header
    const chatHeader = document.createElement('div');
    chatHeader.className = 'rag-chat-header';
    chatHeader.innerHTML = `
        <span class="rag-chat-title">Ask AI Assistant</span>
        <button class="rag-chat-close" aria-label="Close chat">×</button>
    `;

    // Messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'rag-chat-messages';
    messagesContainer.id = 'rag-chat-messages';

    // Input container
    const inputContainer = document.createElement('div');
    inputContainer.className = 'rag-chat-input-container';
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.className = 'rag-chat-input';
    inputField.placeholder = 'Type your question...';
    inputField.setAttribute('aria-label', 'Message input');
    
    const sendButton = document.createElement('button');
    sendButton.className = 'rag-chat-send';
    sendButton.innerHTML = 'Send';
    sendButton.setAttribute('aria-label', 'Send message');

    inputContainer.appendChild(inputField);
    inputContainer.appendChild(sendButton);

    // Assemble chat window
    chatWindow.appendChild(chatHeader);
    chatWindow.appendChild(messagesContainer);
    chatWindow.appendChild(inputContainer);

    // Assemble widget
    widgetContainer.appendChild(bubbleButton);
    widgetContainer.appendChild(chatWindow);

    // Apply widget settings to UI
    function applyWidgetSettings() {
        // Apply primary color to bubble button
        if (bubbleButton) {
            bubbleButton.style.background = widgetSettings.primary_color;
        }
        
        // Apply primary color to chat header
        if (chatHeader) {
            chatHeader.style.background = widgetSettings.primary_color;
        }
        
        // Apply bot name to chat header
        const titleElement = chatHeader.querySelector('.rag-chat-title');
        if (titleElement) {
            titleElement.textContent = widgetSettings.bot_name;
        }
        
        // Apply chat position
        if (widgetSettings.chat_position === 'left') {
            widgetContainer.style.left = '20px';
            widgetContainer.style.right = 'auto';
            chatWindow.style.left = '20px';
            chatWindow.style.right = 'auto';
        } else {
            widgetContainer.style.right = '20px';
            widgetContainer.style.left = 'auto';
            chatWindow.style.right = '20px';
            chatWindow.style.left = 'auto';
        }
    }

    // Fetch widget settings from backend
    async function fetchWidgetSettings() {
        try {
            const response = await fetch(`${apiUrl}/chatbot/settings/${workspaceId}`);
            if (response.ok) {
                const settings = await response.json();
                widgetSettings = {
                    bot_name: settings.bot_name || "AI Assistant",
                    primary_color: settings.primary_color || "#3b82f6",
                    chat_position: settings.chat_position || "right",
                    welcome_message: settings.welcome_message || "Hi! How can I assist you?"
                };
                applyWidgetSettings();
            }
        } catch (error) {
            console.warn('Chat widget: Could not fetch settings, using defaults', error);
            // Apply defaults even if fetch fails
            applyWidgetSettings();
        }
    }

    // Add welcome message
    function addWelcomeMessage() {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'rag-message rag-message-bot';
        welcomeDiv.innerHTML = `
            <div class="rag-message-content">
                <p>${escapeHtml(widgetSettings.welcome_message)}</p>
            </div>
        `;
        messagesContainer.appendChild(welcomeDiv);
        scrollToBottom();
    }

    // Add message to chat
    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `rag-message ${isUser ? 'rag-message-user' : 'rag-message-bot'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'rag-message-content';
        
        if (isUser) {
            contentDiv.innerHTML = `<p>${escapeHtml(text)}</p>`;
        } else {
            // Format bot response (preserve line breaks)
            const formattedText = escapeHtml(text).replace(/\n/g, '<br>');
            contentDiv.innerHTML = `<p>${formattedText}</p>`;
        }
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    // Add loading indicator
    function addLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'rag-message rag-message-bot rag-loading';
        loadingDiv.id = 'rag-loading-indicator';
        loadingDiv.innerHTML = `
            <div class="rag-message-content">
                <div class="rag-typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        messagesContainer.appendChild(loadingDiv);
        scrollToBottom();
    }

    // Remove loading indicator
    function removeLoadingIndicator() {
        const loading = document.getElementById('rag-loading-indicator');
        if (loading) {
            loading.remove();
        }
    }

    // Show error message
    function showError(message = 'Assistant unavailable. Please try again.') {
        removeLoadingIndicator();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'rag-message rag-message-error';
        errorDiv.innerHTML = `
            <div class="rag-message-content">
                <p>❌ ${escapeHtml(message)}</p>
            </div>
        `;
        messagesContainer.appendChild(errorDiv);
        scrollToBottom();
    }

    // Scroll to bottom of messages
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Send message to backend
    async function sendMessage(message) {
        if (!message.trim()) {
            return;
        }

        // Add user message
        addMessage(message, true);
        messageHistory.push({ role: 'user', content: message });

        // Show loading
        addLoadingIndicator();
        sendButton.disabled = true;
        inputField.disabled = true;

        try {
            const response = await fetch(`${apiUrl}/chat/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    workspace_id: workspaceId,
                    message: message
                })
            });

            removeLoadingIndicator();

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(errorData.detail || `HTTP ${response.status}`);
            }

            const data = await response.json();
            
            // Handle no context case
            if (data.chunks_count === 0 || 
                data.reply.includes("don't have any relevant information") ||
                data.reply.includes("Information not available")) {
                addMessage("I don't have information about that in the documents. Please make sure documents are uploaded and processed in this workspace.");
            } else {
                addMessage(data.reply);
                messageHistory.push({ role: 'assistant', content: data.reply });
            }

        } catch (error) {
            console.error('Chat widget error:', error);
            showError(error.message || 'Failed to get response. Please try again.');
        } finally {
            sendButton.disabled = false;
            inputField.disabled = false;
            inputField.focus();
        }
    }

    // Toggle chat window
    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
            chatWindow.style.display = 'flex';
            inputField.focus();
            if (messageHistory.length === 0) {
                addWelcomeMessage();
            }
        } else {
            chatWindow.style.display = 'none';
        }
    }

    // Event listeners
    bubbleButton.addEventListener('click', toggleChat);
    chatHeader.querySelector('.rag-chat-close').addEventListener('click', toggleChat);
    
    sendButton.addEventListener('click', () => {
        const message = inputField.value.trim();
        if (message) {
            inputField.value = '';
            sendMessage(message);
        }
    });

    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const message = inputField.value.trim();
            if (message) {
                inputField.value = '';
                sendMessage(message);
            }
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) {
            toggleChat();
        }
    });

    // Initialize: Apply default settings first, then fetch and update
    applyWidgetSettings();
    fetchWidgetSettings();
})();


