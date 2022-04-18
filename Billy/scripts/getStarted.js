import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
const firebaseConfig = {

    };

const app = initializeApp(firebaseConfig);

const auth = getAuth()
onAuthStateChanged(auth, (user) => {
    if (user === null) {
        window.location.href = "https://billy.my.to"
    } else {
        if (user.emailVerified === false) {
            window.location.href = "https://billy.my.to"
        } else {
            fetch("https://billyapi.root.sx/checkFirstTime", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({"uid": user.uid})
            })
            .then(data => data.json())
            .then(data => {
                if (data.firstTime === false) {
                    window.location.href = "https://billy.my.to"
                }
            })
        }
    }
})

const createItem = () => {
    const item = document.createElement("div")
    item.className = "item"
    const itemName = document.createElement("input")
    itemName.required = "true"
    itemName.placeholder = "Item Name"
    itemName.id = "itemName"
    const sellingPrice = document.createElement("input")
    sellingPrice.required = "true"
    sellingPrice.placeholder = "Selling Price"
    sellingPrice.id = "sellingPrice"
    sellingPrice.type = "number"
    sellingPrice.min = "0"
    const profit = document.createElement("input")
    profit.required = "true"
    profit.placeholder = "Profit"
    profit.id = "profitPrice"
    profit.min = "0"
    profit.type = "number"
    const deleteItem = document.createElement("button")
    deleteItem.className = "deleteItem"
    deleteItem.innerHTML = "&#10060;"
    deleteItem.setAttribute("onClick", "removeItem()")
    item.appendChild(itemName)
    item.appendChild(sellingPrice)
    item.appendChild(profit)
    item.appendChild(deleteItem)
    return item
}

const strip = (string) => {
    return string.replace(/^\s+|\s+$/g, '');
}

const addItemBtn = document.getElementById("addItemBtn")

addItemBtn.addEventListener("click", () => {
    const newItem = createItem()
    document.getElementsByClassName("itemsHolder")[0].appendChild(newItem)
})


const submitBtn = document.getElementById("submitBtn")

submitBtn.addEventListener("click", (e) => {
    e.preventDefault()
    const personName = strip(document.getElementById("personName").value)
    const businessName = strip(document.getElementById("businessName").value)
    const items = Array.from(document.getElementsByClassName("item"))
    const itemsData = {}
    let wrong = false
    items.forEach((item) => {
        if (parseInt(item['children'][2].value) > parseInt(item['children'][1].value)){
            window.alert("Profit can not be greater than Selling Price")
            wrong = true
            return
        }
        itemsData[strip(item['children'][0].value)] = {"SP": item['children'][1].value, "Profit": item['children'][2].value}
    })
    if (wrong === true) {
        console.log(itemsData)
        return
    }
    const data = {"uid": auth.currentUser.uid, "personName": personName, "businessName": businessName, "items": itemsData}
    console.log(data)
    fetch("https://billyapi.root.sx/createUser", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    })
    .then(data => data.json())
    .then(data => {
            if (data.error) {
                document.getElementById("errorPopup").classList.add("active")
            } else {
                window.location.href = "https://billy.my.to/dashboard.html"
            }
        })
    .catch(error => {
        console.log(error)
        document.getElementById("errorPopup").classList.add("active")
    })
})

