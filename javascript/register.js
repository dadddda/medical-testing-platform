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
    validateInput(email, password);

    if (checkbox === false) {
        document.getElementById("agreementLabel").innerText = "Check this to register!";
        document.getElementById("agreementLabel").style.color = "red";
        return;
    }

    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((user) => {
        window.location.assign("index.html");
    })
    .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        
        console.log(errorCode);
        console.log(errorMessage);
    });
}
