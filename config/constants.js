const invoicePath = 'public/invoices';
const invoiceFileType = '.pdf'

const twilio = {
    "accountSid": "ACf626c916cc83c6d3a22138775a0256e0",
    "authToken": "7b0b010877ca39f77457f60da947b082",

}
const weburl = {
    url: "https://ss.stagingsdei.com:3531"
    // url:"http://localhost:4200"


}
const adminURL = {
    url: "http://54.190.192.105:6081"
    // url:"http://localhost:3531"
}
const jwtsecret = {

    "secret": "totalcabsmobility@x0451231",//updated on 22/12/2018
    // "FCM_KEY":"AAAANK2whSg:APA91bExAfx_No81HPWISrCebxyrfQ2NCDlTFCdzuPgIjMURdiPR30PL_VyHKIA9gFkcyt6_J7ZqnyAstrubkzap-LC-R-nQ_LyyBgjSD_QgpPHTceoziQab-fsAj6FHkOM1FEmPwy2E"
}




const validationMessages = {
    "emailAlreadyExist": "Phone/Email Already exist",
    "phoneAlreadyExist": "Phone Already registered",
    "wrongPassword": "you have entered wrong password",
    "passwordNotreset": "Reset password Link has been expired ",
    "requiredFieldmissing": "Please fill the required fields",
    "invalidImage": "Please enter valid image",
    "invalidVideo": "Please enter valid video format",
    "intenalError": "Something went wrong,please try again later",
    "Invalidcredential": "Invalid credentials",
    "Invalidotp": "Invalid verification code",
    // "nof":"Invalid verification code",
}

const messages = {
    "Emailnotverified": 'Email not verified',
    "Phoneverified":"Phonenumber is not verified",
    "loginSuccess": "Login successfull",
    "loginerror":"You are not registered Driver",
    "accountActivation": "Your account is temporary suspended",
    "accountDeleted": "Your account has been deleted",
    "Emailnotexist": "Email address does not exist",
    "phonenotexist": "Phone number  does not exist",
    "userNotExist": "User does not found",
    "driverDataUpdated":"Driver updated successfully",
    "driverDataFetched": "Driver data fetched successfully",
    "BookingConfirmed": "Your booking is Confirmed",
    "BookingUpdate": "Your booking is Updated",
    "BookingCancelled":"Your Booking is canceled",
    "customerDataFetched": "customer data fetched successfully ",
    "JobdataFetched" :"job data fetched successfully",
    "jobdataCancelled":"Your Job is cancelled succesfully",
    "sumDataFetched": "sum data fetched successfully ",
    "customerDataUpdated": "customer data updated successfully ",
    "incorrectPassword": "Please enter correct password",
    "AreaCodeAdded": "Area Code is ready",
    "logoutsuccessfull": "Log out Successfully",
    "passwordResetSuccessfully":"Password has been reset successfully",
    "forgotpasswordlink":"Forgot password link has been sent to your email",
    "ImageuploadSuccessfully":"Image has been uploaded successfuly",
    "VideouploadSuccessfully":"Video has been uploaded successfuly",
    "Accountnotapproved":"Profile has not been approved yet",
    "PasswordChanged":"Password has been changed successfully",
    "otpsend":"Verification code has been send to your Mobileno.",
    "transactionListFetch":"Payment list fetched successfully ",
    "transactionDetailsFetch":"Payment details fetched successfully ",
    "transactionSatusFetch":"Payment Status fetched successfully ",
    "invoiceMailSent":"Invoice has sent to the mail",
    "dispatchJobs":"Dispatch job list fetched successfully ",
    "SOMETHING_WENT_WRONG":'Somthing Went Wrong. please try again!'

}

const responseText = {
    invoiceGenerated: 'Invoice has been Successfully generated!.'
}

const config = {
    "cryptoAlgorithm": "aes-256-ctr",
    "cryptoPassword": 'd6F3Efeq789(&&^#$',
    "secret": "Up-nextEntertainment@31$^&"
}



module.exports = {
    twilio,
    jwtsecret,
    weburl,
    messages,
    config,
    responseText,
    validationMessages,
    invoicePath,
    invoiceFileType,
    adminURL
}