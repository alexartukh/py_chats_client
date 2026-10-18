import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getTopic, getMessages, createNewMessage, deleteExistingMessage } from '../api.js'
import EnterMessage from '../components/EnterMessage.jsx'
import MessageAttachment from '../components/MessageAttachment.jsx'
import Lightbox from '../components/Lightbox.jsx'
import RootMessages from '../components/RootMessages.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { isMessageCorrect } from '../messageMarkup.js'
import { formatDateTime } from '../dateFormat.js'

// Сколько сообщений на одной странице (по ТЗ — 25)
const MESSAGES_PER_PAGE = 25

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
  // Картинка, открытая в Lightbox: { src, alt }. null — Lightbox закрыт
  const [lightboxImage, setLightboxImage] = useState(null)

  // Вызывается из MessageAttachment по клику на превью картинки
  function openLightbox(imageSrc, imageAlt) {
    setLightboxImage({ src: imageSrc, alt: imageAlt })
  }

  function closeLightbox() {
    setLightboxImage(null)
  }
  // Версия таблицы корневых сообщений. Увеличивается после добавления и удаления сообщения;
  // RootMessages получает её пропом reloadVersion и при изменении загружает таблицу заново
  const [rootMessagesVersion, setRootMessagesVersion] = useState(0)
  // Номер текущей страницы сообщений, с 1
  const [pageNumber, setPageNumber] = useState(1)

  // Сервер не отдаёт общее число сообщений темы, поэтому последняя страница определяется так:
  // пришло меньше MESSAGES_PER_PAGE сообщений — дальше страниц нет.
  // Если на последней странице ровно MESSAGES_PER_PAGE, "Вперёд" останется активной и следующая страница будет пустой.
  const hasNextPage = messages.length === MESSAGES_PER_PAGE
  const hasPreviousPage = pageNumber > 1

  // Номер первого сообщения текущей страницы среди всех сообщений темы (с 1) — тот же from, что уходит на сервер
  const firstNumberOnPage = (pageNumber - 1) * MESSAGES_PER_PAGE + 1

  // Порядковый номер каждого сообщения на странице (с 1) — в том же порядке, по которому сервер нарезает страницы:
  // LIFO, от новых к старым — по created_at по убыванию, затем по message_id по убыванию.
  // № 1 в теме — самое новое сообщение.
  // На экране сообщения идут в порядке дерева, поэтому сверху вниз номера могут идти не подряд
  // (ответ стоит под своим родителем, хотя написан позже других сообщений).
  // created_at сравнивается через Date.parse, а не как строка: сервер пишет дробную часть секунд не всегда,
  // и строки "…:00Z" и "…:00.123Z" сравнились бы неверно.
  const newestFirstMessages = []
  for (const message of messages) {
    newestFirstMessages.push(message)
  }
  newestFirstMessages.sort((a, b) => {
    const timeDifference = Date.parse(b.created_at) - Date.parse(a.created_at)
    if (timeDifference !== 0) {
      return timeDifference
    }
    return b.message_id - a.message_id
  })
  const numberOnPageByMessageId = {}
  for (let index = 0; index < newestFirstMessages.length; index++) {
    numberOnPageByMessageId[newestFirstMessages[index].message_id] = index + 1
  }

  // parentMessageId: message_id родителя или null для корневого сообщения
  function openEnterMessage(parentMessageId) {
    setParentMessageId(parentMessageId)
    setIsEnterMessageOpen(true)
  }

  function closeEnterMessage() {
    setIsEnterMessageOpen(false)
    setParentMessageId(null)
  }

  // Загружает текущую страницу: сообщения с номерами from..to (с 1, включительно)
  function loadMessages() {
    const from = (pageNumber - 1) * MESSAGES_PER_PAGE + 1
    const to = pageNumber * MESSAGES_PER_PAGE
    setLoading(true)
    setError(null)
    getMessages(topicId, from, to)
      .then(setMessages)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  // comment = { parent_message_id, login, email, home_page, captcha, text } — см. EnterMessage.
  // На сервер уходят login, email, topic_id, parent_message_id, text (как "t"), attachment и home_page (как "site");
  // автора сервер берёт из токена. captcha сервер пока не принимает.
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
      comment.home_page,
      comment.captcha_id,
      comment.captcha,
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

  // Другая тема — загрузить её и начать с первой страницы
  useEffect(() => {
    loadTopic()
    setPageNumber(1)
  }, [topicId])

  // Сообщения загружаются при смене темы и при смене страницы
  useEffect(() => {
    loadMessages()
  }, [topicId, pageNumber])

  return (
    <div className="column">

      <h2>
        Тема #{topicId}
        {topic !== null && (
          <>
            : {topic.title}{' '}
            <span className="topic-meta">
              <b>{topic.created_by_user__login}</b> {formatDateTime(topic.created_at)}
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
      {!loading && !error && messages.length === 0 && pageNumber === 1 && <p>Сообщений пока нет</p>}
      {!loading && !error && messages.length === 0 && pageNumber > 1 && <p>На этой странице сообщений нет</p>}

      {/* Пейджер: по MESSAGES_PER_PAGE сообщений на странице */}
      <div className="pager">
        <button
          type="button"
          className="primary-button"
          disabled={!hasPreviousPage}
          onClick={() => setPageNumber(pageNumber - 1)}
        >
          ← Назад
        </button>
        <span>Страница {pageNumber}</span>
        <button
          type="button"
          className="primary-button"
          disabled={!hasNextPage}
          onClick={() => setPageNumber(pageNumber + 1)}
        >
          Вперёд →
        </button>
      </div>

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
              <div className="message-numbers">
                № {numberOnPageByMessageId[message.message_id]} на странице,
                № {firstNumberOnPage - 1 + numberOnPageByMessageId[message.message_id]} в теме
              </div>
              <div className="message-header">
                <b>{message.user__login}</b> {formatDateTime(message.created_at)}
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
                  onImageClick={openLightbox}
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
      
      {lightboxImage !== null && (
        <Lightbox
          imageSrc={lightboxImage.src}
          imageAlt={lightboxImage.alt}
          onClose={closeLightbox}
        />
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
