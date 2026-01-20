// src/main.tsx

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./assets/styles.css";

createRoot(document.getElementById("root")!).render(<App />);
