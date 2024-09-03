import UserGrid from "./../components/UserGrid";
import { useState } from "react";
import { USERS } from "./../dummy/dummy";

// updated this after recording. Make sure you do the same so that it can work in production
export const BASE_URL =
  import.meta.env.MODE === "development" ? "http://127.0.0.1:5000/api" : "/api";

function Home() {
  console.log(USERS);

  const [users, setUsers] = useState(USERS);

  return <UserGrid users={users} setUsers={setUsers} />;
}

export default Home;
