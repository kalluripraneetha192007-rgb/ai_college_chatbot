import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-5xl mx-auto rounded-2xl bg-white shadow-lg border border-slate-200 p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary-600">Welcome</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{user?.name || 'Student'}</h1>
          </div>

          <button
            onClick={logout}
            className="rounded-xl bg-slate-900 text-white px-5 py-3 font-semibold hover:bg-slate-700 transition"
          >
            Logout
          </button>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Role</p>
            <p className="mt-2 text-xl font-bold capitalize">{user?.role || 'student'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Email</p>
            <p className="mt-2 text-xl font-bold">{user?.email || 'n/a'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Status</p>
            <p className="mt-2 text-xl font-bold text-green-600">Authenticated</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
