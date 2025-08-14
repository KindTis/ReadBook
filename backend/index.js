const express = require('express');
const cors = require('cors');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const shortid = require('shortid');

const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ books: [], memos: [] }).write();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// 책 검색 (ISBN, 제목, 저자 등)
app.get('/api/search/book', (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // 실제 구현에서는 q를 사용하여 Google Books API 등을 호출합니다.
  // 예: `https://www.googleapis.com/books/v1/volumes?q=${q}`
  // 여기서는 목 데이터를 반환합니다.
  res.json({
    isbn: q.match(/^\d{10,13}$/) ? q : '9780345391803', // 임의의 ISBN
    title: `Result for "${q}"`,
    author: 'Douglas Adams',
    publishedDate: '2016-08-12',
    description: 'This is a mock description for a book found by searching a generic query.',
    thumbnail: 'http://books.google.com/books/content?id=pM9gDQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
  });
});

// 내 책장 목록 조회
app.get('/api/my-books', (req, res) => {
  const books = db.get('books').value();
  res.json(books);
});

// 내 책장에 책 추가
app.post('/api/my-books', (req, res) => {
  const bookData = req.body;
  
  if (!bookData.isbn || !bookData.title) {
    return res.status(400).json({ error: 'ISBN and title are required' });
  }

  // 이미 책장에 있는지 확인
  const existingBook = db.get('books').find({ isbn: bookData.isbn }).value();
  if (existingBook) {
    return res.status(409).json({ error: 'Book already in bookshelf' });
  }

  const newBook = {
    id: shortid.generate(),
    ...bookData,
    status: 'to-read', 
    currentPage: 0,
  };

  db.get('books').push(newBook).write();
  
  res.status(201).json(newBook);
});

// 책 정보 업데이트 (독서 상태, 페이지 등)
app.put('/api/my-books/:id', (req, res) => {
  const { id } = req.params;
  const bookData = req.body;

  const book = db.get('books').find({ id });

  if (book.value()) {
    book.assign(bookData).write();
    res.json(book.value());
  } else {
    res.status(404).json({ error: 'Book not found' });
  }
});

// 특정 책의 모든 메모 조회
app.get('/api/books/:bookId/memos', (req, res) => {
  const { bookId } = req.params;
  const memos = db.get('memos').filter({ bookId }).value();
  res.json(memos);
});

// 특정 책에 메모 추가
app.post('/api/books/:bookId/memos', (req, res) => {
  const { bookId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const newMemo = {
    id: shortid.generate(),
    bookId,
    content,
    createdAt: new Date().toISOString(),
  };

  db.get('memos').push(newMemo).write();

  res.status(201).json(newMemo);
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


