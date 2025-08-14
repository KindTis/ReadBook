"use client";

import { useState, useEffect } from 'react';

// 타입 정의
interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  thumbnail?: string;
  status: 'reading' | 'completed' | 'to-read';
  currentPage: number;
  pages?: number;
}

interface Memo {
  id: string;
  bookId: string;
  content: string;
  createdAt: string;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [searchedBook, setSearchedBook] = useState<Omit<Book, 'id' | 'status' | 'currentPage'> | null>(null);
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [newMemoContent, setNewMemoContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchMyBooks();
  }, []);

  useEffect(() => {
    if (selectedBook) {
      fetchMemos(selectedBook.id);
    }
  }, [selectedBook]);

  const handleError = (error: unknown) => {
    if (error instanceof Error) {
      setError(error.message);
    } else {
      setError('An unknown error occurred');
    }
  };

  const fetchMyBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/my-books');
      if (!res.ok) throw new Error('Failed to fetch books');
      setMyBooks(await res.json());
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemos = async (bookId: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/books/${bookId}/memos`);
      if (!res.ok) throw new Error('Failed to fetch memos');
      setMemos(await res.json());
    } catch (error) {
      handleError(error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setError(null);
    setSearchedBook(null);
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/search/book?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Book not found');
      }
      setSearchedBook(await res.json());
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const addBookToBookshelf = async (bookData: Omit<Book, 'id' | 'status' | 'currentPage'>) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/my-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add book');
      }
      fetchMyBooks();
      setSearchedBook(null);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBook = async (book: Book) => {
    try {
      const res = await fetch(`http://localhost:3001/api/my-books/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
      });
      if (!res.ok) throw new Error('Failed to update book');
      fetchMyBooks();
    } catch (error) {
      handleError(error);
    }
  };

  const handleAddMemo = async () => {
    if (!selectedBook || !newMemoContent.trim()) return;
    try {
      const res = await fetch(`http://localhost:3001/api/books/${selectedBook.id}/memos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMemoContent }),
      });
      if (!res.ok) throw new Error('Failed to add memo');
      setNewMemoContent('');
      fetchMemos(selectedBook.id);
    } catch (error) {
      handleError(error);
    }
  };

  const openModal = (book: Book) => setSelectedBook({ ...book });
  const closeModal = () => setSelectedBook(null);

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (selectedBook) {
      setSelectedBook({ ...selectedBook, [e.target.name]: e.target.value });
    }
  };

  const handleModalSave = () => {
    if (selectedBook) {
      handleUpdateBook(selectedBook);
      closeModal();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">BookLog</h1>
      
      <div className="flex gap-2 mb-8">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter ISBN, title, or author" className="border p-2 rounded w-full" />
        <button onClick={handleSearch} disabled={loading} className="bg-blue-500 text-white p-2 rounded whitespace-nowrap disabled:bg-gray-400">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <p className="text-red-500 mt-4 p-4 bg-red-100 rounded">Error: {error}</p>}

      {searchedBook && (
        <div className="mb-8 p-4 border rounded">
          <h2 className="text-xl font-bold">{searchedBook.title}</h2>
          <p className="mb-2">{searchedBook.author}</p>
          {searchedBook.thumbnail && <img src={searchedBook.thumbnail} alt={searchedBook.title} className="w-24 h-auto mb-4" />}
          <button onClick={() => addBookToBookshelf(searchedBook)} disabled={loading} className="bg-green-500 text-white p-2 rounded disabled:bg-gray-400">
            {loading ? 'Adding...' : 'Add to My Books'}
          </button>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold border-b pb-2 mb-4">My Bookshelf</h2>
        {loading && myBooks.length === 0 && <p>Loading bookshelf...</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {myBooks.map((book) => (
            <div key={book.id} className="border rounded p-2 text-center cursor-pointer hover:shadow-lg" onClick={() => openModal(book)}>
              {book.thumbnail ? <img src={book.thumbnail} alt={book.title} className="w-full h-40 object-cover mb-2" /> : <div className="w-full h-40 bg-gray-200 mb-2 flex items-center justify-center">No Image</div>}
              <h3 className="font-bold text-sm">{book.title}</h3>
              <p className="text-xs text-gray-600">{book.author}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-10">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{selectedBook.title}</h2>
            <div className="mb-4">
              <label className="block mb-1">Status</label>
              <select name="status" value={selectedBook.status} onChange={handleModalChange} className="border p-2 rounded w-full">
                <option value="reading">Reading</option>
                <option value="completed">Completed</option>
                <option value="to-read">To Read</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1">Current Page</label>
              <input type="number" name="currentPage" value={selectedBook.currentPage} onChange={handleModalChange} className="border p-2 rounded w-full" />
            </div>
            
            <hr className="my-4" />

            <h3 className="text-xl font-bold mb-2">Memos</h3>
            <div className="mb-4">
              <textarea value={newMemoContent} onChange={(e) => setNewMemoContent(e.target.value)} placeholder="Write a memo..." className="border p-2 rounded w-full" rows={3}></textarea>
              <button onClick={handleAddMemo} className="bg-purple-500 text-white p-2 rounded mt-2">Add Memo</button>
            </div>
            <div className="space-y-2">
              {memos.map(memo => (
                <div key={memo.id} className="bg-gray-100 p-2 rounded">
                  <p>{memo.content}</p>
                  <p className="text-xs text-gray-500 text-right">{new Date(memo.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={closeModal} className="bg-gray-300 p-2 rounded">Cancel</button>
              <button onClick={handleModalSave} className="bg-blue-500 text-white p-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}