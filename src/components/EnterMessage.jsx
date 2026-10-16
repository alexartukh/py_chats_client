import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

// Модальный диалог ввода сообщения.
// Пропсы:
//   onSubmit(text) — вызывается по кнопке "Отправить" с введённым текстом
//   onClose()      — вызывается по кнопке "Отмена" и по клику на затемнённый фон
// Имя текущего пользователя берётся из AuthContext (userLogin).
export default function EnterMessage({ onSubmit, onClose }) {
  const { userLogin } = useAuth()
  const [text, setText] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(text)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* stopPropagation: клик внутри окна не должен закрывать диалог */}
      <form className="modal-window" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="message-header">
          <b>{userLogin}</b>
        </div>
        <textarea
          name="text"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="modal-buttons">
          <button type="button" onClick={onClose}>Отмена</button>
          <button type="submit">Отправить</button>
        </div>
      </form>
    </div>
  )
}
