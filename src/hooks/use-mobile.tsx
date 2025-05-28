import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initialize with a value that won't cause a mismatch with SSR.
  // SSR typically renders as "desktop" (isMobile = false).
  const [isMobile, setIsMobile] = React.useState(false);
  // Track if the component has mounted to switch to client-side values.
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    // Set hasMounted to true after the first render on the client.
    setHasMounted(true);

    // Function to check mobile status.
    // Ensure window is defined (it will be in useEffect).
    const checkIsMobile = () => {
      if (typeof window === 'undefined') return false;
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    
    // Set the initial client-side mobile status.
    setIsMobile(checkIsMobile());

    // Listener for window resize.
    const handleResize = () => {
      setIsMobile(checkIsMobile());
    };

    if (typeof window !== 'undefined') {
        window.addEventListener("resize", handleResize);
    }
    
    // Cleanup listener on unmount.
    return () => {
        if (typeof window !== 'undefined') {
            window.removeEventListener("resize", handleResize);
        }
    };
  }, []); // Empty dependency array: run only on mount and unmount.

  // Before mounting on the client, `hasMounted` is false. Return `false` to match SSR.
  // After mounting, `hasMounted` is true. Return the actual `isMobile` state.
  if (!hasMounted) {
    // During SSR or before client-side mount, assume not mobile to match server render.
    return false; 
  }
  return isMobile;
}
