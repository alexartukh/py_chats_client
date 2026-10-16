import { useEffect, useState } from 'react'

export default function App() {
  const [message, setMessage] = useState('Loading...')

  useEffect(() => {
    fetch('/api/hello/')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage('Could not reach Django. Is it running on port 8000?'))
  }, [])

  return (
    <main style={{ fontFamily: 'sans-serif', padding: 40 }}>
      <h1>Django + React</h1>
      <p>{message}</p>
    </main>
  )
}
