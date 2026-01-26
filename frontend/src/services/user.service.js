import { axiosInstance } from "./url.service"

export const sendOtp = async(phoneNumber, phoneSuffix, email) =>{
    try {
        const response = await  axiosInstance.post("/auth/send-otp", {phoneNumber: phoneNumber, phoneSuffix, email});
        return response.data;
    } catch (error) {
        throw error.response.data ? error.response.data : error.message;
    }
}


export const verifyOtp = async(phoneNumber, phoneSuffix, email, otp) =>{
    try {
        const response = await  axiosInstance.post("/auth/verify-otp", {phoneNumber: phoneNumber, phoneSuffix, email, otp});
        return response.data;
    } catch (error) {
        throw error.response.data ? error.response.data : error.message;
    }
}

    export const updateUserProfile = async (updateData) => {
    try {
        const response = await axiosInstance.put(
        "/auth/update-profile",
        updateData, // ❗ send FormData directly
        {
            headers: {
            "Content-Type": "multipart/form-data",
            },
        }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
    };


export const checkUserAuth = async () => {
    try {
        const response = await axiosInstance.get("/auth/check-auth");

        if (response.data.status === "success") {
            return {
                isAuthenticated: true,
                user: response.data.data,
            };
        } else {
            return { isAuthenticated: false };
        }
    } catch (error) {
        console.log(error);
        return { isAuthenticated: false };
    }
};


export const logoutUser = async() =>{
    try {
        const response = await  axiosInstance.get("/auth/logout");
        return response.data;
    } catch (error) {
        throw error.response.data ? error.response.data : error.message;
    }
}

export const getAllUsers = async() =>{
    try {
        const response = await  axiosInstance.get("/auth/users");
        console.log("API RESULT:", response);
        return response.data;
    } catch (error) {
        console.error("API ERROR:", error);
        throw error.response.data ? error.response.data : error.message;
    }
}


