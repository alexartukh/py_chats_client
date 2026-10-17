import { useAuth } from '../context/AuthContext.jsx'
import { CAPTCHA_URL } from '../api.js'

// Модальный диалог ввода сообщения.
// Пропсы:
//   onSubmit({ login, email, home_page, captcha, text }) — вызывается по кнопке "Отправить"
//   onClose()                                           — вызывается по кнопке "Отмена" и по клику на затемнённый фон
// Если пользователь вошёл (есть token в AuthContext) — логин и email берутся из AuthContext,
// показываются текстом и передаются через hidden-инпуты.
// Если не вошёл — логин и email вводятся в поля.
// Значения всех полей на отправке берутся из формы по атрибуту name (FormData), а не из state.
// Обязательные поля помечены атрибутом required — браузер не даст отправить форму, пока они пустые.
export default function EnterMessage({ onSubmit, onClose }) {
  const { token, userLogin, userEmail } = useAuth()

  function handleSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    onSubmit({
      login: formData.get('login'),
      email: formData.get('email'),
      home_page: formData.get('home_page'),
      captcha: formData.get('captcha'),
      text: formData.get('text'),
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* stopPropagation: клик внутри окна не должен закрывать диалог */}
      <form className="modal-window" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Логин <span className="required-mark">*</span></span>
          {token ? (
            <>
              <b>{userLogin}</b>
              <input type="hidden" name="login" value={userLogin} />
            </>
          ) : (
            <input type="text" name="login" required={true} />
          )}
        </label>

        <label className="form-field">
          <span>Email <span className="required-mark">*</span></span>
          {token ? (
            <>
              <span>{userEmail}</span>
              <input type="hidden" name="email" value={userEmail} />
            </>
          ) : (
            <input type="email" name="email" required={true} />
          )}
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

        <div className="modal-buttons">
          <button type="button" onClick={onClose}>Отмена</button>
          <button type="submit">Отправить</button>
        </div>
      </form>
    </div>
  )
}
