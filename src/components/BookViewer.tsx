import React, { useEffect, useState, useRef, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ref, onValue, set, update, remove } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import type { Book, Note } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import './BookViewer.css';

interface BookViewerProps {
  bookId: string;
  onBack: () => void;
}

const FONT_SIZES = [14, 16, 18, 20, 22, 24, 28];
const TEXT_COLORS = ['#1a1208', '#2c1810', '#1a3a5c', '#2F4F4F', '#4B0082', '#800000', '#006400', '#333'];
const BG_COLORS = ['#f8f1e3', '#f5e6c8', '#fff8e7', '#e8f0e8', '#e8e8f5', '#f5e8e8', '#ffffff'];

export default function BookViewer({ bookId, onBack }: BookViewerProps) {
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editFontSize, setEditFontSize] = useState(16);
  const [editColor, setEditColor] = useState('#1a1208');
  const [editBg, setEditBg] = useState('#f8f1e3');
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const flipBookRef = useRef<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const bookRef = ref(db, `users/${user.uid}/books/${bookId}`);
    const unsub = onValue(bookRef, (snap) => {
      const data = snap.val();
      if (data) {
        setBook({ id: bookId, ...data });
        const list: Note[] = Object.entries(data.notes || {}).map(([id, n]: [string, any]) => ({
          id,
          ...n,
        }));
        list.sort((a, b) => a.order - b.order);
        setNotes(list);
      } else {
        setBook(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [user, bookId]);

  const addNewNote = async () => {
    if (!user || !book || adding) return;
    setAdding(true);
    try {
      const noteId = uuidv4();
      const now = Date.now();
      const order = notes.length > 0 ? Math.max(...notes.map((n) => n.order)) + 1 : 0;
      const newNote: Note = {
        id: noteId,
        content: '<p></p>',
        fontSize: 16,
        color: '#1a1208',
        backgroundColor: '#f8f1e3',
        createdAt: now,
        updatedAt: now,
        order,
      };
      await set(ref(db, `users/${user.uid}/books/${bookId}/notes/${noteId}`), newNote);
      await update(ref(db, `users/${user.uid}/books/${bookId}`), { updatedAt: now });
      // Open editor for the new note
      setEditingNote(newNote);
      setEditContent('');
      setEditFontSize(16);
      setEditColor('#1a1208');
      setEditBg('#f8f1e3');
    } catch (e) {
      console.error(e);
      alert('Không thể thêm trang');
    } finally {
      setAdding(false);
    }
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setEditContent(note.content || '');
    setEditFontSize(note.fontSize || 16);
    setEditColor(note.color || '#1a1208');
    setEditBg(note.backgroundColor || '#f8f1e3');
  };

  const saveNote = async () => {
    if (!user || !editingNote) return;
    setSaving(true);
    try {
      const content = editorRef.current?.innerHTML || editContent || '<p></p>';
      await update(ref(db, `users/${user.uid}/books/${bookId}/notes/${editingNote.id}`), {
        content,
        fontSize: editFontSize,
        color: editColor,
        backgroundColor: editBg,
        updatedAt: Date.now(),
      });
      await update(ref(db, `users/${user.uid}/books/${bookId}`), { updatedAt: Date.now() });
      setEditingNote(null);
    } catch (e) {
      console.error(e);
      alert('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!user || !confirm('Xóa trang này?')) return;
    await remove(ref(db, `users/${user.uid}/books/${bookId}/notes/${noteId}`));
    await update(ref(db, `users/${user.uid}/books/${bookId}`), { updatedAt: Date.now() });
    if (editingNote?.id === noteId) setEditingNote(null);
  };

  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file || !editorRef.current) return;
      if (file.size > 1.5 * 1024 * 1024) {
        alert('Ảnh tối đa ~1.5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const img = document.createElement('img');
        img.src = reader.result as string;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '6px';
        img.style.margin = '8px 0';
        editorRef.current?.appendChild(img);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const onFlip = useCallback((e: any) => {
    setCurrentPage(e.data);
  }, []);

  if (loading) {
    return (
      <div className="viewer-loading">
        <div className="spinner" />
        <p>Đang mở sách...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="viewer-loading">
        <p>Không tìm thấy sách</p>
        <button className="btn-primary" onClick={onBack}>Quay lại</button>
      </div>
    );
  }

  return (
    <div className="book-viewer">
      <header className="viewer-header">
        <button className="btn-ghost" onClick={onBack}>← Kệ sách</button>
        <h2 className="viewer-title">{book.title}</h2>
        <button className="btn-primary" onClick={addNewNote} disabled={adding}>
          {adding ? 'Đang thêm...' : '+ Thêm trang'}
        </button>
      </header>

      <div className="viewer-body">
        {/* Flip book - chỉ đọc */}
        <div className="book-container">
          <HTMLFlipBook
            width={380}
            height={500}
            size="stretch"
            minWidth={280}
            maxWidth={420}
            minHeight={380}
            maxHeight={560}
            showCover={true}
            mobileScrollSupport={true}
            onFlip={onFlip}
            className="flip-book"
            ref={flipBookRef}
            style={{ margin: '0 auto' }}
            startPage={0}
            drawShadow={true}
            flippingTime={700}
            usePortrait={true}
            startZIndex={0}
            autoSize={true}
            maxShadowOpacity={0.45}
            showPageCorners={true}
            disableFlipByClick={false}
            clickEventForward={true}
            useMouseEvents={true}
            swipeDistance={40}
            renderOnlyPageLengthChange={false}
          >
            <div className="page cover-page" data-density="hard">
              <div className="cover-inner" style={{ background: book.coverColor }}>
                <h1 style={{ color: book.coverTitleColor || '#f5e6c8' }}>{book.title}</h1>
                <p className="cover-sub">Self Talk Book</p>
                <div className="cover-date">
                  {format(book.createdAt, 'MMMM yyyy', { locale: vi })}
                </div>
              </div>
            </div>

            {notes.length === 0 ? (
              <div className="page note-page empty-page">
                <div className="page-content center">
                  <p className="empty-hint">Chưa có trang nào.<br />Bấm “+ Thêm trang” để viết.</p>
                </div>
              </div>
            ) : (
              notes.map((note, idx) => (
                <div
                  key={note.id}
                  className="page note-page"
                  style={{ background: note.backgroundColor || '#f8f1e3' }}
                >
                  <div className="page-header">
                    <span>Trang {idx + 1}</span>
                    <span>{format(note.updatedAt, 'dd/MM/yyyy')}</span>
                  </div>
                  <div
                    className="page-content"
                    style={{ fontSize: note.fontSize, color: note.color }}
                    dangerouslySetInnerHTML={{ __html: note.content || '<p></p>' }}
                  />
                  <div className="page-footer">
                    <button
                      className="btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(note);
                      }}
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      className="btn-sm danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            )}

            <div className="page cover-page back-cover" data-density="hard">
              <div className="cover-inner" style={{ background: book.coverColor }}>
                <p style={{ color: book.coverTitleColor || '#f5e6c8', opacity: 0.85 }}>Kết thúc</p>
                <p className="cover-sub">Tiếp tục viết cho bản thân</p>
              </div>
            </div>
          </HTMLFlipBook>

          <div className="page-indicator">
            {currentPage + 1} / {1 + Math.max(notes.length, 1) + 1}
          </div>
        </div>

        {/* Editor panel - tách riêng, không nằm trong flip */}
        {editingNote && (
          <div className="editor-panel">
            <div className="editor-panel-header">
              <h3>Chỉnh sửa trang</h3>
              <button className="btn-ghost btn-sm" onClick={() => setEditingNote(null)}>✕</button>
            </div>

            <div className="editor-toolbar">
              <select value={editFontSize} onChange={(e) => setEditFontSize(Number(e.target.value))}>
                {FONT_SIZES.map((s) => (
                  <option key={s} value={s}>{s}px</option>
                ))}
              </select>
              <div className="swatches">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`swatch ${editColor === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setEditColor(c)}
                    title="Màu chữ"
                  />
                ))}
              </div>
              <div className="swatches">
                {BG_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`swatch ${editBg === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setEditBg(c)}
                    title="Nền"
                  />
                ))}
              </div>
              <button className="btn-sm" onClick={insertImage}>📷 Ảnh</button>
            </div>

            <div
              className="page-editor" key={editingNote.id}
              contentEditable
              ref={editorRef}
              suppressContentEditableWarning
              style={{
                fontSize: editFontSize,
                color: editColor,
                background: editBg,
              }}
              dangerouslySetInnerHTML={{ __html: editContent }}
            />

            <div className="editor-actions">
              <button className="btn-ghost" onClick={() => setEditingNote(null)}>Hủy</button>
              <button className="btn-primary" onClick={saveNote} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu trang'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
