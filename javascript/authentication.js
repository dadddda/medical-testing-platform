/**
 * Performs email and password validation.
 * @param {string} email 
 * @param {string} password 
 */
function validateInput(email, password) {
    answer = true;

    if (!validateEmail(email)) {
        document.getElementById("emailLabel").innerText = "Email invalid!";
        document.getElementById("emailLabel").style.color = "red";
        answer = false;
    }

    if (!validatePassword(password)) {
        document.getElementById("passwordLabel").innerText = "Password invalid!";
        document.getElementById("passwordLabel").style.color = "red";
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
