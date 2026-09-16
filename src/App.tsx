import AdvancedChunking from './components/AdvancedChunking';
import SOTAModels from './components/SOTAModels';
import TechStackMatrix from './components/TechStackMatrix';
import AdaptiveGenerator from './components/AdaptiveGenerator';
import ConceptFlow from './components/ConceptFlow';

function App() {
  return (
    <div className="bg-slate-50 flex flex-col font-sans text-slate-900 overflow-x-hidden" style={{ zoom: 0.75, minHeight: '133.33vh' }}>
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm" style={{ height: '90px' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Advanced RAG Explorer
          </h1>
        </div>
        <nav className="hidden md:flex gap-6">
          <a href="#adaptive" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Adaptive Generator</a>
          <a href="#concept-flow" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Concept Flow</a>
          <a href="#components" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Components</a>
          <a href="#models" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">SOTA Models</a>
          <a href="#tech" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Tech Stack</a>
        </nav>
      </header>
      
      <main className="flex-1 flex flex-col w-full">
        {/* Adaptive Generator Section */}
        <section id="adaptive" className="w-full flex" style={{ height: 'calc(133.33vh - 90px)' }}>
          <AdaptiveGenerator />
        </section>

        {/* Concept Flow Section */}
        <section id="concept-flow" className="w-full border-t border-slate-200 bg-white shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] relative z-10">
          <ConceptFlow />
        </section>

        {/* Detailed Sections */}
        <section id="components" className="w-full max-w-5xl mx-auto px-6 py-16 flex flex-col">
          <AdvancedChunking />
          
          <div id="models">
            <SOTAModels />
          </div>

          <div id="tech">
            <TechStackMatrix />
          </div>
        </section>
      </main>

      <footer className="w-full bg-white border-t border-slate-200 py-8 text-center text-slate-500 text-sm">
        Built with React, React Flow, and Tailwind CSS.
      </footer>
    </div>
  );
}

export default App;
