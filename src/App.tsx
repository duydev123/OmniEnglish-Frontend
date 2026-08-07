import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import VocabularyPage from "./pages/vocabulary/VocabularyPage"
import CollectionDetailPage from "./pages/vocabulary/CollectionDetailPage"
import BulkAddPage from "./pages/vocabulary/BulkAddPage"
import ReadingPracticePage from "./pages/reading/ReadingPracticePage"
import ReadingResultPage from "./pages/reading/ReadingResultPage"
import PracticeModulesPage from "./pages/practice/PracticeModulesPage"
import ListeningPracticePage from "./pages/listening/ListeningPracticePage"
import ListeningDictationPage from "./pages/listening/ListeningDictationPage"
import ListeningResultPage from "./pages/listening/ListeningResultPage"
import { ToastProvider } from "./components/common/Toast"

const App = () => {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/vocabulary" element={<VocabularyPage />} />
        <Route path="/vocabulary/:id" element={<CollectionDetailPage />} />
        <Route path="/vocabulary/:id/bulk-add" element={<BulkAddPage />} />
        <Route path="/practice" element={<PracticeModulesPage />} />
        <Route path="/practice-modules" element={<PracticeModulesPage />} />
        <Route path="/reading" element={<ReadingPracticePage />} />
        <Route path="/reading/practice" element={<ReadingPracticePage />} />
        <Route path="/reading/result" element={<ReadingResultPage />} />
        <Route path="/listening" element={<PracticeModulesPage />} />
        <Route path="/listening/practice" element={<ListeningPracticePage />} />
        <Route path="/listening/dictation" element={<ListeningDictationPage />} />
        <Route path="/listening/result" element={<ListeningResultPage />} />
        <Route path="/listening/dictation-result" element={<ListeningResultPage />} />
      </Routes>
    </ToastProvider>
  )
}

export default App