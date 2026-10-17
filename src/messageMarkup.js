// true — в тексте только разрешённые теги (<i>, <strong>, <code>, <a href="" title="">),
// все закрыты и правильно вложены.
// <a> внутри <a> быть не может
// Тогда текст можно показать как HTML (dangerouslySetInnerHTML).
export function isMessageCorrect(text) {
  let tags = []
  let is_inside_a = false
  for (const match of text.matchAll(/<([^>]+?)>/g)) {
    let content = match[1]
    let m2;
    if (content === 'i') {
      tags.push('OPEN_I')
    }
    else if (content === '/i') {
      if (tags.pop() !== 'OPEN_I') return false
    }
    else if (content === 'strong') {
      tags.push('OPEN_S')
    }
    else if (content === '/strong') {
      if (tags.pop() !== 'OPEN_S') return false
    }
    else if (content === 'code') {
      tags.push('OPEN_C')
    }
    else if (content === '/code') {
      if (tags.pop() !== 'OPEN_C') return false
    }
    else if (m2 = content.match(/^a href="([^"<>]*?)"( title="[^"<>]*?")?$/)) {

      if (is_inside_a) return false

      if ((m2[1] === '') || m2[1].match(/^https?:\/\/.{3,}/)) {
        tags.push('OPEN_A')
        is_inside_a = true
      }
      else {
        return false
      }
    }
    else if (content === '/a') {
      if (tags.pop() !== 'OPEN_A') {
        return false
      }
      else {
        is_inside_a = false
      }
    }
    else {
      return false
    }
  }

  if (tags.length > 0) return false

  return true
}
