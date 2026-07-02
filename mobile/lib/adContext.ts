import { createContext, useContext } from 'react'

export const AdContext = createContext(false)
export const useAdsReady = () => useContext(AdContext)
