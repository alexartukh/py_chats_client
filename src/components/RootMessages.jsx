import { useEffect, useState } from 'react'
import { getAllRootMessages } from '../api.js'
import { isMessageCorrect } from '../messageMarkup.js'

// Таблица корневых сообщений темы (тех, что не являются ответом). Не дерево: ответы здесь не показываются.
// Пропсы:
//   topicId — id темы; при его изменении сообщения загружаются заново
//   reloadVersion — число; при его изменении сообщения тоже загружаются заново.
//     Родитель увеличивает его, когда таблицу нужно обновить (после добавления или удаления сообщения)
// Порядок строк — как пришёл с сервера (от старых к новым). Сортировки на клиенте пока нет.
export default function RootMessages({ topicId, reloadVersion }) {
  const [rootMessages, setRootMessages] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getAllRootMessages(topicId)
      .then(setRootMessages)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [topicId, reloadVersion])

  return (
    <div className="root-messages">
      <h3>Корневые сообщения</h3>
      {loading && <p>Загрузка...</p>}
      {error && <p className="error">Ошибка: {error}</p>}
      {!loading && !error && rootMessages.length === 0 && <p>Корневых сообщений нет</p>}
      {rootMessages.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Автор</th>
              <th>Сообщение</th>
              <th>Файл</th>
              <th>Создано</th>
            </tr>
          </thead>
          <tbody>
            {rootMessages.map((message) => (
              <tr key={message.message_id}>
                <td>{message.message_id}</td>
                <td>{message.user__login}</td>
                {/* Как в плашке сообщения на TopicPage: HTML только если isMessageCorrect вернула true, иначе обычный текст */}
                {isMessageCorrect(message.t) ? (
                  <td className="message-text" dangerouslySetInnerHTML={{ __html: message.t }} />
                ) : (
                  <td className="message-text">{message.t}</td>
                )}
                {/* Без файла сервер отдаёт attachment_name как null; в таблице только имя файла, без содержимого */}
                <td>{message.attachment_name !== null ? message.attachment_name : ''}</td>
                <td>{message.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
