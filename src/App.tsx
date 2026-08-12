import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import ProfilePage from "./pages/ProfilePage"
import PracticeModulesPage from "./pages/PracticeModulesPage"
import VocabularyPage from "./pages/vocabulary/VocabularyPage"
import CollectionDetailPage from "./pages/vocabulary/CollectionDetailPage"
import BulkAddPage from "./pages/vocabulary/BulkAddPage"
import WritingEditorPage from "./pages/writing/WritingEditorPage"
import WritingReviewPage from "./pages/writing/WritingReviewPage"
import ReadingPracticePage from "./pages/reading/ReadingPracticePage"
import ReadingResultPage from "./pages/reading/ReadingResultPage"
import ListeningPracticePage from "./pages/listening/ListeningPracticePage"
import ListeningDictationPage from "./pages/listening/ListeningDictationPage"
import ListeningResultPage from "./pages/listening/ListeningResultPage"
import SpeakingPracticePage from "./pages/speaking/SpeakingPracticePage"
import SpeakingShadowingPage from "./pages/speaking/SpeakingShadowingPage"
import SpeakingResultPage from "./pages/speaking/SpeakingResultPage"
import { ToastProvider } from "./components/common/Toast"
import { ProtectedRoute, PublicOnlyRoute } from "./components/common/ProtectedRoute"

const App = () => {
  return (
    <ToastProvider>
      <Routes>
        {/* Public route - only accessible when NOT logged in */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected routes - require login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/practice-modules" element={<PracticeModulesPage />} />
          <Route path="/vocabulary" element={<VocabularyPage />} />
          <Route path="/vocabulary/:id" element={<CollectionDetailPage />} />
          <Route path="/vocabulary/:id/bulk-add" element={<BulkAddPage />} />
          <Route path="/writing/editor/:promptId" element={<WritingEditorPage />} />
          <Route path="/writing/review/:sessionId" element={<WritingReviewPage />} />
           
          <Route path="/reading" element={<ReadingPracticePage />} />
          <Route path="/reading/practice" element={<ReadingPracticePage />} />
          <Route path="/reading/result" element={<ReadingResultPage />} />
          <Route path="/listening" element={<PracticeModulesPage />} />
          <Route path="/listening/practice" element={<ListeningPracticePage />} />
          <Route path="/listening/dictation" element={<ListeningDictationPage />} />
          <Route path="/listening/result" element={<ListeningResultPage />} />
          <Route path="/listening/dictation-result" element={<ListeningResultPage />} />
          
          {/* Speaking Module Routes */}
          <Route path="/speaking/practice/topic/:topicId" element={<SpeakingPracticePage />} />
          <Route path="/speaking/practice/prompt/:promptId" element={<SpeakingPracticePage />} />
          <Route path="/speaking/shadowing" element={<SpeakingShadowingPage />} />
          <Route path="/speaking/shadowing/:sentenceId" element={<SpeakingShadowingPage />} />
          <Route path="/speaking/result/:sessionId" element={<SpeakingResultPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}

export default App