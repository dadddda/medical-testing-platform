/**
 * Event listener for registration form.
 */
document.getElementById("registerForm").addEventListener("submit", registerUser);

/**
 * Event listener for redirection to login page.
 */
document.getElementById("loginBtn").addEventListener("click", function() {
    window.location.assign("login.html");
});

/**
 * Performs user registration.
 * @param event 
 */
function registerUser(event) {
    event.preventDefault();

    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var checkbox = document.getElementById("agreement").checked;

    // validate...
    answer = true;
    answer = validateInput(email, password);

    var agreementLabelClasses = document.getElementById("agreementLabel").classList;

    if (agreementLabelClasses.contains("error")) {
        assignNormal(agreementLabelClasses, "agreementLabel", "I agree to user licence and terms");
    }

    if (checkbox === false) {
        assignError(agreementLabelClasses, "agreementLabel", "Check this to register!");
        answer = false;
    }
    if (!answer) return;

    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((user) => {
        window.location.assign("index.html");
    })
    .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;

        document.getElementById("errorText").style.visibility = "visible";
    });
}
