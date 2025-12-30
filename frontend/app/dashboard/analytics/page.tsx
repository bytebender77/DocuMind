'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import './analytics.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface AnalyticsSummary {
  total_messages: number
  messages_today: number
  context_success_rate: number
  top_questions: string[]
}

interface DailyMessageCount {
  date: string
  count: number
}

interface MessagesPerDay {
  data: DailyMessageCount[]
}

// SWR fetcher function
const fetcher = async (url: string, token: string) => {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

export default function AnalyticsPage() {
  const [workspaceId, setWorkspaceId] = useState<string>('')
  const [accessToken, setAccessToken] = useState<string>('')
  const [days, setDays] = useState<number>(30)
  const [error, setError] = useState<string | null>(null)

  // Load from localStorage on mount
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

  // Fetch analytics summary
  const { data: summary, error: summaryError, isLoading: summaryLoading } = useSWR<AnalyticsSummary>(
    workspaceId && accessToken
      ? [`${API_URL}/analytics/summary/${workspaceId}`, accessToken]
      : null,
    ([url, token]: [string, string]) => fetcher(url, token),
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true
    }
  )

  // Fetch messages per day
  const { data: messagesPerDay, error: messagesError, isLoading: messagesLoading } = useSWR<MessagesPerDay>(
    workspaceId && accessToken
      ? [`${API_URL}/analytics/messages-per-day/${workspaceId}?days=${days}`, accessToken]
      : null,
    ([url, token]: [string, string]) => fetcher(url, token),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true
    }
  )

  // Handle errors
  useEffect(() => {
    if (summaryError || messagesError) {
      setError(summaryError?.message || messagesError?.message || 'Failed to load analytics')
    } else {
      setError(null)
    }
  }, [summaryError, messagesError])

  if (!workspaceId || !accessToken) {
    return (
      <div className="analytics-container">
        <div className="analytics-header">
          <h1>📊 Analytics Dashboard</h1>
        </div>
        <div className="analytics-setup">
          <div className="setup-form">
            <h2>Setup Required</h2>
            <div className="form-group">
              <label htmlFor="workspace-id-analytics">Workspace ID *</label>
              <input
                id="workspace-id-analytics"
                type="text"
                value={workspaceId}
                onChange={(e) => {
                  setWorkspaceId(e.target.value)
                  localStorage.setItem('workspace_id', e.target.value)
                }}
                placeholder="Enter your workspace UUID"
              />
            </div>
            <div className="form-group">
              <label htmlFor="access-token-analytics">Access Token (JWT) *</label>
              <input
                id="access-token-analytics"
                type="password"
                value={accessToken}
                onChange={(e) => {
                  setAccessToken(e.target.value)
                  localStorage.setItem('access_token', e.target.value)
                }}
                placeholder="Enter your JWT access token"
              />
              <small>Get it from /auth/login endpoint</small>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>📊 Analytics Dashboard</h1>
        <div className="header-controls">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="days-selector"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="analytics-cards">
        <div className="analytics-card">
          <div className="card-icon">💬</div>
          <div className="card-content">
            <h3>Total Messages</h3>
            <p className="card-value">
              {summaryLoading ? '...' : summary?.total_messages.toLocaleString() || 0}
            </p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <h3>Messages Today</h3>
            <p className="card-value">
              {summaryLoading ? '...' : summary?.messages_today.toLocaleString() || 0}
            </p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <h3>Context Success Rate</h3>
            <p className="card-value">
              {summaryLoading ? '...' : `${summary?.context_success_rate.toFixed(1) || 0}%`}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Per Day Chart */}
      <div className="analytics-chart-section">
        <h2>Messages Per Day</h2>
        {messagesLoading ? (
          <div className="loading">Loading chart data...</div>
        ) : messagesPerDay?.data ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={messagesPerDay.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getMonth() + 1}/${date.getDate()}`
                }}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data">No data available for the selected period</div>
        )}
      </div>

      {/* Top Questions Table */}
      <div className="analytics-table-section">
        <h2>Top 10 Questions</h2>
        {summaryLoading ? (
          <div className="loading">Loading top questions...</div>
        ) : summary?.top_questions && summary.top_questions.length > 0 ? (
          <div className="questions-table">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Question</th>
                </tr>
              </thead>
              <tbody>
                {summary.top_questions.map((question, index) => (
                  <tr key={index}>
                    <td className="rank-cell">{index + 1}</td>
                    <td className="question-cell">{question}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">No questions logged yet</div>
        )}
      </div>
    </div>
  )
}

