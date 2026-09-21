import ChatWidget from "./components/ChatWidget";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      {/* Demo Hero Content */}
      <div className="max-w-2xl text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-violet-400 to-pink-500 bg-clip-text text-transparent">
          TechStore AI Assistant
        </h1>
        <p className="text-slate-400 text-base sm:text-lg">
          Explore our latest smartwatches and tech gear. Click the AI icon at the bottom right to start chatting!
        </p>
      </div>

      {/* Floating AI Chatbot Widget */}
      <ChatWidget />
    </main>
  );
}