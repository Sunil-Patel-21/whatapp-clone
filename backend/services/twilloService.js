const twilio = require('twilio')

// twilio credentials
const accountSid = process.env.TWILLO_ACCOUNT_SID;
const authToken = process.env.TWILLO_AUTH_TOKEN;
const serviceSid = process.env.TWILLO_SERVICE_SID;

const client = twilio(accountSid, authToken);

// send otp to phone number
const sendOtpToPhoneNumber = async (phoneNumber) => {
    try {
        console.log("sending otp to number : ",phoneNumber);
        if(!phoneNumber){
            throw new Error("Please provide a valid phone number");
        }
            const response = await client.verify.v2
                            .services(serviceSid)
                            .verifications.create({
                                to: phoneNumber,      // ✅ DO NOT add +91 here
                                channel: "sms",
                            });
        console.log("This is otp response",response);
        return response
    } catch (error) {
        console.error("Error sending OTP:", error.message);
        throw new Error("Failed to send OTP");
    }
}


// send otp to phone number
const verifyOtp = async (phoneNumber,otp) => {
    try {
        console.log("sending otp to number : ",phoneNumber);
        console.log("This is otp : ", otp);
        const response = await client.verify.v2
            .services(serviceSid)
            .verificationChecks.create({
                to: phoneNumber,   // ✅ must be full number
                code: otp,
        });
        console.log("This is otp response",response);
        return response
    } catch (error) {
        console.error(" OTP verification failed:", error.message);
        throw new Error("Failed to verify OTP");
    }
}

module.exports = {
    sendOtpToPhoneNumber,
    verifyOtp
}