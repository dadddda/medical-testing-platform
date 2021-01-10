// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyBYT-P_v6NSaSzvKa-cxq7njXjV81HrgT0",
    authDomain: "medical-testing-platform.firebaseapp.com",
    databaseURL: "https://medical-testing-platform-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "medical-testing-platform",
    storageBucket: "medical-testing-platform.appspot.com",
    messagingSenderId: "143001061686",
    appId: "1:143001061686:web:4d6118b7bddf5048cb8b97"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

firebase.auth.Auth.Persistence.LOCAL;
