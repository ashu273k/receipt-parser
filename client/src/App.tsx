import { useState } from 'react';
import { UploadScreen } from './components/UploadScreen';
import { ReceiptReviewForm } from './components/ReceiptReviewForm';
import { HistoryView } from './components/HistoryView';
import type { ParsedReceipt } from './types';
import './App.css';

type Screen = 'upload' | 'review' | 'history';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('upload');
  const [parsedData, setParsedData] = useState<ParsedReceipt | null>(null);
  const [parseFailed, setParseFailed] = useState(false);

  const handleExtractSuccess = (data: ParsedReceipt | null, failed: boolean) => {
    setParsedData(data);
    setParseFailed(failed);
    setCurrentScreen('review');
  };

  const handleSaveSuccess = () => {
    setParsedData(null);
    setParseFailed(false);
    setCurrentScreen('upload');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Receipt Parser</h1>
        <nav className="app-nav">
          <button 
            className={`nav-btn ${currentScreen === 'upload' || currentScreen === 'review' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('upload')}
          >
            Upload
          </button>
          <button 
            className={`nav-btn ${currentScreen === 'history' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('history')}
          >
            History
          </button>
        </nav>
      </header>

      <main className="app-main">
        {currentScreen === 'upload' && (
          <UploadScreen onExtractSuccess={handleExtractSuccess} />
        )}
        
        {currentScreen === 'review' && (
          <ReceiptReviewForm 
            initialData={parsedData} 
            parseFailed={parseFailed} 
            onSaveSuccess={handleSaveSuccess}
          />
        )}

        {currentScreen === 'history' && (
          <HistoryView />
        )}
      </main>
    </div>
  );
}

export default App;
