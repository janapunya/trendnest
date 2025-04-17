var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'trendnestshop99@gmail.com',
    pass: 'owvs nipd ngsu xaow'
  }
});

var mailOptions = {
  from: 'trendnestshop99@gmail.com',
  to: 'punyabrata900@gmail.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});