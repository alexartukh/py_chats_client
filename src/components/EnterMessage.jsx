import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { CAPTCHA_URL } from '../api.js'

// Модальный диалог ввода сообщения.
// Пропсы:
//   parentMessageId                                                       — message_id сообщения, на которое пишется ответ;
//                                                                           null — новое корневое сообщение
//   onSubmit({ parent_message_id, login, email, home_page, captcha, text }) — вызывается по кнопке "Отправить"
//   onClose()                                                             — вызывается по кнопке "Отмена" и по клику на затемнённый фон
// Диалог открывается только для вошедшего пользователя (см. TopicPage).
// Логин и email берутся из AuthContext, показываются текстом и передаются через hidden-инпуты.
// Значения всех полей на отправке берутся из формы по атрибуту name (FormData), а не из state.
// Обязательные поля помечены атрибутом required — браузер не даст отправить форму, пока они пустые.
export default function EnterMessage({ parentMessageId, onSubmit, onClose }) {
  const { userLogin, userEmail } = useAuth()

  const [error, setError] = useState(null)

  // onSubmit может вернуть Promise; если он завершится ошибкой, её текст показывается в диалоге
  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.target)
    // hidden-инпут хранит только строки: при parentMessageId = null в нём пустая строка, иначе "5".
    // Здесь пустая строка явно превращается обратно в null, а остальное — в число.
    const parentMessageIdString = formData.get('parent_message_id')
    let parentMessageIdValue = null
    if (parentMessageIdString !== '') {
      parentMessageIdValue = Number(parentMessageIdString)
    }
    try {
      await onSubmit({
        parent_message_id: parentMessageIdValue,
        login: formData.get('login'),
        email: formData.get('email'),
        home_page: formData.get('home_page'),
        captcha: formData.get('captcha'),
        text: formData.get('text'),
      })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* stopPropagation: клик внутри окна не должен закрывать диалог */}
      <form className="modal-window" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="message-header">
          {parentMessageId === null ? 'Новое сообщение' : `Ответ на сообщение #${parentMessageId}`}
          <input
            type="hidden"
            name="parent_message_id"
            value={parentMessageId === null ? '' : parentMessageId}
          />
        </div>

        <label className="form-field">
          <span>Логин <span className="required-mark">*</span></span>
          <b>{userLogin}</b>
          <input type="hidden" name="login" value={userLogin} />
        </label>

        <label className="form-field">
          <span>Email <span className="required-mark">*</span></span>
          <span>{userEmail}</span>
          <input type="hidden" name="email" value={userEmail} />
        </label>

        <label className="form-field">
          <span>Home Page</span>
          <input type="url" name="home_page" required={false} />
        </label>

        <label className="form-field">
          <span>CAPTCHA <span className="required-mark">*</span></span>
          <div className="captcha-row">
            <input type="text" name="captcha" required={true} />
            <img src={CAPTCHA_URL} alt="CAPTCHA" />
          </div>
        </label>

        <label className="form-field">
          <span>Текст <span className="required-mark">*</span></span>
          <textarea name="text" rows={6} required={true} />
        </label>

        {error && <p className="error">Ошибка: {error}</p>}

        <div className="modal-buttons">
          <button type="button" onClick={onClose}>Отмена</button>
          <button type="submit">Отправить</button>
        </div>
      </form>
    </div>
  )
}
