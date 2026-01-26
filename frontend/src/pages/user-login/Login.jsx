import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useLoginStore from '../../store/useLoginStore'
import countries from '../../utils/Countries';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import useUserStore from '../../store/useUserStore';
import { set, useForm } from 'react-hook-form';
import useThemeStore from '../../store/themeStore';
import { FaArrowLeft, FaChevronCircleDown, FaChevronDown, FaPlus, FaUser, FaWhatsapp } from "react-icons/fa";
import { motion } from 'framer-motion';
import Spinner from '../../utils/Spinner';
import { sendOtp, updateUserProfile, verifyOtp } from '../../services/user.service';
import { toast } from 'react-toastify';

  const avatars = [
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe',
]


// validate schema
const loginValidationSchema = yup
.object()
.shape({
  phoneNumber: yup
    .string()
    .nullable()
    .notRequired()
    .matches(/^[0-9]{10}$/, "Please enter a valid phone number")
    .transform((value,originalValue)=>originalValue
    .trim() === "" ? null : value),
  email: yup
    .string()
    .nullable()
    .notRequired()
    .email("Please enter a valid email")
    .transform((value,originalValue)=>originalValue
    .trim() === "" ? null : value),
}).test(
    "at-least-one",
    "Either email or phone number is required",
    function (value) {
      return !!(value.phoneNumber || value.email);
    }
);

const otpValidationSchema = yup.object().shape({
  otp: yup.string().length(6, "Please enter a valid otp").matches(/^[0-9]{6}$/, "Please enter a valid otp").required("Please enter a valid otp")
})


const profileValidationSchema = yup.object().shape({
  username : yup.string().required("Please enter a username"),
  agreed : yup.boolean().oneOf([true], "Please agree to terms and conditions"),
})



function Login() {
  const {step, setStep, userPhoneData, setUserPhoneData, resetLoginState} = useLoginStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectCountry, setSelectCountry] = useState(countries[0]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDropDown, setShowDropDown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const {setUser} = useUserStore();

  const {theme,setTheme} = useThemeStore();

  const navigate = useNavigate();

  const {
    register:loginRegister,
    handleSubmit:handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm({
    resolver: yupResolver(loginValidationSchema)
  });

  const {
    handleSubmit:handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue: setOtpValue
  } = useForm({
    resolver: yupResolver(otpValidationSchema)
  });

  const {
    register:profileRegister,
    handleSubmit:handleProfileSubmit,
    formState: { errors: profileErrors },
    watch
  } = useForm({
    resolver: yupResolver(profileValidationSchema)
  });

  const filterCounties = countries.filter((country)=>{
    return country.name.toLowerCase().includes(searchTerm.toLowerCase()) || country.dialCode.toLowerCase().includes(searchTerm);
  })

  
const onLoginSubmit = async () => {
  try {
    setLoading(true);
    let response;
    
    if (email) {
      // Agar email provide kiya gaya hai
      response = await sendOtp(null, null, email);
      
      if (response.status === "success") {
        toast.info("OTP is sent to your email");
        setUserPhoneData({ email });
        setStep(2);
      }
    } else if (phoneNumber) {
      // Agar phone number provide kiya gaya hai
      response = await sendOtp(phoneNumber, selectCountry.dialCode, null);
      console.log("Response : ", response);
      
      if (response?.status === "success") {
        toast.info("OTP is sent to your phone number");
        setUserPhoneData({ phoneNumber, phoneSuffix: selectCountry.dialCode });
        setStep(2);
      }
    }
  } catch (error) {
    console.log(error);
    setError(error.message || "Failed to send otp"); // 'set' ko 'setError' karein
  } finally {
    setLoading(false);
  }
};


const onOtpSubmit = async () => {
  try {
    setLoading(true);

    if (!userPhoneData) {
      throw new Error("Phone or email data is missing");
    }

    const otpString = otp.join("");
    let response;

    if (userPhoneData?.email) {
      response = await verifyOtp(
        null,
        null,
        userPhoneData.email,
        otpString
      );
    } else {
      response = await verifyOtp(
        userPhoneData.phoneNumber,
        userPhoneData.phoneSuffix,
        null,
        otpString
      );
    }

    if (response.status === "success") {
      toast.success("OTP verified successfully");

      const user = response.data?.user;

      if (user?.username && user?.profilePicture) {
        setUser(user);
        toast.success("Welcome back to WhatsApp");
        navigate("/");
        resetLoginState();
      } else {
        setStep(3);
      }
    }
  } catch (error) {
    console.log(error);
    toast.error(error.message || "Failed to verify OTP");
  } finally {
    setLoading(false);
  }
};


const handleFileChange = (e)=>{
  const file = e.target.files(0);
  if(file){
    setProfilePictureFile(file);
    setProfilePicture(URL.createObjectURL(file));
  }
}

const onProfileSubmit = async (data) => {
  try {
    setLoading(true);

    const formData = new FormData();
    formData.append("username", data.username);    
    formData.append("agreed", String(data.agreed));

    if (profilePictureFile) {
      formData.append("profilePicture", profilePictureFile);
    } else {
      formData.append("profilePicture", selectedAvatar);
    }    
    await updateUserProfile(formData);

    toast.success("Profile updated successfully");
    navigate("/");
    resetLoginState();

  } catch (error) {
    console.error(error);
    toast.error(error?.message || "Failed to update profile");
  } finally {
    setLoading(false);
  }
};


const handleOtpChange = (index,value)=>{
  const newOtp = [...otp];
  newOtp[index] = value;
  setOtp(newOtp);
  setOtpValue("otp",newOtp.join(""));
  if(value && index < 5){
    document.getElementById(`otp-${index+1}`).focus();
  }
}



const handleBack = ()=>{
  setStep(1);
  setUserPhoneData(null);
  setOtp(["", "", "", "", "", ""]);
  setError('');
}

  const ProgressBar = ()=>(
    <div className={`w-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2.5 mb-6`}>
      <div className='bg-green-500 h-full rounded-full transition-all duration-500 ease-in-out' style={{ width: `${(step)/3 *100}%` }}>

      </div>
    </div>
  )

  return (
    <div
    className={`min-h-screen ${
      theme === "dark" 
      ? "bg-gray-900" 
      : "bg-gradient-to-br from-green-400 to-blue-500"} flex items-center justify-center p-4 overflow-hidden`}
    >

      <motion.div
      initial={{ opacity:0,y:-50 }}
      animate={{ opacity:1,y:0 }}
      transition={{ duration: 0.5 }}
      className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white "} p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md relative z-10`}
      >

        <motion.div
          initial={{ scale:0 }}
          animate={{ scale:1 }}
          transition={{ duration: 0.2, type: "spring", stiffness: 260, damping: 20 }}
          className='w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center'
        >
          <FaWhatsapp className='w-16 h-16 text-white'/>

        </motion.div>

        <h1 className={`text-3xl font-bold text-center mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
          WhatApp Login
        </h1>

        <ProgressBar />

        {error && <p className='text-red-500  text-center mb-4'>{error}</p>}

      {step==1 && (
        <form className='space-y-4' onSubmit={handleLoginSubmit(onLoginSubmit)}>

          <p className={`text-center ${theme === "dark" ? "text-gray-300" : "text-gray-600"} mb-4`}>
            Enter Your Mobile Number
          </p>

          <div className='relative'>

            <div className='flex'>
                <div className='relative w-1/3'>

                  <button 
                    type='button' 
                      className={`  inline-flex shrink-0 z-10 items-center py-2.5 px-4 text-sm font-medium text-center ${theme === "dark" ? "text-white bg-gray-700 border-gray-600" : "text-gray-900 bg-gray-100 border-gray-300"} border rounded-s-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100`}
                      onClick={()=> setShowDropDown(!showDropDown)}
                    >
                      <span className=''>{selectCountry.flag} {selectCountry.dialCode}</span>
                      <FaChevronDown />
                      
                    </button>

                    {
                      showDropDown &&(                      
                      <div className={`absolute z-10 w-full mt-1 ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-800"} border rounded-md shadow-lg max-h-60 overflow-auto`}> 
                        <div className={`sticky top-0 ${theme === "dark" ? "bg-gray-700 " :"bg-white"} p-2`}>
                          <input type="text"  
                            placeholder='Search Countries...'
                            value={searchTerm}
                            onChange={(e)=> setSearchTerm(e.target.value)}
                            className={`w-full px-2 py-1 border ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300 text-gray-800"} rounded-md  text-sm focus:outline-none focus:ring-2 focus:ring-green-500`}
                          />
                        </div>
                        {
                          filterCounties.map((country)=>{
                            return(
                              <button
                                key={country.alpha2}
                                type='button'
                                className={`w-full text-left px-3 py-2 ${theme === "dark" ? "bg-gray-600 " :"bg-gray-100 text-black"} focus:outline-none focus:bg-gray-100`}
                                onClick={()=>{
                                  setSelectCountry(country)
                                  setShowDropDown(false)
                                }}
                              >{country.flag} {country.dialCode} {country.name}</button>
                            )
                          })
                        }
                      </div>
                      )}

                </div>
                <input type="text"
                  {...loginRegister("phoneNumber")}
                  value={phoneNumber}
                  onChange={(e)=>setPhoneNumber(e.target.value)}
                  className={`w-2/3 px-4 py-2 font-medium border ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-800"} rounded-r-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${loginErrors.phoneNumber ? "border-red-500":""}`}
                  placeholder='Enter your mobile number'
                />
            </div>
            {
              loginErrors.phoneNumber && (
                <p className='text-red-500 text-sm mt-1'>{loginErrors.phoneNumber.message}</p>
              )
            }

          </div>
          
          {/* or condition  */}

          <div className='flex items-center my-4'>
            <div className='flex-grow h-px bg-gray-500 ' />
            <span className='mx-3 text-gray-500 text-sm font-medium'>OR</span>
            <div className='flex-grow h-px bg-gray-500 ' />
          </div>

          {/* email input box  */}
          <div className={`flex items-center border rounded-md px-3 py-2 ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}>
            <FaUser className={`mr-2 text-gray-400 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}/>
            <input type="email"
              {...loginRegister("email")}
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              className={`w-full bg-transparent focus:outline-none ${theme === "dark" ? " text-white" : "text-black "} ${loginErrors.email ? "border-red-500":""}`}
              placeholder='Email (optional)'
            />
          </div>
          {
              loginErrors.email && (
                <p className='text-red-500 text-sm mt-1'>{loginErrors.email.message}</p>
              )
          }

          <button
            type='submit'
            className='w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition duration-300 ease-in-out'
          >{loading  ? <Spinner /> : "Send OTP"}</button>

        </form>
      )}

      {step ===2 &&(
        <form 
          onSubmit={handleOtpSubmit(onOtpSubmit)}
          className='space-y-4'
        >

          <p className={`text-center ${theme === "dark" ? "text-gray-300" : "text-gray-800"} mb-4`}>
            Please enter the 6 digit otp send to your { userPhoneData ?userPhoneData.phoneSuffix : "Email"} {""} { userPhoneData && userPhoneData.phoneNumber }
          </p>

          <div className='flex justify-between'>
              {otp.map((digit,index)=>(
                <input type="text" 
                  key={index}
                  id={ `otp-${index}`}
                  max={1}
                  value={digit}
                  onChange={(e)=> handleOtpChange(index,e.target.value)}
                  className={`w-12 h-12 text-center border 
                    ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" 
                    : "bg-white border-gray-300 text-gray-800"} 
                    rounded-md focus:outline-none focus:ring-2 focus:ring-green-500
                    ${otpErrors.otp ? "border-red-500":""}`}
                />
              ))}

              </div>
              {
                otpErrors.otp && (
                  <p className='text-red-500 text-sm mt-1'>{otpErrors.otp.message}</p>
                )
              }
              <button
                type='submit'
                className='w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition duration-300 ease-in-out'
              >{loading  ? <Spinner /> : "Verify OTP"}</button>
              
              <button
                type="button"
                onClick={handleBack}
                className={`
                  w-full mt-3 px-4 py-2.5 rounded-lg
                  flex items-center gap-2 justify-center
                  font-medium transition-all duration-300 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                  active:scale-[0.98]
                  ${theme === "dark"
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-offset-gray-800"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-offset-white"}
                `}
              >
                <FaArrowLeft className="text-sm" />
                <span>Wrong number? Go back</span>
              </button>

          
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className='space-y-4'>

          <div className='flex flex-col items-center mb-4'>
            <div className='relative w-24 h-24 mb-2'>
              <img 
                src={profilePicture || selectedAvatar} 
                alt="userProfile" 
                className='w-full h-full rounded-full object-cover' 
              />
              <label 
                htmlFor="profilePicture" 
                className='absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full cursor-pointer hover:bg-green-600 transition duration-300 ease-in-out'
              >
                <FaPlus className='w-4 h-4'/>
              </label>

              <input type="file"
                id='profilePicture'
                accept='images/*'
                onChange={handleFileChange}
                className='hidden'
              />
            </div>

            <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-500"} mb-2`}>
              Choose an avatar
            </p>
            <div className='flex flex-wrap justify-center gap-2'>
              {
                avatars.map((avatar,index)=>(
                  <img 
                    key={index}
                    src={avatar}  
                    alt="avatar"
                    className={`w-12 h-12 rounded-full cursor-pointer transition duration-300 ease-in-out transform hover:scale-110 ${selectedAvatar === avatar ? "ring-2 ring-green-500" : ""}`}
                    onClick={() => setSelectedAvatar(avatar)}
                  />
              ))}

            </div>

          </div>

          <div className='relative'>
            <FaUser 
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
            />

            <input type="text"
              {...profileRegister("username")}
              placeholder='username'
              className={`w-full py-2 pl-10 pr-3 border ${
                theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-800"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
            />

            {profileErrors.username && (
              <p className='text-red-500 text-sm mt-1'>{profileErrors.username.message}</p>
            )}

          </div>

          <div className='flex items-center space-x-2'>
            <input type="checkbox"  id='terms'
              {...profileRegister("agreed")}
              className={`rounded ${theme === "dark" ? "bg-gray-700 text-green-500" : "text-green-500"} focus:ring-2 focus:ring-green-500`}
            />

            <label htmlFor="terms"
              className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}
            >
              I agree to the <a href="#" className='text-red-500 hover:underline'>terms and conditions</a>
            </label>
          </div>
          {profileErrors.agreed && (
              <p className='text-red-500 text-sm mt-1'>{profileErrors.agreed.message}</p>
          )}

        <button
          type='submit'
          disabled={!watch("agreed") || loading}
          className={`w-full bg-green-500 text-white font-bold py-3 px-4 rounded-md
            hover:bg-green-600 transition hover:scale-105 items-center justify-center text-lg
            duration-300 ease-in-out
            ${(!watch("agreed") || loading) ? "opacity-50 cursor-not-allowed" : ""}`}
        >

            {loading  ? <Spinner /> : "Create Profile"}
          </button>
        </form>
      )}
      </motion.div>
      
    </div>
  )
}

export default Login
