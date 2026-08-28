import { useEffect, useState } from 'react';
import { Upload, Trash2, FileText, User2, Database } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const categories = [
  'Admissions',
  'Departments',
  'Courses',
  'Fees',
  'Exams',
  'Academic Calendar',
  'Hostel',
  'Library',
  'Clubs',
  'Placements',
  'Scholarships',
  'Policies',
  'Events',
  'Other'
];

const AdminDashboardPage = () => {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedbackSummary, setFeedbackSummary] = useState({ helpful: 0, notHelpful: 0 });
  const [form, setForm] = useState({ title: '', category: 'Admissions' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  const fetchDocuments = async () => {
    try {
      setFetching(true);
      const response = await api.get('/documents');
      setDocuments(response.data?.documents || []);
    } catch (error) {
      console.error('Failed to load documents', error);
    } finally {
      setFetching(false);
    }
  };

  const fetchAdminOverview = async () => {
    try {
      const response = await api.get('/admin/overview');
      setUsers(response.data?.users || []);
      setFeedbackSummary(response.data?.feedbackSummary || { helpful: 0, notHelpful: 0 });
    } catch (error) {
      console.error('Failed to load admin overview', error);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchAdminOverview();
  }, []);

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!file) {
      setError('Please select a PDF document first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', form.title);
    formData.append('category', form.category);

    try {
      setLoading(true);
      setError('');
      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setForm({ title: '', category: 'Admissions' });
      setFile(null);
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.details || err.response?.data?.error || err.response?.data?.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    try {
      await api.delete(`/documents/${documentId}`);
      fetchDocuments();
    } catch (error) {
      console.error('Failed to delete document', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white shadow-lg border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary-600">Admin</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#document-upload"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-white font-semibold hover:bg-primary-700"
            >
              <Upload size={17} />
              Document Upload
            </a>
            <button
              onClick={logout}
              className="rounded-xl bg-slate-900 px-4 py-3 text-white font-semibold hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">Total Documents</span>
              <FileText className="text-primary-600" size={18} />
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{documents.length}</p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">Total Users</span>
              <User2 className="text-primary-600" size={18} />
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{users.filter((account) => account.role !== 'admin').length}</p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">Recent Uploads</span>
              <Database className="text-primary-600" size={18} />
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{documents.length ? 'Live' : '0'}</p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">Helpful Answers</span>
              <span className="text-lg text-green-600">+</span>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{feedbackSummary.helpful}</p>
            <p className="mt-1 text-xs text-slate-500">{feedbackSummary.notHelpful} marked for review</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[420px,1fr] gap-6">
          <div id="document-upload" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 scroll-mt-6">
            <div className="flex items-center gap-2 mb-5">
              <Upload className="text-primary-600" size={18} />
              <h2 className="text-xl font-bold text-slate-900">Upload Document</h2>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Document title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  required
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Academic calendar 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">PDF File</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary-50 file:text-primary-700 file:font-medium"
                />
              </div>

              {error && <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary-600 text-white py-3 font-semibold hover:bg-primary-700 transition disabled:opacity-60"
              >
                {loading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Database className="text-primary-600" size={18} />
                <h2 className="text-xl font-bold text-slate-900">Document Management</h2>
              </div>
              <button
                onClick={fetchDocuments}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Refresh
              </button>
            </div>

            {fetching ? (
              <div className="text-slate-500">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="text-slate-500">No documents uploaded yet.</div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{doc.title}</p>
                      <p className="text-sm text-slate-500">{doc.filename} • {doc.category}</p>
                      <p className="text-xs text-slate-400">Uploaded by {doc.uploadedBy?.name || 'Admin'}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(doc._id)}
                      className="ml-3 rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100"
                      title="Delete document"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <User2 className="text-primary-600" size={18} />
              <h2 className="text-xl font-bold text-slate-900">Users</h2>
            </div>
            {users.length === 0 ? (
              <p className="text-slate-500">No users found.</p>
            ) : (
              <div className="space-y-3">
                {users.map((account) => (
                  <div key={account._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div>
                      <p className="font-semibold text-slate-900">{account.name}</p>
                      <p className="text-sm text-slate-500">{account.email}</p>
                    </div>
                    <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">{account.role}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
