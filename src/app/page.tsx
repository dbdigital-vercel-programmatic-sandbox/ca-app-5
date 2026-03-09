import TicTacToe from "./components/TicTacToe";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
      </div>
      
      <main className="relative z-10">
        <TicTacToe />
      </main>
    </div>
  );
}
