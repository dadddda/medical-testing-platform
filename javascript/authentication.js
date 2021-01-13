/**
 * Performs email and password validation.
 * @param {string} email 
 * @param {string} password 
 */
function validateInput(email, password) {
    var emailLabelClasses = document.getElementById("emailLabel").classList;
    var passwordLabelClasses = document.getElementById("passwordLabel").classList;

    if (emailLabelClasses.contains("error")) {
        assignNormal(emailLabelClasses, "emailLabel", "Enter email:");
    }

    if (passwordLabelClasses.contains("error")) {
        assignNormal(passwordLabelClasses, "passwordLabel", "Enter password:");
    }
    
    answer = true;
    if (!validateEmail(email)) {
        assignError(emailLabelClasses, "emailLabel", "Email invalid!");
        answer = false;
    }

    if (!validatePassword(password)) {
        assignError(passwordLabelClasses, "passwordLabel", "Use A-Z, a-z and 0-9!");
        answer = false;
    }

    return answer;
}

/**
 * Performs email validation.
 * @param {string} email 
 */
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Performs password validation.
 * @param {string} password 
 */
function validatePassword(password) {
    return /[A-Z]/       .test(password) &&
           /[a-z]/       .test(password) &&
           /[0-9]/       .test(password) &&
           password.length >= 8;
}

/**
 * Assigns 'error' class from "authentication.css" CSS to given object
 * and replaces it's inner text with given text using object's ID.
 * @param classes 
 * @param {string} id
 * @param {string} text 
 */
function assignNormal(classes, id, text) {
    classes.remove("error");
    classes.add("normal");
    document.getElementById(id).innerText = text;
}

/**
 * Assigns 'normal' class from "authentication.css" CSS to given object
 * and replaces it's inner text with given text using object's ID.
 * @param classes 
 * @param {string} id
 * @param {string} text 
 */
function assignError(classes, id, text) {
    classes.remove("normal");
    classes.add("error");
    document.getElementById(id).innerText = text;
}
