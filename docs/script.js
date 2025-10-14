document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        signUp();
    }
})


const toast = (message, bgColor, color, fontWeight, borderRadius, marginTop, fontSize, textAlign) => {
    Toastify({
        text: message,
        duration: 2500,
        // destination: "https://github.com/apvarun/toastify-js",
        newWindow: true,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "center", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
            background: bgColor,
            color,
            fontWeight,
            borderRadius,
            marginTop,
            fontSize,
            textAlign,
        },
        onClick: function () { } // Callback after click
    }).showToast();
}



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
        load.style.display = 'block'
        load.style.margin = 'auto'
        sub.style.display = 'none'
        setTimeout(() => {
            load.style.display = 'none'
            sub.style.display = 'block'
            toast('Please fill out all fields', 'red', 'white', 'bold', '100px', '20px')
        }
            , 3000)
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((result) => {
            const user = result.user;
            if (user) {
                localStorage.setItem('userName', `${firstName} ${lastName}`);
                localStorage.setItem('userPhoto', '');
                load.style.display = 'block'
                load.style.margin = 'auto'
                sub.style.display = 'none'
                setTimeout(() => {
                    load.style.display = 'none'
                    sub.style.display = 'block'
                    toast('sign up successfully', 'green', 'white', 'bold', '100px', '20px', '15px', 'center')
                    setTimeout(() => {
                        window.location.href = "signin.html";
                    }, 3000);
                }, 7000)
                return;
            }
        })
        .catch((err) => {
            if (err.code === "auth/weak-password") {
                load.style.display = 'block'
                load.style.margin = 'auto'
                sub.style.display = 'none'
                setTimeout(() => {
                    load.style.display = 'none'
                    sub.style.display = 'block'
                    toast('Password must be at least 6 characters.', 'red', 'white', 'bold', '100px', '20px', '15px', 'center')
                }
                    , 3000)
                return;
            } if (err.code === 'auth/password-does-not-meet-requirements') {
                load.style.display = 'block'
                load.style.margin = 'auto'
                sub.style.display = 'none'
                setTimeout(() => {
                    load.style.display = 'none'
                    sub.style.display = 'block'
                    toast('password must contain special character, lowercase, uppercase, number and not less than 6 characters.', 'red', 'white', 'bold', '100px', '20px', '15px', 'center')
                }
                    , 3000)
                return;
            } else if (err.code === "auth/email-already-in-use") {
                load.style.display = 'block'
                load.style.margin = 'auto'
                sub.style.display = 'none'
                setTimeout(() => {
                    load.style.display = 'none'
                    sub.style.display = 'block'
                    toast('Email already registered. Please sign in.', 'red', 'white', 'bold', '100px', '20px', '15px', 'center')
                }
                    , 3000)
                return;
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
