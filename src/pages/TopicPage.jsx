import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getMessages } from '../api.js'

export default function TopicPage() {
  // topicId берётся из адреса /topic/:topicId (см. App.jsx)
  const { topicId } = useParams()
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getMessages(topicId)
      .then(setMessages)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [topicId])

  return (
    <div className="column">
      <h2>Тема #{topicId}</h2>
      {loading && <p>Загрузка...</p>}
      {error && <p className="error">Ошибка: {error}</p>}
      {messages.map((message) => (
        // depth: 0 — сообщение верхнего уровня, 1 — ответ на него и т.д. Отступ 20px на каждый уровень
        <div
          key={message.message_id}
          className="message-plate"
          style={{ marginLeft: `${message.depth * 20}px` }}
        >
          <div className="message-header">
            <b>{message.user__login}</b> {message.created_at}
          </div>
          <div>{message.t}</div>
        </div>
      ))}
    </div>
  )
}
