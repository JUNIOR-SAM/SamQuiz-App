import { 
    initializeApp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    GoogleAuthProvider, 
    GithubAuthProvider,
    TwitterAuthProvider,
    getAuth, 
    signInWithPopup, 
    signInWithEmailAndPassword,
    updateProfile 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Firebase config
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

const DEFAULT_PHOTO_PATH = './images/default-profile.png';

// Save user info locally (name & photo)
const saveUserData = async (user) => {
    const customName = localStorage.getItem('userName');
    const finalName = customName || user.displayName || user.email?.split('@')[0] || 'User';
    const photoURL = user.photoURL || DEFAULT_PHOTO_PATH;

    try {
        await updateProfile(user, { displayName: finalName });
    } catch (e) {
        console.error("Failed to update profile:", e);
    }

    localStorage.setItem('userName', finalName);
    localStorage.setItem('userPhoto', photoURL);
};

// Email/password sign-in
const signIn = () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) return console.warn('Please fill in all fields.');

    signInWithEmailAndPassword(auth, email, password)
        .then(async (result) => {
            // Save name & default photo (no upload)
            await saveUserData(result.user);

            window.location.href = "quiz.html"; // Go to dashboard
        })
        .catch((err) => alert(`Sign-In failed: ${err.code}`));
};

// Social sign-ins
const inGoogle = () => {
    signInWithPopup(auth, googleProvider)
        .then(async (result) => {
            await saveUserData(result.user);
            window.location.href = "quiz.html";
        })
        .catch(err => alert(`Google Sign-In Failed: ${err.code}`));
};

const inGit = () => {
    signInWithPopup(auth, githubProvider)
        .then(async (result) => {
            await saveUserData(result.user);
            window.location.href = "quiz.html";
        })
        .catch(err => alert(`GitHub Sign-In Failed: ${err.code}`));
};

const inTwitter = () => {
    signInWithPopup(auth, twitterProvider)
        .then(async (result) => {
            await saveUserData(result.user);
            window.location.href = "quiz.html";
        })
        .catch(err => alert(`Twitter Sign-In Failed: ${err.code}`));
};

// Expose functions globally
window.signIn = signIn;
window.inGoogle = inGoogle;
window.inGit = inGit;
window.inTwitter = inTwitter;
