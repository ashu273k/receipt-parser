import { useEffect, useState } from 'react';

function App() {
  const [status, setStatus] = useState<string>('Loading...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch((err) => {
        console.error(err);
        setStatus('API Error');
      });
  }, []);

  return (
    <div>
      <h1>Receipt Parser</h1>
      <p>Server Status: {status}</p>
    </div>
  );
}

export default App;
