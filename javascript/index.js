/**
 * Redirects page to login.html if the user isn't logged in.
 */
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // ...
    } else {
        window.location.replace("login.html");
    }
});

/**
 * Event listener for logout button.
 */
document.getElementById("logoutBtn").addEventListener("click", function() {
    firebase.auth().signOut()
    .then((user) => {
        window.location.assign("login.html");
    })
    .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        
        console.log(errorCode);
        console.log(errorMessage);
    });
});
