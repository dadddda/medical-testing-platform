/**
 * Event listener for login form.
 */
document.getElementById("loginForm").addEventListener("submit", loginUser);

/**
 * Event listener for redirection to registration page.
 */
document.getElementById("registerBtn").addEventListener("click", function() {
    window.location.assign("register.html");
});

/**
 * Performs user login.
 * @param event 
 */
function loginUser(event) {
    event.preventDefault();

    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then((user) => {
        window.location.assign("index.html");
    })
    .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        
        document.getElementById("errorText").style.visibility = "visible";
    });
}
