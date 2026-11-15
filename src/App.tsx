import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import BookShelf from './components/BookShelf';
import BookViewer from './components/BookViewer';
import './App.css';

function App() {
  const { user, loading } = useAuth();
  const [openBookId, setOpenBookId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Self Talk Book</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (openBookId) {
    return (
      <BookViewer
        bookId={openBookId}
        onBack={() => setOpenBookId(null)}
      />
    );
  }

  return (
    <BookShelf onOpenBook={(id) => setOpenBookId(id)} />
  );
}

export default App;
