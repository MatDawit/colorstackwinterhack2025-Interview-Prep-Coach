export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-white pt-24 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Profile
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your account details and preferences.
        </p>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-600 font-semibold">U</span>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">Guest User</p>
              <p className="text-sm text-gray-600">Not signed in</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <button className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50">
              Sign in
            </button>
            <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Create account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
