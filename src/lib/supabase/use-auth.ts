"use client";
import { useSyncExternalStore } from "react";
import { getAuthState, getServerAuthState, getSyncStatus, subscribeAuth } from "./auth";

export function useAuth() {
  return useSyncExternalStore(subscribeAuth, getAuthState, getServerAuthState);
}

export function useSyncStatus() {
  return useSyncExternalStore(subscribeAuth, getSyncStatus, () => null);
}
