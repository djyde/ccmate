import { useEffect, useRef } from "react"

export function useOnWindowResize(callback: () => void) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const handleResize = () => {
      callbackRef.current()
    }

    window.addEventListener("resize", handleResize)
    handleResize() // Call once on mount

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])
}