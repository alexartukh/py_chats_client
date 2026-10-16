import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createNewTopic } from '../api.js'

export default function CreateTopicPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      await createNewTopic(title)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <h2>Новая тема</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Название темы"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit">Создать</button>
      </form>
      {error && <p className="error">Ошибка: {error}</p>}
    </div>
  )
}
