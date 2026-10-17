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
    <div className="column">
      <h2>Новая тема</h2>
      {/* Оформление как у формы сообщения (EnterMessage): подпись над полем, * у обязательных, кнопка справа */}
      <form className="entry-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Название темы <span className="required-mark">*</span></span>
          <input
            type="text"
            name="title"
            required={true}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        {error && <p className="error">Ошибка: {error}</p>}

        <div className="form-buttons">
          <button type="submit" className="primary-button">Создать</button>
        </div>
      </form>
    </div>
  )
}
