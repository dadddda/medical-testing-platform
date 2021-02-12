// functions
import {fadeAndReplace} from "../utils/utils.js";
import * as Auth from "./authentication.js";

// variables
let newUid = null;

/**
 * Redirects page to index.html if the user is already logged in.
 */
firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
        document.getElementById("registerForm").addEventListener("submit", registerUser);
        document.getElementById("loginBtn").addEventListener("click", function() {
            fadeAndReplace("login.html");
        });
        document.body.style.display = "flex";
    } else if (user && !newUid) {
        fadeAndReplace("index.html");
    }
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
            fadeAndReplace("index.html");
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
