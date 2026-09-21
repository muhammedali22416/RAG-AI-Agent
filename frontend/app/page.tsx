import ChatWidget from "./components/ChatWidget";

export default function Home() {
  return (
    <main style={{ backgroundColor: 'transparent' }} className="min-h-screen">
      {/* Floating AI Chatbot Widget */}
      <ChatWidget />
    </main>
  );
}