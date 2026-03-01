import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAdminStore = create(
    persist(
        (set) => ({
            admin: null,
            isAuthenticated: false,

            setAdmin: (adminData) =>
                set({
                    admin: adminData,
                    isAuthenticated: true,
                }),

            clearAdmin: () =>
                set({
                    admin: null,
                    isAuthenticated: false,
                }),
        }),
        {
            name: "admin-storage",
            partialize: (state) => ({
                admin: state.admin,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export default useAdminStore;
