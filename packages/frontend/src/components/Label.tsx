import React, { ReactNode } from "react"

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <label className={`block mb-1 font-semibold text-gray-700 ${className}`}>
      {children}
    </label>
  )
}