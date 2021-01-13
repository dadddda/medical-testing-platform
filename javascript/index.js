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
 * Event listener for header left button.
 */
document.getElementById("headerLeftBtn").addEventListener("click", function() {
    window.location.assign("index.html");
})

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

/**
 * Left navigation panel button listeners.
 */
var leftPanel = document.getElementById("leftPanel");
var btns = leftPanel.getElementsByClassName("leftPanelBtn");

for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener("click", function(event) {
        var curr = leftPanel.getElementsByClassName("active");
        if (curr.length != 0) curr[0].classList.remove("active");
        
        this.classList.add("active");
        if (event.target.id == "newsFeed") {
            window.location.assign("news-feed.html");
        }
    });
}
