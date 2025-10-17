export default function Index() {
  const commits = [
    { sha: "a1b2c3d", author: "Alice", message: "Initial commit" },
    { sha: "e4f5g6h", author: "Bob", message: "Add new feature" },
    { sha: "i7j8k9l", author: "Charlie", message: "Fix bug" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Git Commits</h1>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-700/50">
            <tr className="border-b border-slate-600">
              <th className="px-4 py-3 text-left text-slate-300 font-semibold">SHA</th>
              <th className="px-4 py-3 text-left text-slate-300 font-semibold">Author</th>
              <th className="px-4 py-3 text-left text-slate-300 font-semibold">Message</th>
            </tr>
          </thead>
          <tbody>
            {commits.map((commit) => (
              <tr key={commit.sha} className="border-b border-slate-700 last:border-0 hover:bg-slate-700/30">
                <td className="px-4 py-3 font-mono text-xs text-blue-400">{commit.sha}</td>
                <td className="px-4 py-3 text-slate-200">{commit.author}</td>
                <td className="px-4 py-3 text-slate-300">{commit.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
