import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import ThumbnailPage from "./ThumbnailPage.tsx";
import "./index.css";

const page = window.location.pathname === "/thumbnail" ? <ThumbnailPage /> : <App />;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {page}
  </StrictMode>,
);
