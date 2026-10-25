"use client";

import { useSyncExternalStore } from "react";

const SERVER_COPYRIGHT_YEAR = "2026";

function subscribe() {
  return () => {};
}

function getCurrentYear() {
  return String(new Date().getFullYear());
}

function getServerYear() {
  return SERVER_COPYRIGHT_YEAR;
}

export default function CurrentYear() {
  const year = useSyncExternalStore(subscribe, getCurrentYear, getServerYear);
  return year;
}
