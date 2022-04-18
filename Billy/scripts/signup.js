const loginGo = document.getElementById("loginGo")
const loginGo2 = document.getElementById("loginGo2")
const signupGo = document.getElementById("signupGo")
const forgetPass = document.getElementById("forgetPass")
const googleSignUp = Array.from(document.getElementsByClassName("googleSignUp"))
const signupForm = document.getElementsByClassName("signupForm")[0]
const loginForm = document.getElementsByClassName("loginForm")[0]
const forgotPassForm = document.getElementsByClassName("forgotPassForm")[0]
const bg = document.getElementsByClassName("bg")[0]

loginGo.addEventListener("click", () => {
    signupForm.classList.remove("active")
    forgotPassForm.classList.remove("active")
    loginForm.classList.add("active")
})

loginGo2.addEventListener("click", () => {
    signupForm.classList.remove("active")
    forgotPassForm.classList.remove("active")
    loginForm.classList.add("active")
})


forgetPass.addEventListener("click", () => {
    loginForm.classList.remove("active")
    forgotPassForm.classList.add("active")
})

signupGo.addEventListener("click", () => {
    loginForm.classList.remove("active")
    signupForm.classList.add("active")
})

const strip = (string) => {
    return string.replace(/^\s+|\s+$/g, '');
}

const checkFirstTime = (user) => {
    if (user.emailVerified){
        fetch("https://billyapi.root.sx/checkFirstTime", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"uid": user.uid})
        })
        .then(data => data.json())
        .then(data => {
            if (data.firstTime === true){
                console.log(1)
                return {"link": "https://billy.my.to/get-started.html"}
            } else {
                console.log(2)
                return {"link": "https://billy.my.to/dashboard.html"}
            }
        })
        .catch(error => {console.log(error)})
}else{
    console.log("oof")
    console.log(user.emailVerified)
    return {"link": "1"}
}}

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, getRedirectResult, onAuthStateChanged, sendEmailVerification, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
const firebaseConfig = {

    };

const app = initializeApp(firebaseConfig);
const provider = new GoogleAuthProvider();

signupForm.addEventListener("submit", (e) => {
    e.preventDefault()
    const signupData = Array.from(signupForm.elements)
    console.log(signupData)
    const email = strip(signupData[1].value)
    if (email.toLowerCase().endsWith("@gmail.com") === false){
        window.alert("We currently only accept GMail accounts")
        return
    }
    const password = strip(signupData[2].value)
    const auth = getAuth();
    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        sendEmailVerification(auth.currentUser)
        .then(() => {
            const verifyPage = document.getElementById("verification")
            verifyPage.classList.add("active")
            signupForm.classList.remove("active")
            forgotPassForm.classList.remove("active")
            bg.classList.remove("active")
            loginForm.classList.remove("active")
            const checkUser = setInterval(() => {
                auth.currentUser.reload()
                if (auth.currentUser.emailVerified){
                    clearInterval(checkUser)
                    window.location.href = "https://billy.my.to/get-started.html"
                }
            }, 5000)
        })
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        if (errorCode === "auth/email-already-in-use"){
            window.alert("An account with this email already exists")
        }
        else {
            window.alert(errorMessage)
        }
    });
})

loginForm.addEventListener("submit", (e) => {
    e.preventDefault()
    const loginData = Array.from(loginForm.elements)
    const email = strip(loginData[1].value)
    const password = strip(loginData[2].value)
    const auth = getAuth();
    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        if (userCredential.emailVerified === false){
            const verifyPage = document.getElementById("verification")
            verifyPage.classList.add("active")
            signupForm.classList.remove("active")
            forgotPassForm.classList.remove("active")
            bg.classList.remove("active")
            loginForm.classList.remove("active")
            return
        }
        return

    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        if (errorCode === "auth/wrong-password"){
            window.alert("Email or Password is wrong")
        }
        else {
            window.alert(errorMessage)
        }
    });
})

forgotPassForm.addEventListener("submit", (e) => {
    e.preventDefault()
    const forgotPassData = Array.from(forgotPassForm.elements)
    const email = strip(forgotPassData[0].value)
    const auth = getAuth();
    sendPasswordResetEmail(auth, email)
    .then(() => {
        window.alert("Password Reset Link sent to your email")
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        if (errorCode === "auth/user-not-found"){
            window.alert("This email is not registered")
        } else {
            window.alert(errorMessage)
        }
    })
})

googleSignUp.forEach((btn) => {
    btn.addEventListener("click", () => {
        const auth = getAuth(app)
        signInWithPopup(auth, provider)
            .then((result) => {
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;
                return
            }).catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                const email = error.email;
                if (errorCode === "auth/popup-closed-by-user"){ return }
                const credential = GoogleAuthProvider.credentialFromError(error);
                window.alert(errorCode)
            });
    })
})

const auth = getAuth()

onAuthStateChanged(auth, (user) => {
    if (user) {
        if (user.emailVerified){
                fetch("https://billyapi.root.sx/checkFirstTime", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({"uid": user.uid})
                })
                .then(data => data.json())
                .then(data => {
                    if (data.firstTime === true){
                        window.location.href = "https://billy.my.to/get-started.html"
                    } else {
                        window.location.href = "https://billy.my.to/dashboard.html"
                    }
                })
                .catch(error => {console.log(error)})
        }}  
})
