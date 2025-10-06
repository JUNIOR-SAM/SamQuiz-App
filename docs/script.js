import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { 
    GoogleAuthProvider, 
    GithubAuthProvider,
    TwitterAuthProvider,
    getAuth, 
    signInWithPopup, 
    sendEmailVerification, 
    createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyC5i2mQIBEusJq4J6yK2kGap1kA5gwzMTA",
    authDomain: "quiz-generator-9fe13.firebaseapp.com",
    projectId: "quiz-generator-9fe13",
    storageBucket: "quiz-generator-9fe13.appspot.com",
    messagingSenderId: "667965575098",
    appId: "1:667965575098:web:7b554501bc04daab769783"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const twitterProvider = new TwitterAuthProvider();

const signUp = () => {
    const firstName = document.getElementById('fName').value;
    const lastName = document.getElementById('lName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!firstName || !lastName || !email || !password) {
        alert('Please fill out all fields.');
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((result) => {
            const user = result.user;
            if (user) {
                localStorage.setItem('userName', `${firstName} ${lastName}`);
                localStorage.setItem('userPhoto', '');
                window.location.href = "signin.html";
            }
        })
        .catch((err) => {
            if (err.code === "auth/weak-password") {
                alert('Password must be at least 6 characters.');
            } else if (err.code === "auth/email-already-in-use") {
                alert('Email already registered. Please sign in.');
            } else {
                alert(`Sign up failed: ${err.code}`);
            }
        });
};

const signGoogle = () => {
    signInWithPopup(auth, googleProvider)
        .then((result) => {
            const user = result.user;
            localStorage.setItem('userName', user.displayName);
            localStorage.setItem('userPhoto', user.photoURL);
            sendEmailVerification(auth.currentUser).catch(console.error);
            window.location.href = "signin.html";
        })
        .catch((err) => alert(`Google Sign-Up Failed: ${err.code}`));
};

const signGit = () => {
    signInWithPopup(auth, githubProvider)
        .then((result) => {
            const user = result.user;
            localStorage.setItem('userName', user.displayName || user.email.split('@')[0]);
            localStorage.setItem('userPhoto', user.photoURL);
            sendEmailVerification(auth.currentUser).catch(console.error);
            window.location.href = "signin.html";
        })
        .catch((err) => alert(`GitHub Sign-Up Failed: ${err.code}`));
};

// 🐦 Twitter Sign-Up
const signTwitter = () => {
    signInWithPopup(auth, twitterProvider)
        .then((result) => {
            const user = result.user;
            console.log(user);
            localStorage.setItem('userName', user.displayName || "Twitter User");
            localStorage.setItem('userPhoto', user.photoURL);
            window.location.href = "signin.html";
        })
        .catch((err) => {
            console.error(err);
            alert(`Twitter Sign-Up Failed: ${err.code}`);
        });
};

window.signUp = signUp;
window.signGoogle = signGoogle;
window.signGit = signGit;
window.signTwitter = signTwitter;
