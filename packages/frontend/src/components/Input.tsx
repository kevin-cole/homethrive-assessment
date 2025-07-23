import React, { InputHTMLAttributes, ReactNode } from "react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
}

export function Input({ icon, className = "", ...props }: InputProps) {
  return (
    <div className={`flex items-center border border-gray-300 rounded-md px-2 py-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${className}`}>
      {icon && <span className="mr-2 text-gray-500">{icon}</span>}
      <input
        className="flex-grow outline-none border-none bg-transparent text-gray-900"
        {...props}
      />
    </div>
  )
}