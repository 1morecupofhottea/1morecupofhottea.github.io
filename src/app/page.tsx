"use client";

import { useEffect } from "react";

export default function RootRedirect() {
  useEffect(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === "/" || path === "") {
      window.location.replace("/en/" + hash);
    }
  }, []);
  return null;
}
