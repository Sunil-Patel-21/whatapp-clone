import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/user-login/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HomePage from "./components/HomePage";
import { ProtectedRoute, PublicRoute } from "./Protected";
import UserDetails from "./components/UserDetails";
import Status from "./pages/statusSection/Status";
import Setting from "./pages/settingSection/Setting";
import useUserStore from "./store/useUserStore";
import { disconnectSocket, initializeSocket } from "./services/chat.service";
import { useChatStore } from "./store/chatStore";

function App() {
  const {user} = useUserStore();
  const {setCurrentUser, initializeSocketListeners, cleanup} = useChatStore();

  useEffect(()=>{
    if(user?._id){
      const socket = initializeSocket();

      if(socket){
        setCurrentUser(user);
        initializeSocketListeners();
      }

    }
    return ()=>{
      cleanup();
      disconnectSocket()
    }
  },[user,setCurrentUser,initializeSocketListeners,cleanup])

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <Router>
        <Routes>

          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/user-login" element={<Login />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/user-profile" element={<UserDetails />} />
            <Route path="/status" element={<Status />} />
            <Route path="/setting" element={<Setting />} />
          </Route>

        </Routes>
      </Router>
    </>
  );
}

export default App;
