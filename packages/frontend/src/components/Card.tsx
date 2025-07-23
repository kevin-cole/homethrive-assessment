import React, { ReactNode } from "react"

export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => {
  return (
    <div className={`rounded-lg border border-gray-200 shadow-sm bg-white ${className}`}>
      {children}
    </div>
  )
}

export const CardHeader = ({ children, className = "" }: { children: ReactNode; className?: string }) => {
  return (
    <div className={`px-4 py-2 border-b border-gray-200 font-semibold ${className}`}>
      {children}
    </div>
  )
}

export const CardTitle = ({ children, className = "" }: { children: ReactNode; className?: string }) => {
  return (
    <h2 className={`text-lg ${className}`}>
      {children}
    </h2>
  )
}

export const CardContent = ({ children, className = "" }: { children: ReactNode; className?: string }) => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  )
}

export const CardFooter =({ children, className = "" }: { children: ReactNode; className?: string }) => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  )
}
