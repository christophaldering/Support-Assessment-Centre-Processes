"use client";

import { createContext, useContext } from "react";

export interface BdpUser {
  id: string;
  code: string;
  role: string;
  isAdmin: boolean;
  environment: string;
  photoUrl?: string;
  viewMode: string;
  uiPreset: string;
}

export interface BdpContextType {
  user: BdpUser | null;
  loading: boolean;
  refetchUser: () => void;
}

export const BdpContext = createContext<BdpContextType>({ user: null, loading: true, refetchUser: () => {} });
export const useBdp = () => useContext(BdpContext);
