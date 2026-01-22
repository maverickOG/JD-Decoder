import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import JobDescriptionDecoder from "@/pages/JobDescriptionDecoder";

function App() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <JobDescriptionDecoder />
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
