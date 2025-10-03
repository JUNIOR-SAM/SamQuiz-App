import { 
    initializeApp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    GoogleAuthProvider, 
    GithubAuthProvider,
    getAuth, 
    signInWithPopup, 
    signInWithEmailAndPassword,
    updateProfile 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
// NOTE: Firebase Storage imports are no longer needed for local file upload/display
/* import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
*/

// NOTE: Please replace this with your actual Firebase config
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
// const storage = getStorage(app); // Storage is no longer used
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// IMPORTANT: Path for the placeholder image if no photo is provided
// This is the path to your locally saved logo.png file.
const DEFAULT_PHOTO_PATH = './image/logo.png';

/**
 * Reads a user-selected file and converts it to a Base64 Data URL string.
 * This bypasses the need to upload the image to Firebase Storage (and thus avoids CORS errors).
 * @param {File} file - The file object from the input.
 * @returns {Promise<string | null>} The Base64 Data URL or null if reading fails.
 */
const readFileAsDataURL = (file) => {
    return new Promise((resolve) => {
        if (!file) {
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => {
            console.error("Error reading file locally.");
            resolve(null);
        };
        reader.readAsDataURL(file);
    });
};

/**
 * Helper function to update the user's Firebase profile and local storage with 
 * the final name and photo URL before redirecting.
 * @param {import("firebase/auth").User} user - The Firebase User object.
 * @param {string | null} photoDataURL - The Base64 data string of the uploaded photo, or null.
 */
const saveUserData = async (user, photoDataURL = null) => { 
    
    // --- 1. Determine the Name (Prioritizing Custom Name from Sign-Up/localStorage) ---
    const customName = localStorage.getItem('userName'); 
    const emailPrefixName = user.email ? user.email.split('@')[0] : 'User';
    const finalName = customName || user.displayName || emailPrefixName;
    
    // --- 2. Determine the Photo URL / Data URL ---
    let photoURL = DEFAULT_PHOTO_PATH;

    if (photoDataURL) {
        // Priority 1: Newly read photo data URL (Base64 string)
        photoURL = photoDataURL; 
    } else if (user.photoURL && user.photoURL.length > 0) {
        // Priority 2: Existing Firebase/OAuth photo URL (External URL)
        photoURL = user.photoURL; 
    }
    // Priority 3: Otherwise, use DEFAULT_PHOTO_PATH (Local path)

    // --- 3. Update Firebase profile (IMPORTANT: We cannot update photoURL with a Data URL, 
    //         so we only update the displayName to avoid errors.) 
    //         The photo URL is now primarily managed in Local Storage.
    try {
        await updateProfile(user, { 
            displayName: finalName
            // We intentionally do NOT set photoURL here, as it might be a local data URL.
        });
        console.log("Firebase profile updated with name.");
    } catch (e) {
        console.error("Failed to update user profile with final name:", e);
    }
    
    // --- 4. Save FINAL data to localStorage (for fast dashboard load) ---
    localStorage.setItem('userName', finalName);
    localStorage.setItem('userPhoto', photoURL);
};

// Manual Sign-In (Email/Password)
const signIn = () => {
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const fileInput = document.getElementById('manualUserPhoto'); 
    const file = fileInput.files[0]; 

    if (email === "" || password === "") {
        console.warn('Please enter email and password.'); 
        return;
    } 

    signInWithEmailAndPassword(auth, email, password)
        .then(async (result) => { 
            if (result.user) {
                let finalPhotoDataURL = null;

                // STEP 1: If a file is selected, WAIT for it to be read locally.
                if (file) {
                    console.log("Reading photo locally as Data URL...");
                    // This function will wait for the local file to be read
                    finalPhotoDataURL = await readFileAsDataURL(file);
                }

                // STEP 2: Save the user data using the Data URL (or null)
                await saveUserData(result.user, finalPhotoDataURL); 
                
                // STEP 3: Redirect only after everything is saved.
                window.location.href = "quiz.html";
            }
        })
        .catch((err) => {
            const code = err.code;
            console.error("Sign In Error:", code);
            if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
                console.warn('Invalid credentials. Please check your email and password.');
            } else {
                console.warn(`Sign In failed: ${code}`);
            }
        });
}


// Google Sign-In (OAuth)
const inGoogle = () => {
    signInWithPopup(auth, googleProvider)
        .then(async (result) => { 
            // OAuth provides name and photo URL directly, so we don't need the file reading step.
            await saveUserData(result.user, result.user.photoURL); 
            window.location.href = "quiz.html";
        })
        .catch(err => {
            console.error("Google Sign-In Failed:", err);
        });
};

// GitHub Sign-In (OAuth)
const inGit = () => {
    signInWithPopup(auth, githubProvider)
        .then(async (result) => { 
            // OAuth provides name and photo URL directly, so we don't need the file reading step.
            await saveUserData(result.user, result.user.photoURL); 
            window.location.href = "quiz.html";
        })
        .catch(err => {
            console.error("GitHub Sign-In Failed:", err);
        });
};

// Expose functions to the global window object so they can be called from HTML buttons
window.signIn = signIn;
window.inGoogle = inGoogle;
window.inGit = inGit;
