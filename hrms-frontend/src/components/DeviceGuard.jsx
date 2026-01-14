import React, { useEffect, useState } from "react";

const isMobileOrTablet = () => {
  const ua = navigator.userAgent || "";

  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  const hasTouch =
    navigator.maxTouchPoints > 0 ||
    "ontouchstart" in window;

  const isSmallScreen = window.innerWidth < 1024;

  /**
   * FINAL LOGIC
   *
   * ❌ iOS → always BLOCK (iPhone/iPad)
   * ❌ Android + small screen → BLOCK (mobile / tablet)
   * ❌ Touch + small screen → BLOCK
   *
   * ✅ Android + big screen → ALLOW (Primebook)
   * ✅ Windows / Mac / Linux → ALLOW
   */
  if (isIOS) return true;

  if (isAndroid && isSmallScreen) return true;

  if (!isAndroid && hasTouch && isSmallScreen) return true;

  return false;
};

export default function DeviceGuard({ children }) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setBlocked(isMobileOrTablet());
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    window.addEventListener("orientationchange", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
      window.removeEventListener("orientationchange", checkDevice);
    };
  }, []);

  if (blocked) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600">
            Desktop Access Only
          </h1>
          <p className="mt-3 text-gray-600">
            AgilityAI HRMS can only be accessed on Laptop or Desktop.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
