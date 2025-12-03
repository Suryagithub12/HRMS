import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

const useAuthStore = create((set) => ({
  user: null,
  accessToken: localStorage.getItem("hrms_access") || null,
  refreshToken: localStorage.getItem("hrms_refresh") || null,
  loading: true,

  /* ---------------------------------------------------
     SET AUTH (LOGIN + REFRESH TOKEN SUCCESS)
  ---------------------------------------------------- */
  setAuth: (user, access, refresh) => {
    if (access) localStorage.setItem("hrms_access", access);
    if (refresh) localStorage.setItem("hrms_refresh", refresh);

    set({
      user,
      accessToken: access,
      refreshToken: refresh,
      loading: false,
    });
  },

  /* ---------------------------------------------------
     FINISH INITIAL LOADING (for App.jsx)
  ---------------------------------------------------- */
  finishLoading: () => set({ loading: false }),

  /* ---------------------------------------------------
     AUTO DECODE USER FROM TOKEN (optional support)
  ---------------------------------------------------- */
  loadUserFromToken: () => {
    const token = localStorage.getItem("hrms_access");
    if (!token) return set({ loading: false });

    try {
      const decoded = jwtDecode(token);
      if (!decoded?.sub) return set({ loading: false });

      set({
        user: {
          id: decoded.sub,
          role: decoded.role, // backend sends role?
        },
        accessToken: token,
        refreshToken: localStorage.getItem("hrms_refresh"),
        loading: false,
      });
    } catch (err) {
      console.error("Token decode failed:", err);
      set({ loading: false });
    }
  },

  /* ---------------------------------------------------
     LOGOUT (frontend + backend token kill)
  ---------------------------------------------------- */
  logout: () => {
    localStorage.removeItem("hrms_access");
    localStorage.removeItem("hrms_refresh");

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      loading: false,
    });

    window.location.href = "/login"; // instant redirect
  },
}));

export default useAuthStore;
