'use client'

import { useState, useEffect } from 'react'
import './customize.css'

interface ChatbotSettings {
  bot_name: string
  primary_color: string
  chat_position: 'left' | 'right'
  welcome_message: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ChatbotCustomizePage() {
  const [workspaceId, setWorkspaceId] = useState<string>('')
  const [accessToken, setAccessToken] = useState<string>('')
  const [settings, setSettings] = useState<ChatbotSettings>({
    bot_name: 'AI Assistant',
    primary_color: '#3b82f6',
    chat_position: 'right',
    welcome_message: 'Hi! How can I assist you?'
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Load settings on mount if workspace ID is available
  useEffect(() => {
    const storedWorkspaceId = localStorage.getItem('workspace_id')
    const storedToken = localStorage.getItem('access_token')
    
    if (storedWorkspaceId) {
      setWorkspaceId(storedWorkspaceId)
    }
    if (storedToken) {
      setAccessToken(storedToken)
    }
  }, [])

  // Fetch current settings
  const fetchSettings = async () => {
    if (!workspaceId) {
      setMessage({ type: 'error', text: 'Please enter a workspace ID' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`${API_URL}/chatbot/settings/${workspaceId}`, {
        headers: accessToken ? {
          'Authorization': `Bearer ${accessToken}`
        } : {}
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`)
      }

      const data = await response.json()
      setSettings(data)
      setMessage({ type: 'success', text: 'Settings loaded successfully' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  // Save settings
  const saveSettings = async () => {
    if (!workspaceId) {
      setMessage({ type: 'error', text: 'Please enter a workspace ID' })
      return
    }

    if (!accessToken) {
      setMessage({ type: 'error', text: 'Access token required. Please login first.' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`${API_URL}/chatbot/settings/${workspaceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || `Failed to save: ${response.statusText}`)
      }

      const data = await response.json()
      setSettings(data)
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="customize-container">
      <div className="customize-header">
        <h1>🤖 Chatbot Customization</h1>
        <p>Customize your embeddable chat widget appearance and behavior</p>
      </div>

      <div className="customize-content">
        <div className="customize-form-section">
          <div className="form-group">
            <label htmlFor="workspace-id">Workspace ID *</label>
            <input
              id="workspace-id"
              type="text"
              value={workspaceId}
              onChange={(e) => {
                setWorkspaceId(e.target.value)
                localStorage.setItem('workspace_id', e.target.value)
              }}
              placeholder="Enter your workspace UUID"
            />
            <button onClick={fetchSettings} disabled={loading || !workspaceId}>
              {loading ? 'Loading...' : 'Load Settings'}
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="access-token">Access Token (JWT)</label>
            <input
              id="access-token"
              type="password"
              value={accessToken}
              onChange={(e) => {
                setAccessToken(e.target.value)
                localStorage.setItem('access_token', e.target.value)
              }}
              placeholder="Enter your JWT access token"
            />
            <small>Required for saving settings. Get it from /auth/login</small>
          </div>

          <div className="form-group">
            <label htmlFor="bot-name">Bot Name</label>
            <input
              id="bot-name"
              type="text"
              value={settings.bot_name}
              onChange={(e) => setSettings({ ...settings, bot_name: e.target.value })}
              placeholder="AI Assistant"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="primary-color">Primary Color</label>
            <div className="color-input-group">
              <input
                id="primary-color"
                type="color"
                value={settings.primary_color}
                onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
              />
              <input
                type="text"
                value={settings.primary_color}
                onChange={(e) => {
                  if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    setSettings({ ...settings, primary_color: e.target.value })
                  }
                }}
                placeholder="#3b82f6"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="chat-position">Chat Position</label>
            <select
              id="chat-position"
              value={settings.chat_position}
              onChange={(e) => setSettings({ ...settings, chat_position: e.target.value as 'left' | 'right' })}
            >
              <option value="right">Right</option>
              <option value="left">Left</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="welcome-message">Welcome Message</label>
            <textarea
              id="welcome-message"
              value={settings.welcome_message}
              onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
              placeholder="Hi! How can I assist you?"
              rows={3}
              maxLength={500}
            />
            <small>{settings.welcome_message.length}/500 characters</small>
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button 
            className="save-button" 
            onClick={saveSettings} 
            disabled={saving || !workspaceId || !accessToken}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className="preview-section">
          <h2>Preview</h2>
          <div className="preview-box">
            <div className="widget-preview" style={{ '--primary-color': settings.primary_color } as React.CSSProperties}>
              <div 
                className="preview-bubble" 
                style={{ 
                  background: settings.primary_color,
                  [settings.chat_position]: '20px'
                }}
              >
                💬
              </div>
              <div 
                className="preview-window"
                style={{ 
                  [settings.chat_position]: '20px'
                }}
              >
                <div 
                  className="preview-header"
                  style={{ background: settings.primary_color }}
                >
                  {settings.bot_name}
                </div>
                <div className="preview-messages">
                  <div className="preview-message bot">
                    {settings.welcome_message}
                  </div>
                </div>
                <div className="preview-input">
                  <input type="text" placeholder="Type your question..." disabled />
                  <button disabled>Send</button>
                </div>
              </div>
            </div>
          </div>

          <div className="embed-code-section">
            <h3>Embed Code</h3>
            <pre>
              <code>{`<script src="${API_URL}/widget/widget.js"
        data-workspace-id="${workspaceId || 'YOUR_WORKSPACE_ID'}"
        data-api-url="${API_URL}"
        async>
</script>`}</code>
            </pre>
            <button 
              className="copy-button"
              onClick={() => {
                const code = `<script src="${API_URL}/widget/widget.js"
        data-workspace-id="${workspaceId || 'YOUR_WORKSPACE_ID'}"
        data-api-url="${API_URL}"
        async>
</script>`
                navigator.clipboard.writeText(code)
                setMessage({ type: 'success', text: 'Embed code copied to clipboard!' })
              }}
            >
              Copy Embed Code
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

