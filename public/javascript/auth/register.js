// functions
import * as Auth from "./authentication.js";

// variables
let newUid = null;

/**
 * Redirects page to index.html if the user is already logged in.
 */
firebase.auth().onAuthStateChanged(function(user) {
    if (user && !newUid) {
        window.location.replace("index.html");
    }
});

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

    let email = document.getElementById("email").value.toLowerCase();
    let password = document.getElementById("password").value;
    let checkbox = document.getElementById("agreement").checked;

    // validate...
    let answer = true;
    answer = Auth.validateInput(email, password);

    let agreementLabelClasses = document.getElementById("agreementLabel").classList;

    if (agreementLabelClasses.contains("error")) {
        Auth.assignNormal(agreementLabelClasses, "agreementLabel", "I agree to user licence and terms");
    }

    if (checkbox === false) {
        Auth.assignError(agreementLabelClasses, "agreementLabel", "Check this to register!");
        answer = false;
    }
    if (!answer) return;
    
    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
        newUid = userCredential.user.uid;
        let usersRef = firebase.firestore().collection("users");
        usersRef.doc(newUid).set({
            email: email,
            type: "user"
        })
        .then(() => {
            window.location.assign("index.html");
        })
        .catch((error) => {
            let errorCode = error.code;
            let errorMessage = error.message;

            console.log(errorCode);
            console.log(errorMessage);
        });
    })
    .catch((error) => {
        let errorCode = error.code;
        let errorMessage = error.message;

        console.log(errorCode);
        console.log(errorMessage);

        document.getElementById("errorText").style.visibility = "visible";
    });
}
