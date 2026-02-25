import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

const Options = () => {
  const [color, setColor] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [like, setLike] = useState<boolean>(false);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    chrome.storage.sync.get(
      { favoriteColor: "red", likesColor: true },
      (items) => {
        setColor(items.favoriteColor);
        setLike(items.likesColor);
      }
    );
  }, []);

  useEffect(() => () => clearTimeout(statusTimeoutRef.current), []);

  const saveOptions = useCallback(() => {
    clearTimeout(statusTimeoutRef.current);
    chrome.storage.sync.set({ favoriteColor: color, likesColor: like }, () => {
      setStatus("Options saved.");
      statusTimeoutRef.current = setTimeout(() => setStatus(""), 1000);
    });
  }, [color, like]);

  return (
    <>
      <div>
        Favorite color: <select
          value={color}
          onChange={(event) => setColor(event.target.value)}
        >
          <option value="red">red</option>
          <option value="green">green</option>
          <option value="blue">blue</option>
          <option value="yellow">yellow</option>
        </select>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={like}
            onChange={(event) => setLike(event.target.checked)}
          />
          I like colors.
        </label>
      </div>
      <div>{status}</div>
      <button onClick={saveOptions}>Save</button>
    </>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);
