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
import ANN from "./screens/ANN.jsx";
import CNN from "./screens/CNN.jsx";
import ViewCNN from "./screens/ViewCNN.jsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route index element={<Home />} /> {/* Default route */}
      <Route path="home" element={<Home />} />
      <Route path="model/:id" element={<View />} />
      <Route path="ann" element={<ANN />} />
      <Route path="cnn" element={<CNN />} />
      <Route path="cnn/:id" element={<ViewCNN />} />
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
