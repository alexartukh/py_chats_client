import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TOPICS_URL, getJson } from '../api.js'

export default function TopicsList() {
  const navigate = useNavigate()
  const [topics, setTopics] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getJson(TOPICS_URL)
      .then(setTopics)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h2>Темы</h2>
      {loading && <p>Загрузка...</p>}
      {error && <p className="error">Ошибка: {error}</p>}
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Автор</th>
            <th>Создана</th>
          </tr>
        </thead>
        <tbody>
          {topics.map((topic) => (
            <tr
              key={topic.topic_id}
              className="clickable-row"
              onClick={() => navigate(`/topic/${topic.topic_id}`)}
            >
              <td>{topic.topic_id}</td>
              <td>{topic.title}</td>
              <td>{topic.created_by_user__login}</td>
              <td>{topic.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
