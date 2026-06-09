import QuizInterface from './components/QuizInterface';

/**
 * Main application host.
 * Renders the ICT live practical exam station terminal in full-screen mode instantly.
 */
export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#020108] text-slate-100 font-sans" id="main-app-host-container">
      <QuizInterface />
    </div>
  );
}
