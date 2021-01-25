/**
 * Redirects page to index.html if the user is already logged in.
 */
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        window.location.replace("index.html");
    }
});

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

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then((user) => {
        window.location.assign("index.html");
    })
    .catch((error) => {
        let errorCode = error.code;
        let errorMessage = error.message;

        console.log(errorCode);
        console.log(errorMessage);
        
        document.getElementById("errorText").style.visibility = "visible";
    });
}
