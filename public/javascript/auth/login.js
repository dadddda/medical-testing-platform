// functions
import {fadeAndReplace} from "../utils/utils.js";

/**
 * Redirects page to index.html if the user is already logged in.
 */
firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
        document.getElementById("loginForm").addEventListener("submit", loginUser);
        document.getElementById("registerBtn").addEventListener("click", function() {
            fadeAndReplace("register.html");
        });
        document.body.style.display = "flex";
    } else {
        fadeAndReplace("index.html");
    }
});

/**
 * Performs user login.
 * @param event 
 */
function loginUser(event) {
    event.preventDefault();

    let email = document.getElementById("email").value.toLowerCase();
    let password = document.getElementById("password").value;

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
        // 'onAuthStateChanged()' handles login action
    })
    .catch((error) => {
        let errorCode = error.code;
        let errorMessage = error.message;

        console.log(errorCode);
        console.log(errorMessage);
        
        document.getElementById("errorText").style.visibility = "visible";
    });
}
