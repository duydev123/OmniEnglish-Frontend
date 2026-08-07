import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import ProfilePage from "./pages/ProfilePage"
import PracticeModulesPage from "./pages/PracticeModulesPage"
import VocabularyPage from "./pages/vocabulary/VocabularyPage"
import CollectionDetailPage from "./pages/vocabulary/CollectionDetailPage"
import BulkAddPage from "./pages/vocabulary/BulkAddPage"
import { ToastProvider } from "./components/common/Toast"

const App = () => {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/practice-modules" element={<PracticeModulesPage />} />
        <Route path="/vocabulary" element={<VocabularyPage />} />
        <Route path="/vocabulary/:id" element={<CollectionDetailPage />} />
        <Route path="/vocabulary/:id/bulk-add" element={<BulkAddPage />} />
      </Routes>
    </ToastProvider>
  )
}

export default App