# College RAG Chatbot

A document-grounded college information assistant. Admins upload college PDFs, the backend extracts and indexes their text, and students ask questions through the chat interface.

## Applications

- `frontend/` - React, Vite, Tailwind CSS, and React Router
- `backend/` - Node.js, Express, MongoDB, PDF parsing, Pinecone, and Gemini

## Requirements

- Node.js 18 or newer
- MongoDB Community Server running locally
- A Pinecone account, API key, and existing index
- A Gemini API key for chat answer generation

The current Pinecone index must be configured with `1024` dimensions. Embeddings are generated locally, so PDF uploads do not use the Gemini embedding quota.

## Installation

From the repository root:

```powershell
npm run install:all
```

If MongoDB is not installed on Windows, install the official server with:

```powershell
winget install --id MongoDB.Server
```

Confirm that the MongoDB service is running:

```powershell
Get-Service MongoDB
```

## Environment Configuration

Create `backend/.env`. Do not commit this file or put real credentials in source code.

```env
PORT=5005
MONGODB_URI=mongodb://127.0.0.1:27017/college_rag
JWT_SECRET=replace_with_a_long_random_secret
GEMINI_API_KEY=replace_with_your_gemini_key
GEMINI_MODEL=gemini-3.6-flash
PINECONE_API_KEY=replace_with_your_pinecone_key
PINECONE_INDEX=college-rag-index
FRONTEND_URL=http://localhost:5173
```

`backend/src/server.js` loads `backend/.env`. The backend reads the database URI from `process.env.MONGODB_URI`.

## Run the App

Run both frontend and backend from the repository root:

```powershell
npm run dev
```

Or run them separately:

```powershell
npm run dev:backend
npm run dev:frontend
```

Open the application at:

- Frontend: http://localhost:5173
- Backend health check: http://localhost:5005/api/health

The health check should return:

```json
{"status":"ok","message":"College RAG API is running"}
```

The backend startup log should include `MongoDB connected: 127.0.0.1`.

## Accounts and Roles

Registering through the application creates a `student` account. The login page has a Role selector for Student and Admin, but selecting Admin does not grant permissions by itself. The account must already have `role: "admin"` in MongoDB.

To promote an account using MongoDB Compass:

1. Connect to `mongodb://127.0.0.1:27017`.
2. Open the `college_rag` database and `users` collection.
3. Edit the intended user.
4. Set `role` to `admin` and save.
5. Log out and log in again with the Admin role selected.

Admin login is available at http://localhost:5173/login?admin=true.

## Upload a PDF

1. Log in with an account whose role is `admin`.
2. Open http://localhost:5173/admin.
3. Enter a document title.
4. Choose the matching category.
5. Select a PDF file and click `Upload Document`.

Upload requirements:

- `.pdf` files only
- Maximum size: 10 MB
- Text-based PDFs are recommended
- Scanned image-only PDFs may not produce useful extracted text

Useful categories include Admissions, Courses, Fees, Exams, Academic Calendar, Hostel, Scholarships, Placements, and Policies.

During upload, the backend extracts PDF text, splits it into chunks, creates local `1024`-dimension vectors, stores them in Pinecone, and saves the document metadata in MongoDB. A failed indexing operation is cleaned up instead of leaving an incomplete document record.

## Ask Questions

After a successful upload:

1. Log in as a student or admin.
2. Open http://localhost:5173/dashboard.
3. Ask a question that matches the uploaded documents.

Answers include source references when matching document chunks are found. If the knowledge base does not contain the answer, the assistant reports that it could not find the information instead of inventing a response.

## Troubleshooting

### MongoDB does not connect

Check that the MongoDB service is running and that `backend/.env` contains:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/college_rag
```

Restart the backend after changing `.env`.

### Admin access is rejected

The selected login role must match the account role in MongoDB. Selecting Admin in the form only calls the admin login endpoint; it does not change the database role.

### PDF upload fails

Check the error displayed on the admin page. Common causes are:

- The file is not a PDF or is larger than 10 MB.
- The account is not an admin.
- The Pinecone API key or index name is incorrect.
- The Pinecone index is not ready or is not `1024` dimensions.

### Chat returns no document information

Confirm that the upload completed successfully and that the document has a non-zero chunk count. Also confirm that the Pinecone index contains records and that `GEMINI_API_KEY` and `GEMINI_MODEL` are valid.

## Production Build

Build the frontend with:

```powershell
npm run build
```

Start the backend in production mode with:

```powershell
npm --prefix backend start
```
