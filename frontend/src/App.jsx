import { Container, Stack } from "@chakra-ui/react";
import Navbar from "./components/Navbar";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import { USERS } from "./dummy/dummy";

// updated this after recording. Make sure you do the same so that it can work in production
export const BASE_URL =
  import.meta.env.MODE === "development" ? "http://127.0.0.1:5000/api" : "/api";

function App() {
  const [users, setUsers] = useState(USERS);

  return (
    <Stack minH={"100vh"}>
      {/* Always render the Navbar at the top */}
      <Navbar setUsers={setUsers} />

      {/* Content will change based on the current route */}
      <Container maxW={"1200px"} my={4}>
        <Outlet />
      </Container>
    </Stack>
  );
}

export default App;
