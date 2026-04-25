import React from 'react'
import { Message, SourceHit } from '../types'

export const Thinking: React.FC = () => (
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-75" />
    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150" />
  </div>
)

const Sources: React.FC<{ sources?: SourceHit[]; elapsed?: string; fromAPI?: boolean }> = ({ sources, elapsed, fromAPI }) => {
  if (!sources || sources.length === 0) return <div className="text-xs text-gray-500 mt-2">⏱ {elapsed}s{fromAPI ? ' · via API' : ''}</div>
  return (
    <div className="mt-2 text-xs text-gray-700">
      <div className="flex items-center gap-2 text-blue-600 font-mono">📎 {sources.map((s, i) => (
        <span key={i} className="bg-gray-100 px-2 py-1 rounded text-xs border">{s.documentName} p.{s.pageNumber}</span>
      ))}</div>
      <div className="text-xs text-gray-500 mt-1">⏱ {elapsed}s{fromAPI ? ' · via API' : ''}</div>
    </div>
  )
}

const ChatBubble: React.FC<{ msg: Message; side?: 'user' | 'bot'; sources?: SourceHit[]; elapsed?: string; fromAPI?: boolean }> = ({ msg, side = 'bot', sources, elapsed, fromAPI }) => {
  const isUser = side === 'user'
  return (
    <div className={`msg ${side}`}>
      <div className={`msg-avatar ${side}`}>{isUser ? 'OP' : 'B'}</div>
      <div>
        <div className="msg-bubble">
          <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
          {sources && <Sources sources={sources} elapsed={elapsed} fromAPI={fromAPI} />}
        </div>
        <div className="msg-time">{new Date(msg.timestamp || Date.now()).toLocaleTimeString()}</div>
      </div>
    </div>
  )
}

export default ChatBubble
