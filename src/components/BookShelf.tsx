import React, { useEffect, useState } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { Book } from '../types';
import { v4 as uuidv4 } from 'uuid';
import './BookShelf.css';

interface BookShelfProps {
  onOpenBook: (bookId: string) => void;
}

const COVER_COLORS = [
  '#8B4513', '#2F4F4F', '#4A0E4E', '#1A3A5C', '#3D2914',
  '#5C3317', '#2C3E50', '#4B0082', '#800000', '#006400'
];

export default function BookShelf({ onOpenBook }: BookShelfProps) {
  const { user, logout, changePassword, error, clearError } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState(COVER_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const booksRef = ref(db, `users/${user.uid}/books`);
    const unsub = onValue(booksRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list: Book[] = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val,
          notes: val.notes || {},
        }));
        list.sort((a, b) => b.updatedAt - a.updatedAt);
        setBooks(list);
      } else {
        setBooks([]);
      }
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const createBook = async () => {
    if (!user || !newTitle.trim()) return;
    setCreating(true);
    try {
      const bookId = uuidv4();
      const now = Date.now();
      await set(ref(db, `users/${user.uid}/books/${bookId}`), {
        title: newTitle.trim(),
        coverColor: newColor,
        coverTitleColor: '#f5e6c8',
        createdAt: now,
        updatedAt: now,
      });
      setNewTitle('');
      setShowNewModal(false);
    } catch (e) {
      console.error(e);
      alert('Không thể tạo sách');
    } finally {
      setCreating(false);
    }
  };

  const deleteBook = async (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !confirm('Xóa cuốn sách này? Tất cả trang sẽ mất.')) return;
    await remove(ref(db, `users/${user.uid}/books/${bookId}`));
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg('');
    clearError();
    setPwLoading(true);
    try {
      await changePassword(oldPw, newPw);
      setPwMsg('Đổi mật khẩu thành công!');
      setOldPw('');
      setNewPw('');
    } catch {
      setPwMsg(error || 'Đổi mật khẩu thất bại');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="shelf-loading">
        <div className="spinner" />
        <p>Đang tải kệ sách...</p>
      </div>
    );
  }

  return (
    <div className="bookshelf-page">
      <header className="shelf-header">
        <div className="header-left">
          <h1>📚 Self Talk Book</h1>
          <span className="user-badge">{user?.displayName || user?.username}</span>
        </div>
        <div className="header-actions">
          <button className="btn-icon" onClick={toggleTheme} title="Đổi giao diện">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn-ghost" onClick={() => { setShowAccount(true); clearError(); setPwMsg(''); }}>
            Tài khoản
          </button>
          <button className="btn-primary" onClick={() => setShowNewModal(true)}>
            + Tạo sách
          </button>
          <button className="btn-ghost" onClick={() => logout()}>
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="shelf-main">
        {books.length === 0 ? (
          <div className="empty-shelf">
            <div className="empty-icon">📖</div>
            <h2>Kệ sách trống</h2>
            <p>Tạo cuốn sách đầu tiên để bắt đầu viết.</p>
            <button className="btn-primary" onClick={() => setShowNewModal(true)}>
              Tạo sách đầu tiên
            </button>
          </div>
        ) : (
          <div className="books-grid">
            {books.map((book) => {
              const noteCount = book.notes ? Object.keys(book.notes).length : 0;
              return (
                <div
                  key={book.id}
                  className="book-card"
                  onClick={() => onOpenBook(book.id)}
                  style={{ '--cover': book.coverColor } as React.CSSProperties}
                >
                  <div className="book-spine" />
                  <div className="book-cover">
                    <div className="cover-title">{book.title}</div>
                    <div className="cover-meta">{noteCount} trang</div>
                  </div>
                  <button className="delete-book" onClick={(e) => deleteBook(book.id, e)} title="Xóa">
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Tạo cuốn sách mới</h2>
            <div className="field">
              <label>Tiêu đề</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nhật ký, suy nghĩ..."
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && createBook()}
              />
            </div>
            <div className="field">
              <label>Màu bìa</label>
              <div className="color-picker">
                {COVER_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`color-swatch ${newColor === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setNewColor(c)}
                  />
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowNewModal(false)}>Hủy</button>
              <button className="btn-primary" onClick={createBook} disabled={creating || !newTitle.trim()}>
                {creating ? 'Đang tạo...' : 'Tạo sách'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAccount && (
        <div className="modal-overlay" onClick={() => setShowAccount(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Tài khoản</h2>
            <p className="account-info">
              <strong>{user?.displayName}</strong>
              <br />
              <span className="muted">@{user?.username}</span>
            </p>
            <form onSubmit={handleChangePw}>
              <div className="field">
                <label>Mật khẩu hiện tại</label>
                <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} required />
              </div>
              <div className="field">
                <label>Mật khẩu mới</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={4} />
              </div>
              {pwMsg && <div className={pwMsg.includes('thành công') ? 'success-msg' : 'error-msg'}>{pwMsg}</div>}
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowAccount(false)}>Đóng</button>
                <button type="submit" className="btn-primary" disabled={pwLoading}>
                  {pwLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
