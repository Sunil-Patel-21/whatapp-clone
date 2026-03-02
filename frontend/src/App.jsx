import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/user-login/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "react-hot-toast";
import HomePage from "./components/HomePage";
import { ProtectedRoute, PublicRoute } from "./Protected";
import UserDetails from "./components/UserDetails";
import Status from "./pages/statusSection/Status";
import Setting from "./pages/settingSection/Setting";
import Help from "./pages/settingSection/Help";
import useUserStore from "./store/useUserStore";
import { disconnectSocket, initializeSocket, getSocket } from "./services/chat.service";
import { useChatStore } from "./store/chatStore";
import VideoCallManager from "./pages/videoCall/VideoCallManager";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import ReportsManagement from "./pages/admin/ReportsManagement";
import Analytics from "./pages/admin/Analytics";

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
      <Toaster position="top-right" />
      {user && <VideoCallManager socket={getSocket()} />}

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
            <Route path="/help" element={<Help />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="reports" element={<ReportsManagement />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>

        </Routes>
      </Router>
    </>
  );
}

export default App;
