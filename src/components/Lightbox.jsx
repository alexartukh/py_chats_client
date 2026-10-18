// Модальный просмотр картинки поверх страницы.
// Пропсы:
//   imageSrc — адрес картинки (у нас data:-адрес из вложения сообщения)
//   imageAlt — подпись: имя файла, показывается под картинкой и в alt
//   onClose() — вызывается по клику на затемнённый фон и по кнопке "×". Клавиша Escape не закрывает
// Картинка показывается не больше 320×240 (класс .lightbox-image в index.css), пропорции сохраняются.
// Появление — с анимацией (затемнение фона и увеличение картинки), это "визуальный эффект" из ТЗ.
export default function Lightbox({ imageSrc, imageAlt, onClose }) {
  return (
    <div className="modal-overlay lightbox-overlay" onClick={onClose}>
      {/* stopPropagation: клик по самой картинке не закрывает просмотр */}
      <div className="lightbox-window" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="lightbox-close" onClick={onClose} title="Закрыть">×</button>
        <img className="lightbox-image" src={imageSrc} alt={imageAlt} />
        <div className="lightbox-caption">{imageAlt}</div>
      </div>
    </div>
  )
}
