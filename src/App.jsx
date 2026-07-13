import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SiteLayout } from './components/Layout.jsx';
import CasePage from './pages/CasePage.jsx';
import HomePage from './pages/HomePage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import LearnPage from './pages/LearnPage.jsx';
import MethodologyPage from './pages/MethodologyPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import SimulatorPage from './pages/SimulatorPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="simulator" element={<SimulatorPage />} />
          <Route path="hall-of-harm" element={<LeaderboardPage />} />
          <Route path="cases/:caseId" element={<CasePage />} />
          <Route path="learn" element={<LearnPage />} />
          <Route path="learn/:articleId" element={<LearnPage />} />
          <Route path="methodology" element={<MethodologyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
