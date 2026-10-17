import { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { CAPTCHA_URL } from '../api.js'
import { isMessageCorrect } from '../messageMarkup.js'

// Модальный диалог ввода сообщения.
// Пропсы:
//   parentMessageId                                                       — message_id сообщения, на которое пишется ответ;
//                                                                           null — новое корневое сообщение
//   onSubmit({ parent_message_id, login, email, home_page, captcha, text, attachment }) — вызывается по кнопке "Отправить";
//                                                                           attachment — объект File или null, если файл не выбран
//   onClose()                                                             — вызывается по кнопке "Отмена" и по клику на затемнённый фон
// Диалог открывается только для вошедшего пользователя (см. TopicPage).
// Логин и email берутся из AuthContext, показываются текстом и передаются через hidden-инпуты.
// Значения всех полей на отправке берутся из формы по атрибуту name (FormData), а не из state.
// Обязательные поля помечены атрибутом required — браузер не даст отправить форму, пока они пустые.
export default function EnterMessage({ parentMessageId, onSubmit, onClose }) {
  const { userLogin, userEmail } = useAuth()

  const [error, setError] = useState(null)
  // Текст из textarea для правой части (предпросмотр). textarea остаётся неуправляемой (без value),
  // на отправке текст по-прежнему берётся из формы через FormData; этот state только для показа справа
  const [previewText, setPreviewText] = useState('')
  // Результат isMessageCorrect для previewText: true — предпросмотр показывается как HTML, false — ошибка
  const [isPreviewValid, setIsPreviewValid] = useState(true)
  // Ссылка на DOM-элемент textarea: нужна, чтобы узнать позицию курсора/выделение и вставить теги
  const textareaRef = useRef(null)

  // Вызывается после каждого изменения текста (ввод в textarea и кнопки тегов):
  // сохраняет текст для предпросмотра и проверяет его разметку
  function updatePreview(text) {
    setPreviewText(text)
    setIsPreviewValid(isMessageCorrect(text))
  }

  // Вставляет openTag и closeTag в textarea:
  //   - если текст выделен — окружает его тегами, и обёрнутый текст остаётся выделенным;
  //   - если нет — вставляет пару тегов в позицию курсора, и курсор встаёт между ними.
  // value у textarea меняется напрямую, onChange при этом не срабатывает, поэтому предпросмотр обновляется явно.
  function insertTags(openTag, closeTag) {
    const textarea = textareaRef.current
    const text = textarea.value
    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd

    const before = text.substring(0, selectionStart)
    const selected = text.substring(selectionStart, selectionEnd)
    const after = text.substring(selectionEnd)

    textarea.value = before + openTag + selected + closeTag + after

    const newSelectionStart = selectionStart + openTag.length
    const newSelectionEnd = newSelectionStart + selected.length
    textarea.focus()
    textarea.setSelectionRange(newSelectionStart, newSelectionEnd)

    updatePreview(textarea.value)
  }

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
    // Если файл не выбран, FormData всё равно отдаёт пустой File с name === '' и size === 0.
    // Здесь он явно превращается в null.
    const attachmentFile = formData.get('attachment')
    let attachmentValue = null
    if (attachmentFile.name !== '') {
      attachmentValue = attachmentFile
    }
    try {
      await onSubmit({
        parent_message_id: parentMessageIdValue,
        login: formData.get('login'),
        email: formData.get('email'),
        home_page: formData.get('home_page'),
        captcha: formData.get('captcha'),
        text: formData.get('text'),
        attachment: attachmentValue,
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

        {/* Слева — ввод текста, справа — предпросмотр только для чтения */}
        <div className="text-with-preview">
          <label className="form-field">
            <span>Текст <span className="required-mark">*</span></span>
            {/* Кнопки разрешённых тегов (по ТЗ). type="button" — чтобы клик не отправлял форму */}
            <div className="tag-buttons">
              <button type="button" onClick={() => insertTags('<i>', '</i>')}>[i]</button>
              <button type="button" onClick={() => insertTags('<strong>', '</strong>')}>[strong]</button>
              <button type="button" onClick={() => insertTags('<code>', '</code>')}>[code]</button>
              <button type="button" onClick={() => insertTags('<a href="" title="">', '</a>')}>[a]</button>
            </div>
            <textarea
              ref={textareaRef}
              name="text"
              rows={6}
              required={true}
              onChange={(e) => updatePreview(e.target.value)}
            />
          </label>

          <div className="form-field">
            <span>Предпросмотр</span>
            {/* dangerouslySetInnerHTML — только когда isMessageCorrect вернула true:
                тогда в тексте нет ничего, кроме разрешённых тегов (см. messageMarkup.js) */}
            {isPreviewValid ? (
              <div className="message-preview" dangerouslySetInnerHTML={{ __html: previewText }} />
            ) : (
              <div className="message-preview">
                <span className="error">Ошибка в разметке: разрешены только &lt;i&gt;, &lt;strong&gt;, &lt;code&gt; и &lt;a href="" title=""&gt;, все теги должны быть закрыты</span>
              </div>
            )}
          </div>
        </div>

        {/* accept — только подсказка для окна выбора файла (по ТЗ: JPG, GIF, PNG, TXT), это не проверка */}
        <label className="form-field">
          <span>Файл</span>
          <input
            type="file"
            name="attachment"
            accept=".jpg,.jpeg,.gif,.png,.txt"
            required={false}
          />
        </label>

        {error && <p className="error">Ошибка: {error}</p>}

        <div className="modal-buttons">
          <button type="button" onClick={onClose}>Отмена</button>
          <button type="submit" className="primary-button">Отправить</button>
        </div>
      </form>
    </div>
  )
}
