import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import CreateNewUserPage from './pages/CreateNewUserPage.jsx'
import CreateTopicPage from './pages/CreateTopicPage.jsx'
import TopicPage from './pages/TopicPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

// Новые страницы добавляются сюда: <Route path="/about" element={<AboutPage />} />
export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/create_new_user" element={<CreateNewUserPage />} />
        <Route path="/topic/:topicId" element={<TopicPage />} />
        {/* Защищённые страницы: без токена в localStorage — перенаправление на '/' */}
        <Route element={<ProtectedRoute />}>
          <Route path="/create_new_topic" element={<CreateTopicPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
