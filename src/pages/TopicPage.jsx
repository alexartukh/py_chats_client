import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getTopic, getMessages, createNewMessage, deleteExistingMessage } from '../api.js'
import EnterMessage from '../components/EnterMessage.jsx'
import MessageAttachment from '../components/MessageAttachment.jsx'
import RootMessages from '../components/RootMessages.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { isMessageCorrect } from '../messageMarkup.js'

export default function TopicPage() {
  // topicId берётся из адреса /topic/:topicId (см. App.jsx)
  const { topicId } = useParams()
  const { token, userLogin } = useAuth()
  // Тема: {"topic_id", "title", "created_by_user__login", "created_at"}. null — ещё не загружена
  const [topic, setTopic] = useState(null)
  const [topicError, setTopicError] = useState(null)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  // Открыт ли диалог EnterMessage
  const [isEnterMessageOpen, setIsEnterMessageOpen] = useState(false)
  // message_id сообщения, на которое пишется ответ. null — новое корневое сообщение
  const [parentMessageId, setParentMessageId] = useState(null)
  // Версия таблицы корневых сообщений. Увеличивается после добавления и удаления сообщения;
  // RootMessages получает её пропом reloadVersion и при изменении загружает таблицу заново
  const [rootMessagesVersion, setRootMessagesVersion] = useState(0)

  // parentMessageId: message_id родителя или null для корневого сообщения
  function openEnterMessage(parentMessageId) {
    setParentMessageId(parentMessageId)
    setIsEnterMessageOpen(true)
  }

  function closeEnterMessage() {
    setIsEnterMessageOpen(false)
    setParentMessageId(null)
  }

  function loadMessages() {
    setLoading(true)
    setError(null)
    getMessages(topicId)
      .then(setMessages)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  // comment = { parent_message_id, login, email, home_page, captcha, text } — см. EnterMessage.
  // На сервер уходят login, email, topic_id, parent_message_id и text (как "t"); автора сервер берёт из токена.
  // home_page и captcha сервер пока не принимает.
  // topicId из адреса — строка, сервер ждёт число, поэтому Number(topicId).
  // Ошибку не ловим здесь: её покажет EnterMessage, диалог останется открытым.
  async function handleSubmitComment(comment) {
    await createNewMessage(
      comment.login,
      comment.email,
      Number(topicId),
      comment.parent_message_id,
      comment.text,
      comment.attachment,
    )
    closeEnterMessage()
    loadMessages()
    setRootMessagesVersion(rootMessagesVersion + 1)
  }

  // Удаляет сообщение (сервер удаляет и все ответы на него) и перезагружает список.
  // Ошибка показывается над списком сообщений.
  async function handleDeleteMessage(messageId) {
    // window.confirm — встроенный диалог браузера: true при "OK", false при "Отмена"
    const isConfirmed = window.confirm('Удалить сообщение и все ответы на него?')
    if (!isConfirmed) {
      return
    }
    setError(null)
    try {
      await deleteExistingMessage(messageId)
      loadMessages()
      setRootMessagesVersion(rootMessagesVersion + 1)
    } catch (err) {
      setError(err.message)
    }
  }

  function loadTopic() {
    setTopic(null)
    setTopicError(null)
    getTopic(topicId)
      .then(setTopic)
      .catch((e) => setTopicError(e.message))
  }

  useEffect(() => {
    loadTopic()
    loadMessages()
  }, [topicId])

  return (
    <div className="column">

      <h2>
        Тема #{topicId}
        {topic !== null && (
          <>
            : {topic.title}{' '}
            <span className="topic-meta">
              <b>{topic.created_by_user__login}</b> {topic.created_at}
            </span>
          </>
        )}
      </h2>

      {topicError && <p className="error">Ошибка: {topicError}</p>}

      {/* Таблица корневых сообщений; загружает их сама по topicId и заново при изменении reloadVersion */}
      <RootMessages topicId={topicId} reloadVersion={rootMessagesVersion} />

      {loading && <p>Загрузка...</p>}
      {error && <p className="error">Ошибка: {error}</p>}
      {/* Только после загрузки и без ошибки: иначе пустой список означает "ещё не загрузили" или "не смогли загрузить" */}
      {!loading && !error && messages.length === 0 && <p>Сообщений пока нет</p>}
      
      {token && (
        <button type="button" className="primary-button" onClick={() => openEnterMessage(null)}>Добавить корневой</button>
      )}
      
      <div className="messages-list">
        {messages.map((message) => (
          // depth: 0 — сообщение верхнего уровня, 1 — ответ на него и т.д. Отступ 20px на каждый уровень
          <div
            key={message.message_id}
            className="message-plate"
            style={{ marginLeft: `${message.depth * 20}px` }}
          >
            <div className="message-body">
              <div className="message-header">
                <b>{message.user__login}</b> {message.created_at}
              </div>
              {/* Как в предпросмотре EnterMessage: если isMessageCorrect вернула true — текст показывается как HTML.
                  Иначе (сервер разметку не проверяет, текст мог сохраниться с ошибкой) — обычным текстом, теги видны как есть */}
              {isMessageCorrect(message.t) ? (
                <div className="message-text" dangerouslySetInnerHTML={{ __html: message.t }} />
              ) : (
                <div className="message-text">{message.t}</div>
              )}
              {/* Без файла сервер отдаёт attachment и attachment_name как null */}
              {message.attachment !== null && message.attachment_name !== null && (
                <MessageAttachment
                  attachment={message.attachment}
                  attachmentName={message.attachment_name}
                />
              )}
            </div>
            {/* Комментировать может только вошедший пользователь */}
            {token && (
              <button type="button" className="primary-button" onClick={() => openEnterMessage(message.message_id)}>Комментировать</button>
            )}
            {/* Только автору: логин автора сообщения совпадает с логином вошедшего пользователя */}
            {token && message.user__login === userLogin && (
              <button type="button" className="danger-button" onClick={() => handleDeleteMessage(message.message_id)}>Удалить</button>
            )}
          </div>
        ))}
      </div>
      
      {token && messages.length > 0 && (
        <button type="button" className="primary-button" onClick={() => openEnterMessage(null)}>Добавить корневой</button>
      )}
      
      {isEnterMessageOpen && (
        <EnterMessage
          parentMessageId={parentMessageId}
          onSubmit={handleSubmitComment}
          onClose={closeEnterMessage}
        />
      )}
    </div>
  )
}
