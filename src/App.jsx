import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <h1 className="text-4xl font-bold text-sky-400 underline">
          ¡Tailwind v4 + Vite + React funcionando!
        </h1>
      </div>
    </>
  );
}

export default App;
