"use client";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    fetch("https://countries.trevorblades.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query {
            countries {
             
              name
              emoji
            }
          }
        `,
      }),
    })
      .then((res) => res.json())
      .then((data) => console.log(data));
  }, []);

  return <div>Check console</div>;
}

export default App;
