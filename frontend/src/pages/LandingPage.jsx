import { ArrowRight, MessageSquareText, ShieldCheck, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-100 p-2 text-primary-700">
              <MessageSquareText size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-900">College RAG</p>
              <p className="text-xs text-slate-500">Knowledge assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Login
            </Link>
            <Link to="/register" className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary-600">Smart college support</p>
            <h1 className="mt-4 text-5xl font-black tracking-tight text-slate-900">
              Ask your campus questions in plain English.
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-xl">
              Get instant answers from admissions, departments, fees, scholarships, academic rules, and college policies using a document-aware AI assistant.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-700">
                Get Started <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-100">
                Student Login
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 shadow-xl p-6">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
              <p className="text-sm font-semibold text-slate-700">Sample conversation</p>
              <div className="mt-4 space-y-3">
                <div className="ml-auto max-w-xs rounded-2xl bg-primary-600 px-4 py-3 text-sm text-white">
                  What is the hostel fee?
                </div>
                <div className="max-w-md rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  Based on the college knowledge base, the hostel fee is mentioned in the hostel policy document and may vary by accommodation type.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-primary-100 p-3 text-primary-700">
              <MessageSquareText size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">RAG-powered answers</h3>
            <p className="mt-3 text-slate-600">Responses are grounded in uploaded college PDFs and official knowledge sources.</p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-primary-100 p-3 text-primary-700">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Trustworthy guidance</h3>
            <p className="mt-3 text-slate-600">The bot avoids guessing and responds with source-backed information only.</p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-primary-100 p-3 text-primary-700">
              <UploadCloud size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Admin document control</h3>
            <p className="mt-3 text-slate-600">Admins can upload, review, and remove college documents that feed the assistant.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
