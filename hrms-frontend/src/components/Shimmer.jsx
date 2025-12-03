import React from "react";

export default function Shimmer({ className = "h-6 w-full" }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />;
}
