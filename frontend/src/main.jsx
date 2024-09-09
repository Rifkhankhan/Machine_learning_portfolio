import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

import { ChakraProvider } from "@chakra-ui/react";
import View from "./screens/View.jsx";
import About from "./screens/About.jsx";
import Contact from "./screens/Contact.jsx";
import Home from "./screens/Home.jsx";

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route index element={<Home />} /> {/* Default route */}
      <Route path="home" element={<Home />} />
      <Route path="model/:id" element={<View />} />
      <Route path="about" element={<About />} />
      <Route path="contact" element={<Contact />} />
    </Route>
  )
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ChakraProvider>
      <RouterProvider router={router} />
    </ChakraProvider>
  </StrictMode>
);
