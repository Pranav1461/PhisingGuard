import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Layout } from './components/layout/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { HomePage } from './pages/HomePage';
import { CheckPage } from './pages/CheckPage';
import { LearnPage } from './pages/LearnPage';
import { PatternPage } from './pages/PatternPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { NotFoundPage } from './pages/NotFoundPage';

/* Smooth page transition wrapper */
function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* Routes with AnimatePresence for transition support */
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={<PageTransition><HomePage /></PageTransition>} />
          <Route path="check" element={<PageTransition><CheckPage /></PageTransition>} />
          <Route path="learn" element={<PageTransition><LearnPage /></PageTransition>} />
          <Route path="patterns" element={<PageTransition><PatternPage /></PageTransition>} />
          <Route path="simulator" element={<PageTransition><SimulatorPage /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export function App() {
  return (
    <Router>
      <ScrollToTop />
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
