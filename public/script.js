import { initializeApp} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { 
    GoogleAuthProvider, GithubAuthProvider, 
    getAuth, signInWithPopup, 
    sendEmailVerification, 
    createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


const firebaseConfig = {
    apiKey: "AIzaSyC5i2mQIBEusJq4J6yK2kGap1kA5gwzMTA",
    authDomain: "quiz-generator-9fe13.firebaseapp.com",
    projectId: "quiz-generator-9fe13",
    storageBucket: "quiz-generator-9fe13.firebasestorage.app",
    messagingSenderId: "667965575098",
    appId: "1:667965575098:web:7b554501bc04daab769783"
};

const app = initializeApp(firebaseConfig);
const googleProvider = new GoogleAuthProvider(); 
const githubProvider = new GithubAuthProvider(); 
const auth = getAuth();


const signUp = () => {
    const firstName = document.getElementById('fName').value
    const lastName = document.getElementById('lName').value
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value

    if (firstName === "" || lastName === "" || email === "" || password === "") {
        alert('Please fill out all fields.')
    } else {
        createUserWithEmailAndPassword(auth, email, password)
            .then((result) => {
                const user = result.user

                if (user) {
                    localStorage.setItem('userName', `${firstName} ${lastName}`);
                    localStorage.setItem('userPhoto', ''); 
                    
                    window.location.href = "signin.html";
                } else {
                    window.location.href = "signup.html";
                }
            })
            .catch((err) => {
                const code = err.code
                console.log(code);
                if (code === "auth/weak-password") {
                    alert('Password is too weak. It must be at least 6 characters.');
                } else if (code === "auth/email-already-in-use") {
                    alert('Account already exists. Please sign in.');
                } else {
                    alert(`Sign up failed: ${code}`);
                }
            })
    }
}


const signGoogle = () => {
    signInWithPopup(auth, googleProvider)
        .then((result) => {
            const user = result.user
            console.log(user);
            
            if (user) {
                localStorage.setItem('userName', user.displayName);
                localStorage.setItem('userPhoto', user.photoURL);
                
                sendEmailVerification(auth.currentUser)
                    .catch((error) => {
                        console.log("Error sending email verification", error)
                    });
                
                window.location.href = "signin.html";
            } else {
                window.location.href = "index.html";
            }
        })
        .catch((error) => {
            console.log(error);
            alert(`Google Sign-Up Failed: ${error.code}`);
        })
}

const signGit = () => {
    signInWithPopup(auth, githubProvider) 
        .then((result) => {
            const user = result.user;
            console.log(user);
            
            if (user) {
                localStorage.setItem('userName', user.displayName || user.email.split('@')[0]);
                localStorage.setItem('userPhoto', user.photoURL);
                
                sendEmailVerification(auth.currentUser)
                    .catch((error) => {
                        console.log("Error sending email verification", error)
                    });
                
                window.location.href = "signin.html";
            } else {
                window.location.href = "index.html";
            }
        })
        .catch((error) => {
            console.log(error);
            alert(`GitHub Sign-Up Failed: ${error.code}`);
        });
}

window.signUp = signUp;
window.signGoogle = signGoogle;
window.signGit = signGit;