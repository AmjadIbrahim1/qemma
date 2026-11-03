// frontend/src/pages/TestConnection.jsx
import { useEffect } from "react";
import api from "../services/api";

export default function TestConnection() {
  useEffect(() => {
    async function testBackend() {
      try {
        const res = await api.get("/auth/test");
        console.log("Backend response:", res.data);
      } catch (err) {
        console.error("Cannot reach backend:", err);
      }
    }

    testBackend();
  }, []);

  return (
    <div>
      <h1>Testing Backend Connection...</h1>
      <p>افتح الـ console لتشوف الرد من backend</p>
    </div>
  );
}
