'use strict';
var nodeMailer = {
    "Mandrill" : {
        host: "smtp.mandrillapp.com", // hostname
        //secureConnection: true, // use SSL
        port: 587, // port for secure SMTP
        auth: {
            user: "mohit.codebrew@gmail.com",
            pass: "8959824569"
        }
    }
};
module.exports = {
    nodeMailer: nodeMailer
};
