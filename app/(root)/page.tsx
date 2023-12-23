"use client";

import { useState } from "react";

export default function Home() {
  const [click, setClick] = useState(false);

  const onClick = () => {
    console.log("click");
  };
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <form>
        <div className="relative z-0 w-full mb-6 group">
          <input
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            // type="number"
            min="0"
            max="1000"
            required
            id="number"
            placeholder="URL"
          />
        </div>
        <div className="flex justify-center items-center mb-10">
              <button
                type="submit"
                onClick={onClick}
                className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2"
              >
                Click
              </button>
            </div>
      </form>
    </main>
  );
}
