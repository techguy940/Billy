import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
const firebaseConfig = {

	};

const app = initializeApp(firebaseConfig);

document.getElementById("getStartedBtn").addEventListener("click", () => {
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
		} else {
			window.location.href = "https://billy.my.to/signup.html"
		}}
		else {
			window.location.href = "https://billy.my.to/signup.html"
		}
	})
})
