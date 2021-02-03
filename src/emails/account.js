const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


//Method to send a welcome email when a user creates a new account
const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'christinesalim@gmail.com',
    subject: 'Thanks for joining',
    text: `Welcome to the app, ${name}. Let me know how you get along with the app`
  });
  
} 

//Method to send a goodbye email when user deletes their profile
const sendCancelEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'christinesalim@gmail.com',
    subject: 'Sorry to see you go',
    text: `Goodbye ${name}. We are sad you are leaving. Let us know if there is anything we can do to get you back.`
  });
  
}

module.exports = {
  sendWelcomeEmail,
  sendCancelEmail
}