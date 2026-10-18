// Вложение сообщения: имя файла и сам файл.
// Пропсы:
//   attachment     — содержимое файла строкой base64 (как отдаёт /api/messages)
//   attachmentName — имя файла, по его расширению выбирается, как показывать
//   onImageClick(imageSrc, attachmentName) — вызывается по клику на картинку (TopicPage открывает Lightbox)
// Картинка (.jpg, .jpeg, .gif, .png) показывается через <img> уменьшенной (превью, не больше 160×120), текст (.txt) — в <pre>.
// Для других расширений показывается только имя.

// Тип содержимого для data:-адреса картинки, по расширению файла
const IMAGE_MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.png': 'image/png',
}

// Возвращает расширение в нижнем регистре вместе с точкой ("photo.PNG" -> ".png") или '' без точки в имени
function getExtension(fileName) {
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex === -1) {
    return ''
  }
  return fileName.substring(dotIndex).toLowerCase()
}

// base64 -> текст в кодировке UTF-8.
// atob отдаёт строку, где каждый символ — один байт; из неё собираются байты и декодируются как UTF-8,
// иначе русские буквы превратятся в мусор.
function decodeBase64AsUtf8Text(base64) {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new TextDecoder('utf-8').decode(bytes)
}

export default function MessageAttachment({ attachment, attachmentName, onImageClick }) {
  const extension = getExtension(attachmentName)
  const imageMimeType = IMAGE_MIME_TYPES[extension]

  let content = null
  if (imageMimeType !== undefined) {
    const imageSrc = `data:${imageMimeType};base64,${attachment}`
    content = (
      <img
        className="attachment-preview"
        src={imageSrc}
        alt={attachmentName}
        title="Открыть"
        onClick={() => onImageClick(imageSrc, attachmentName)}
      />
    )
  } else if (extension === '.txt') {
    content = <pre>{decodeBase64AsUtf8Text(attachment)}</pre>
  }

  return (
    <div className="message-attachment">
      <div className="message-header">Файл: {attachmentName}</div>
      {content}
    </div>
  )
}
