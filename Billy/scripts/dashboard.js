import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
const firebaseConfig = {

	};

const app = initializeApp(firebaseConfig);
const auth = getAuth()
onAuthStateChanged(auth, (user) => {
	if (user === null) {
		window.location.href = "https://billy.my.to"
	} else {
		fetchData()
	}
})


const getRandomColor = () => {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}




const fetchData = () => {
	fetch(`https://billyapi.root.sx/userProfile?uid=${auth.currentUser.uid}`)
	.then(data => data.json())
	.then(data => {
		if (data.error) {
			window.alert("Please try again later")
			return
		} else {
			document.getElementById("brandNameText").innerText = data.businessName
			document.getElementById("personNameSpan").innerText = data.personName
			document.getElementById("businessNameSpan").innerText = data.businessName
		}
	})
	.catch(error => {console.log(error)})

	fetch(`https://billyapi.root.sx/items?uid=${auth.currentUser.uid}`)
	.then(data => data.json())
	.then(itemData => {
		if (itemData.success === false) {
			window.alert("Please try again later")
			return
		}
		const items = itemData.items[0]

		// todays sales

		fetch(`https://billyapi.root.sx/dailySales`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"uid": auth.currentUser.uid})
		})
		.then(todayData => todayData.json())
		.then(todayData => {
			if (todayData['Error']) {
				window.alert("Please try again later")
				return
			}

			const previousData = {'totalSales': 0, 'totalProfit': 0}

			fetch(`https://billyapi.root.sx/yesterdaySales`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({"uid": auth.currentUser.uid})
			})
				.then(data => data.json())
				.then(yesterdayData => {
					const previousNames = Object.keys(yesterdayData)
					previousNames.forEach((name) => {
						previousData['totalSales'] += yesterdayData[name] * items[name]["SP"]
						previousData['totalProfit'] += yesterdayData[name] * items[name]["Profit"]
					})
					const dailyData = {}
					let totalSales = 0
					let totalProfit = 0
					const names = Object.keys(todayData)
					const maxUnitsSold = {"name": "", "units": 0}
					const maxProfitItem = {"name": "", "profit": 0}
					const itemsSales = {}
					names.forEach((name) => {
						dailyData[name] = {"quantitySold": parseInt(todayData[name]), "SP": parseInt(items[name]["SP"]), "ProfitPerUnit": parseInt(items[name]["Profit"])}
						if (dailyData[name]['quantitySold'] > maxUnitsSold['units']) {
							maxUnitsSold['name'] = name
							maxUnitsSold['units'] = dailyData[name]['quantitySold']
						}


						dailyData[name]['totalSales'] = dailyData[name]["quantitySold"] * dailyData[name]["SP"]
						dailyData[name]['totalProfit'] = dailyData[name]["quantitySold"] * dailyData[name]["ProfitPerUnit"]
						if (dailyData[name]['totalProfit'] > maxProfitItem['profit']) {
							maxProfitItem['name'] = name
							maxProfitItem['profit'] = dailyData[name]['totalProfit']
						}
						totalSales += dailyData[name]['totalSales']
						totalProfit += dailyData[name]['totalProfit']
						if (itemsSales[name] > 0) {
							itemsSales[name] += dailyData[name]['totalSales']
						} else {
							itemsSales[name] = dailyData[name]['totalSales']
						}
					})
					let salesPercentChange = parseFloat((totalSales - previousData['totalSales'])/previousData['totalSales']).toFixed(2) * 100
					let profitPercentChange = parseFloat((totalProfit - previousData['totalProfit'])/previousData['totalProfit']).toFixed(2) * 100

					if (!(isFinite(salesPercentChange))) {
						salesPercentChange = 100
					}

					if (!(isFinite(profitPercentChange))) {
						profitPercentChange = 100
					}

					if (maxUnitsSold['name'] === "") {
						maxUnitsSold['name'] = "None"
					}

					if (maxProfitItem['name'] === "") {
						maxProfitItem['name'] = "None"
					}
					const todaySalesDiv = document.getElementById("todaySalesDiv")
					todaySalesDiv.children[1].innerHTML = `Sales: <span class="blue"> $${totalSales}</span> <span class=${salesPercentChange>0 ? "green" : "red"}>(${salesPercentChange>0 ? "+" : ""}${salesPercentChange}%)</span>`
					todaySalesDiv.children[2].innerHTML = `Profit: <span class="blue"> $${totalProfit}</span> <span class=${profitPercentChange>0 ? "green" : "red"}>(${profitPercentChange>0 ? "+" : ""}${profitPercentChange}%)</span>`
					const todayItemsDiv = document.getElementById("todayItemsDiv")
					todayItemsDiv.children[1].innerHTML = `Most Sold Item: <span class="blue"> ${maxUnitsSold['name']}</span>`
					todayItemsDiv.children[2].innerHTML = `Most Profitable Item: <span class="blue"> ${maxProfitItem['name']}</span>`
					if (Array.from(document.getElementById("todayGraphsDiv").children).length > 0) { return }
					if (totalSales === 0 && totalProfit === 0) {
						const todayGraphDiv = document.getElementById("todayGraphsDiv")
						const h1 = document.createElement("h1")
						h1.innerText = "No Data"
						todayGraphDiv.appendChild(h1)
						return
					}
					const doughnutData = {
						labels: ['Sales', 'Profit'],
						datasets: [{
							label: 'Sales vs Profit',
							data: [totalSales, totalProfit],
							backgroundColor: ['rgb(255, 99, 132)', 'rgb(54, 162, 235)']
						}],
						hoverOffset: 4
					}
					const config = {
						type: 'doughnut',
						data: doughnutData
					}


					const todayGraphDiv = document.getElementById("todayGraphsDiv")
					const doughnutCanvas = document.createElement("canvas")
					const div1 = document.createElement("div")
					div1.appendChild(doughnutCanvas)
					todayGraphDiv.appendChild(div1)
					new Chart(doughnutCanvas, config)

					const bgs = []
					const bgs2 = []
					Object.keys(itemsSales).forEach((item) => {
						bgs.push(getRandomColor())
						bgs2.push(getRandomColor())
					})

					const polarData = {
						labels: Object.keys(itemsSales),
						datasets: [{
							label: 'Sales',
							data: Object.values(itemsSales),
							backgroundColor: bgs
						}]
					}
					const polarCanvas = document.createElement("canvas")
					const div2 = document.createElement("div")
					div2.appendChild(polarCanvas)
					todayGraphDiv.appendChild(div2)

					new Chart(polarCanvas, {
						type: 'polarArea',
						data: polarData,
						options: {}
					})

					polarData.datasets[0].backgroundColor = bgs2

					const barCanvas = document.createElement("canvas")
					const div3 = document.createElement("div")
					div3.appendChild(barCanvas)
					div3.className = "barDiv"
					todayGraphDiv.appendChild(div3)
					new Chart(barCanvas, {
						type: 'bar',
						data: polarData,
						options: {}
					})

				})
				.catch(error => console.log(error))


		// monthly data
		fetch(`https://billyapi.root.sx/monthlySales`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"uid": auth.currentUser.uid})
		})
			.then(data => data.json())
			.then(data => {
				if (data.success === false) {
					window.alert("Please try again later")
					return
				}

				const previousMonthData = {"totalSales": 0, "totalProfit": 0}

				fetch(`https://billyapi.root.sx/lastMonthlySales`, {
					method: "POST",
					headers: {"Content-Type": "application/json"},
					body: JSON.stringify({"uid": auth.currentUser.uid})
				})
					.then(prevData => prevData.json())
					.then(previousData => {
						const prevDates = Object.keys(previousData.data)
						prevDates.forEach((date) => {
							const itemNames = Object.keys(previousData.data[date])
							itemNames.forEach((name) => {
								if (name === 'total') { return }
								previousMonthData['totalSales'] += (parseInt(previousData.data[date][name]) * items[name]['SP'])
								previousMonthData['totalProfit'] += (parseInt(previousData.data[date][name]) * items[name]['Profit'])
							})
						})

						const unitsSoldOverall = {}
						const profits = {}
						const dates = Object.keys(data.data)
						let totalSales = 0
						let totalProfit = 0
						dates.forEach((date) => {
							const itemNames = Object.keys(data.data[date])
							itemNames.forEach((name) => {
								if (name === 'total') { return }
								totalSales += (parseInt(data.data[date][name]) * items[name]['SP'])
								totalProfit += (parseInt(data.data[date][name]) * items[name]['Profit'])
							})
						})
						let salesPercentChange = parseFloat((totalSales - previousMonthData['totalSales'])/previousMonthData['totalSales']).toFixed(2) * 100
						if (!(isFinite(salesPercentChange))) {
							salesPercentChange = 100
						}
						let profitPercentChange = parseFloat((totalProfit - previousMonthData['totalProfit'])/previousMonthData['totalProfit']).toFixed(2) * 100
						if (!(isFinite(profitPercentChange))) {
							profitPercentChange = 100
						}
						const monthSalesData = document.getElementById("monthSalesDiv")
						monthSalesData.children[1].innerHTML = `Sales: <span class="blue"> $${totalSales}</span> <span class=${salesPercentChange>0 ? "green" : "red"}>(${salesPercentChange>0 ? "+" : ""}${salesPercentChange}%)</span>`
						monthSalesData.children[2].innerHTML = `Profit: <span class="blue"> $${totalProfit}</span> <span class=${profitPercentChange>0 ? "green" : "red"}>(${profitPercentChange>0 ? "+" : ""}${profitPercentChange}%)</span>`
						if (Array.from(document.getElementById("todayGraphsDiv").children).length > 0) { return }
						const doughnutData = {
							labels: ['Sales', 'Profit'],
							datasets: [{
								label: 'Sales vs Profit',
								data: [totalSales, totalProfit],
								backgroundColor: ['rgb(255, 99, 132)', 'rgb(54, 162, 235)']
							}],
							hoverOffset: 4
						}
						const config = {
							type: 'doughnut',
							data: doughnutData
						}

						const todayGraphDiv = document.getElementById("todayGraphsDiv")
						const canvas = document.createElement("canvas")
						todayGraphDiv.appendChild(canvas)
						new Chart(canvas, config)
				})
			})
		})
	})
	.catch(error => {console.log(error)})
	document.getElementById("loader").classList.remove("active")


}

const homeUl = document.getElementById("homeUl")
const salesUl = document.getElementById("salesUl")
const statsUl = document.getElementById("statsUl")
const settingsUl = document.getElementById("settingsUl")
const quickNavC = document.getElementsByClassName("quickNav")[0]
const menuIconC = document.getElementById("menuIcon")

const homeDiv = document.getElementById("homeDiv")
const addSalesDiv = document.getElementById("addSalesDiv")
const settingsDiv = document.getElementById("settingsDiv")
const statsDiv = document.getElementById("statsDiv")

homeUl.addEventListener("click", (e) => {
	e.preventDefault()
	if (homeUl.classList.contains("active")) {
		return
	}
	document.getElementById("loader").classList.add("active")

	homeUl.classList.add("active")
	salesUl.classList.remove("active")
	statsUl.classList.remove("active")
	settingsUl.classList.remove("active")
	quickNavC.classList.remove("active")
	menuIconC.classList.remove("close")
	menuIconC.src = "./img/menu.png"
	addSalesDiv.classList.remove("active")
	settingsDiv.classList.remove("active")
	statsDiv.classList.remove("active")
	if (homeDiv.classList.contains("active")) { return }
	homeDiv.classList.add("active")
	fetchData()
})

salesUl.addEventListener("click", (e) => {
	e.preventDefault()
	if (salesUl.classList.contains("active")) {
		return
	}
	document.getElementById("loader").classList.add("active")

	homeUl.classList.remove("active")
	salesUl.classList.add("active")
	statsUl.classList.remove("active")
	settingsUl.classList.remove("active")
	menuIconC.classList.remove("close")
	settingsDiv.classList.remove("active")
	quickNavC.classList.remove("active")
	statsDiv.classList.remove("active")
	homeDiv.classList.remove("active")
	menuIcon.src = "./img/menu.png"
	if (addSalesDiv.classList.contains("active")) { return }
	addSalesDiv.classList.add("active")
	fetchItemsData()

})

statsUl.addEventListener("click", (e) => {
	e.preventDefault()
	if (statsUl.classList.contains("active")) {
		return
	}
	document.getElementById("loader").classList.add("active")

	homeUl.classList.remove("active")
	salesUl.classList.remove("active")
	statsUl.classList.add("active")
	settingsUl.classList.remove("active")
	menuIconC.classList.remove("close")
	quickNavC.classList.remove("active")
	menuIcon.src = "./img/menu.png"
	addSalesDiv.classList.remove("active")
	settingsDiv.classList.remove("active")
	homeDiv.classList.remove("active")
	if (statsDiv.classList.contains("active")) { return }
	statsDiv.classList.add("active")
	document.getElementById("loader").classList.remove("active")




})

settingsUl.addEventListener("click", (e) => {
	e.preventDefault()
	if (settingsUl.classList.contains("active")) {
		return
	}
	document.getElementById("loader").classList.add("active")

	homeUl.classList.remove("active")
	salesUl.classList.remove("active")
	statsUl.classList.remove("active")
	menuIconC.classList.remove("close")
	settingsUl.classList.add("active")
	quickNavC.classList.remove("active")
	homeDiv.classList.remove("active")
	menuIcon.src = "./img/menu.png"
	addSalesDiv.classList.remove("active")
	statsDiv.classList.remove("active")
	if (settingsDiv.classList.contains("active")) { return }
	settingsDiv.classList.add("active")
	fetchSettingsData()
})


const fetchHomeData = () => {
	fetch(`https://billyapi.root.sx/userProfile?uid=${auth.currentUser.uid}`)
	.then(data => data.json())
	.then(data => {
		if (data.success === false) {
			window.alert("Please try again later")
			return
		}
		document.getElementById("personNameSpan").innerText = data.personName
		document.getElementById("businessNameSpan").innerText = data.businessName
	})
}

// <option value='₹'selected>₹ INR</option>

const createOption = (value, text, selected) => {
	const option = document.createElement("option")
	option.value = value
	option.innerText = text
	if (selected) {
		option.selected = "true"
	}
	return option
}

const addItem = (holder) => {
	const item = document.createElement("div")
	item.className = "item"
	const select = document.createElement("select")
	select.setAttribute("type", "text")
	select.placeholder = "Item Name"
	select.required = "required"
	select.id = "itemName"
	select.className = "itemName"
	const input = document.createElement("input")
	input.setAttribute("type", "number")
	input.min = "1"
	input.required = "required"
	input.placeholder = "Quantity"
	input.id = "quantity"
	const deleteItem = document.createElement("button")
	deleteItem.className = "deleteItem"
	deleteItem.innerHTML = "&#10060;"
	deleteItem.setAttribute("onclick", "removeItem()")
	item.appendChild(select)
	item.appendChild(input)
	item.appendChild(deleteItem)
	holder.appendChild(item)
	return
}

const createItem = (name, sp, p) => {
	const item = document.createElement("div")
	item.className = "itemSetting"
	const itemName = document.createElement("input")
	itemName.required = "true"
	itemName.placeholder = "Item Name"
	itemName.id = "itemNameSetting"
	const sellingPrice = document.createElement("input")
	sellingPrice.required = "true"
	sellingPrice.placeholder = "Selling Price"
	sellingPrice.id = "sellingPriceSetting"
	sellingPrice.type = "number"
	sellingPrice.min = "0"
	const profit = document.createElement("input")
	profit.required = "true"
	profit.placeholder = "Profit"
	profit.id = "profitSetting"
	profit.min = "0"
	profit.type = "number"
	const deleteItem = document.createElement("button")
	deleteItem.className = "deleteItemSetting"
	deleteItem.innerHTML = "&#10060;"
	deleteItem.setAttribute("onClick", "removeItemSetting()")
	item.appendChild(itemName)
	item.appendChild(sellingPrice)
	item.appendChild(profit)
	item.appendChild(deleteItem)
	if (name) {
		itemName.value = name
		sellingPrice.value = sp
		profit.value = p
	}
	return item
}

const strip = (string) => {
	return string.replace(/^\s+|\s+$/g, '');
}

const addItemsBtn = document.getElementById('addItemsBtn')
addItemsBtn.addEventListener("click", (e) => {
	e.preventDefault()
	const itemsHolderSettings = document.getElementsByClassName("itemsHolderSettings")[0]
	itemsHolderSettings.appendChild(createItem())
})

const addSalesBtn = document.getElementById("addSalesBtn")
addSalesBtn.addEventListener("click", (e) => {
	e.preventDefault()
	const itemsHolder = document.getElementsByClassName("itemsHolder")[0]
	addItem(itemsHolder)
	fetchItemsData()
	return
})


const fetchItemsData = () => {
	fetch(`https://billyapi.root.sx/items?uid=${auth.currentUser.uid}`)
	.then(data => data.json())
	.then(data => {
		const items = data.items[0]
		const itemNames = Array.from(document.getElementsByClassName("itemName"))
		itemNames.forEach((itemName) => {
			const names = Object.keys(items)
			const options = Array.from(itemName.getElementsByTagName("option"))
			if (options.length === names.length) { return }
			let idx = 0
			names.forEach((name) => {
				const selected = true ? idx === 0 : false
				const option = createOption(name, name, selected)
				itemName.appendChild(option)
				idx += 1
			})
		})
	})
	.catch(error => {console.log(error)})
	document.getElementById("loader").classList.remove("active")

}

const itemsSubmitBtn = document.getElementById("itemsSubmitBtn")

itemsSubmitBtn.addEventListener("click", (e) => {
	e.preventDefault()
	document.getElementById("loader").classList.add("active")

	const items = Array.from(document.getElementsByClassName("item"))
	const itemsData = {}
	items.forEach((item) => {
		const select = item.getElementsByTagName("select")[0]
		const itemName = select.value
		let quantity = parseInt(item.getElementsByTagName("input")[0].value)
		if (quantity < 1) {
			quantity = 1
		}
		if (itemsData[itemName] === undefined) {
			itemsData[itemName] = quantity
		} else {
			itemsData[itemName] += quantity
		}
	})
	const salesData = {"uid": auth.currentUser.uid, "salesData": itemsData}
	fetch(`https://billyapi.root.sx/addSales`, {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(salesData)
	})
		.then(data => data.json())
		.then(data => {
			if (data.success){
				window.alert("Items Added Successfully")
			} else {
				window.alert(data['Error'])
			}
		})
		.catch(error => {window.alert(error)})
	document.getElementById("loader").classList.remove("active")

})

const fetchSettingsData = () => {
	const uid = auth.currentUser.uid
	fetch(`https://billyapi.root.sx/userProfile?uid=${uid}`)
		.then(data => data.json())
		.then(data => {
			if (data.error) {
				return
			}
			const personName = document.getElementById("personName")
			const businessName = document.getElementById("businessName")
			personName.value = data.personName
			businessName.value = data.businessName
		})
		.catch(error => {console.log(error)})
	fetch(`https://billyapi.root.sx/items?uid=${uid}`)
	.then(data => data.json())
	.then(data => {
		if (data.error) {
			return
		}

		const items = data.items[0]
		const names = Object.keys(items)
		const itemsHolderSettings = document.getElementsByClassName("itemsHolderSettings")[0]
		if (itemsHolderSettings.children.length > 1) {
			return
		}
		names.forEach((itemName) => {
			const item = items[itemName]
			const sellingPrice = parseInt(item['SP'])
			const profit = parseInt(item['Profit'])
			const newItemSettings = createItem(itemName, sellingPrice, profit)
			itemsHolderSettings.prepend(newItemSettings)
		})
	})
	.catch(error => console.log(error))
	document.getElementById("loader").classList.remove("active")

}

const updateSettingsBtn = document.getElementById("updateSettingsBtn")

updateSettingsBtn.addEventListener("click", (e) => {
	e.preventDefault()
	document.getElementById("loader").classList.add("active")

	const personName = document.getElementById("personName")
	const businessName = document.getElementById("businessName")
	const itemsSetting = Array.from(document.getElementsByClassName("itemSetting"))
	const itemData = {}
	if ((personName.value).trim().length <= 0) {
		window.alert("Kindly fill all the details")
		return
	}
	if ((businessName.value).trim().length <= 0) {
		window.alert("Kindly fill all the details")
		return
	}

	itemsSetting.forEach((item) => {
		const itemName = item.children[0].value
		const sellingPrice = parseInt(item.children[1].value)
		const profit = parseInt(item.children[2].value)
		if (profit > sellingPrice) {
			window.alert("Profit can not be greater than Selling Price")
		}

		if (itemName.trim().length <= 0){
			window.alert("Kindly fill all the details")
			return
		}

		itemData[itemName] = {"SP": sellingPrice, "Profit": profit}
	})
	const updatedData = {"personName": personName.value, "businessName": businessName.value, "items": itemData, "uid": auth.currentUser.uid}
	fetch("https://billyapi.root.sx/editProfile", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(updatedData)
	})
		.then(data => data.json())
		.then(data => {
			console.log(updatedData)
			console.log(data)
			if (data['Error']){
				window.alert(data['Error'])
				return
			}
			window.alert("Updated Profile Successfully")
		})
		.catch(error => {console.log(error)})
	document.getElementById("loader").classList.remove("active")

})

const signOutBtn = document.getElementById("signOutBtn")
signOutBtn.addEventListener("click", (e) => {
	e.preventDefault()
	const auth = getAuth()
	signOut(auth)
	.then(() => { return })
	.catch(error => { console.log(error) })
})

const monthlyDataBtn = document.getElementById("monthlyDataBtn")
const dailyDataBtn = document.getElementById("dailyDataBtn")
const priceDistributionBtn = document.getElementById("priceDistributionBtn")
const graphsBtn = document.getElementById("graphsBtn")

const graphData = []

const fetchItemsUrl = (url) => {
	const items = fetch(url)
	.then(data => data.json())
	.then(data => {
		if (data.success === false){
			window.alert("Please try again later")
			return {}
		}

		return data.items[0]
	})
	.catch(error => { console.log(error); return {} })
	return items
}

const createTable = (tableData) => {
	const dataTable = document.getElementById("dataTable")
	if (dataTable.getElementsByTagName('table').length > 0) { dataTable.getElementsByTagName('table')[0].remove() }
	const table = document.createElement("table")
	const headerTr = document.createElement("tr")
	tableData['th'].forEach((headerName) => {
		const th = document.createElement("th")
		th.innerText = headerName
		headerTr.appendChild(th)
	})
	table.appendChild(headerTr)

	tableData['td'].forEach((tdData) => {
		const tr = document.createElement("tr")
		tdData.forEach((item) => {
			const td = document.createElement("td")
			td.innerText = item
			tr.appendChild(td)
		})
		table.appendChild(tr)
	})

	dataTable.appendChild(table)
	const dataGraphs = document.getElementById("dataGraphs")
	dataGraphs.classList.remove("active")

	if (dataTable.classList.contains("active")) { return }
	dataTable.classList.add("active")
	return
}


dailyDataBtn.addEventListener("click", (e) => {
	e.preventDefault()
	document.getElementById("loader").classList.add("active")

	const data = {}
	const items = fetchItemsUrl(`https://billyapi.root.sx/items?uid=${auth.currentUser.uid}`)
	items.then(items => {
		fetch(`https://billyapi.root.sx/dailySales`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"uid": getAuth().currentUser.uid})
		})
		.then(data => data.json())
		.then(data => {
			if (data.success === false) {
				window.alert(data['Error'])
				return
			}

			const dailyData = {}
			const names = Object.keys(data)
			names.forEach((name) => {
				dailyData[name] = {"quantitySold": parseInt(data[name]), "SP": parseInt(items[name]["SP"]), "ProfitPerUnit": parseInt(items[name]["Profit"])}
				dailyData[name]['totalSales'] = dailyData[name]["quantitySold"] * dailyData[name]["SP"]
				dailyData[name]['totalProfit'] = dailyData[name]["quantitySold"] * dailyData[name]["ProfitPerUnit"]
			})


			graphData['dailyData'] = dailyData
			const tableData = {}
			let totalSales = 0
			let totalProfit = 0
			let totalUnitsSold = 0
			tableData['th'] = ['Item Name', 'Selling Price', 'Profit Per Unit', 'Units Sold', 'Total Sales', 'Net Profit']
			tableData['td'] = []
			Object.keys(dailyData).forEach((item) => {
				const tdData = [item]
				tdData.push(dailyData[item]['SP'])
				tdData.push(dailyData[item]['ProfitPerUnit'])
				tdData.push(dailyData[item]['quantitySold'])
				tdData.push(dailyData[item]['totalSales'])
				tdData.push(dailyData[item]['totalProfit'])
				totalSales += dailyData[item]['totalSales']
				totalProfit += dailyData[item]['totalProfit']
				totalUnitsSold += dailyData[item]['quantitySold']
				tableData['td'].push(tdData)
			})
			const totalSalesTd = ['Total', '-', '-', totalUnitsSold, totalSales, totalProfit]
			tableData['td'].push(totalSalesTd)
			createTable(tableData)
			return
		})
		.catch(error => { console.log(error) })
	})
	document.getElementById("loader").classList.remove("active")

})

const htmlToCSV = (html, filename) => {
	var data = [];
	var rows = document.querySelectorAll("table tr");
	for (var i = 0; i < rows.length; i++) {
		var row = [], cols = rows[i].querySelectorAll("td, th");
		for (var j = 0; j < cols.length; j++) {
			row.push(cols[j].innerText);
		}
		data.push(row.join(",")); 		
	}
	downloadCSVFile(data.join("\n"), filename);
}

const downloadCSVFile = (csv, filename) => {
	var csvFile = new Blob([csv], {type: "text/csv"});
	var downloadLink = document.createElement("a");
	downloadLink.download = filename;
	downloadLink.href = window.URL.createObjectURL(csvFile);
	downloadLink.style.display = "none";
	document.body.appendChild(downloadLink);
	downloadLink.click()
}

const downloadCSVBtn = document.getElementById("downloadCSV")
downloadCSVBtn.addEventListener('click', (e) => {
	e.preventDefault()
	htmlToCSV(document.querySelector("table").outerHTML, "data.csv")
})


monthlyDataBtn.addEventListener("click", (e) => {
	e.preventDefault()
	document.getElementById("loader").classList.add("active")

	const items = fetchItemsUrl(`https://billyapi.root.sx/items?uid=${auth.currentUser.uid}`)
	items.then((items) => {
		fetch(`https://billyapi.root.sx/monthlySales`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"uid": auth.currentUser.uid})
		})
		.then(data => data.json())
		.then(data => {
			if (data.success === false) {
				window.alert("Please try again later")
				return
			}

			const dates = Object.keys(data.data)
			const monthlyData = {}
			const monthlySepData = {}
			dates.forEach((date) => {
				monthlyData[date] = {"totalUnitsSold": data.data[date]['total']}
				let totalSales = 0
				let totalProfit = 0
				const itemNames = Object.keys(data.data[date])
				itemNames.forEach((name) => {
					if (name === 'total') { return }
					if (monthlySepData[name]) {
						monthlySepData[name]['sales'] += (parseInt(data.data[date][name]) * items[name]['SP'])
					} else {
						monthlySepData[name] = {"sales": (parseInt(data.data[date][name]) * items[name]['SP'])}
					}
					totalSales += (parseInt(data.data[date][name]) * items[name]['SP'])
					totalProfit += (parseInt(data.data[date][name]) * items[name]['Profit'])
				})
				monthlyData[date]['totalSales'] = totalSales
				monthlyData[date]['totalProfit'] = totalProfit
			})

			graphData['monthlySepData'] = monthlySepData
			graphData['monthlyData'] = monthlyData

			const tableData = {}
			let totalSales = 0
			let totalProfit = 0
			let totalUnitsSold = 0
			tableData['th'] = ['Date', 'Units Sold', 'Total Sales', 'Net Profit']
			tableData['td'] = []
			Object.keys(monthlyData).forEach((date) => {
				const tdData = [date]
				tdData.push(monthlyData[date]['totalUnitsSold'])
				tdData.push(monthlyData[date]['totalSales'])
				tdData.push(monthlyData[date]['totalProfit'])
				totalUnitsSold += monthlyData[date]['totalUnitsSold']
				totalSales += monthlyData[date]['totalSales']
				totalProfit += monthlyData[date]['totalProfit']
				tableData['td'].push(tdData)
			})
			tableData['td'].push(['Total', totalUnitsSold, totalSales, totalProfit])
			createTable(tableData)
			return
		})
	})
	document.getElementById("loader").classList.remove("active")

})

priceDistributionBtn.addEventListener("click", (e) => {
	e.preventDefault()
	document.getElementById("loader").classList.add("active")

	const items = fetchItemsUrl(`https://billyapi.root.sx/items?uid=${auth.currentUser.uid}`)
	items.then((items) => {
		fetch(`https://billyapi.root.sx/priceDistribution`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"uid": auth.currentUser.uid})
		})
		.then(data => data.json())
		.then(data => {
			if (data.success === false) {
				window.alert("Please try again later")
				return
			}

			const allData = data.data
			const names = Object.keys(allData)
			const allTimeData = {}
			let totalUnitsSoldOverall = 0
			names.forEach((name) => {
				allTimeData[name] = {"SP": parseInt(items[name]['SP']), "ProfitPerUnit": parseInt(items[name]['Profit']), "UnitsSold": allData[name]}
				totalUnitsSoldOverall += allData[name]
				allTimeData[name]['totalSales'] = allTimeData[name]['UnitsSold'] * allTimeData[name]['SP']
				allTimeData[name]['totalProfit'] = allTimeData[name]['UnitsSold'] * allTimeData[name]['ProfitPerUnit']

			})
			let totalSalesOverall = 0
			let totalProfitOverall = 0
			const tableData = {}
			tableData['th'] = ['Item Name', 'Selling Price', 'Profit Per Unit', 'Units Sold', 'Total Sales', 'Total Profit', '% Contribution']
			tableData['td'] = []
			Object.keys(allTimeData).forEach((name) => {
				totalSalesOverall += allTimeData[name]['totalSales']
				totalProfitOverall += allTimeData[name]['totalProfit']
			})
			Object.keys(allTimeData).forEach((name) => {
				if (name === 'totalSales' || name === 'totalProfit') { return }
				const tdData = [name]
				tdData.push(allTimeData[name]['SP'])
				tdData.push(allTimeData[name]['ProfitPerUnit'])
				tdData.push(allTimeData[name]['UnitsSold'])
				tdData.push(allTimeData[name]['totalSales'])
				tdData.push(allTimeData[name]['totalProfit'])
				const percentContribute = (parseFloat(allTimeData[name]['totalProfit'] / totalProfitOverall * 100).toFixed(2)).toString() + "%"
				tdData.push(percentContribute)
				tableData['td'].push(tdData)
			})

			tableData['td'].push(['Total', '-', '-', totalUnitsSoldOverall, totalSalesOverall, totalProfitOverall, '-'])
			createTable(tableData)
			return
		})
	})
	document.getElementById("loader").classList.remove("active")

})

const addGraph = (title, config) => {
	document.getElementById("loader").classList.add("active")

	const div = document.createElement("div")
	div.className = "graphDiv"
	const h1 = document.createElement("h1")
	h1.innerText = title
	h1.class = "graphTitle"
	div.appendChild(h1)
	const canvas = document.createElement("canvas")
	if (config.type === "pie"){
		canvas.className = "pie"
		div.className += " pieDiv"
	}
	new Chart(
		canvas,
		config
	)
	div.appendChild(canvas)
	document.getElementById("dataGraphs").appendChild(div)
	document.getElementById("loader").classList.remove("active")

	return
}

const createGraph = (graphData, graphType, dataSetLabel, graphOptions) => {
	const labels = Object.keys(graphData)
	const backgroundColours = []
	labels.forEach((label) => {
		backgroundColours.push(getRandomColor())
	})

	const values = []
	Object.values(graphData).forEach((data) => {
		values.push(data.sales)
	})
	const data = {
		labels: labels,
		datasets: [{
			label: dataSetLabel,
			backgroundColor: backgroundColours,
			data: values
		}]
	}

	const config = {
		type: graphType,
		data: data,
		options: graphOptions
	}


	return addGraph(dataSetLabel, config)
}

graphsBtn.addEventListener("click", (e) => {
	e.preventDefault()
	document.getElementById("loader").classList.add("active")

	const dataTable = document.getElementById("dataTable")
	dataTable.classList.remove("active")
	const dataGraphs = document.getElementById("dataGraphs")
	if (dataGraphs.classList.contains("active")) { return }
	dataGraphs.classList.add("active")
	if (Array.from(dataGraphs.getElementsByTagName("canvas")).length > 0) { return }
	
	// monthly sales pie chart
	const items = fetchItemsUrl(`https://billyapi.root.sx/items?uid=${auth.currentUser.uid}`)
	items.then((items) => {
		fetch(`https://billyapi.root.sx/monthlySales`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"uid": auth.currentUser.uid})
		})
		.then(data => data.json())
		.then(data => {
			if (data.success === false) {
				window.alert("Please try again later")
				return
			}

			const dates = Object.keys(data.data)
			const monthlySepData = {}
			dates.forEach((date) => {
				const itemNames = Object.keys(data.data[date])
				itemNames.forEach((name) => {
					if (name === 'total') { return }
					if (monthlySepData[name]) {
						monthlySepData[name]['sales'] += (parseInt(data.data[date][name]) * items[name]['SP'])
					} else {
						monthlySepData[name] = {"sales": (parseInt(data.data[date][name]) * items[name]['SP'])}
					}
				})
			})
			graphData['monthlySepData'] = monthlySepData
			createGraph(graphData['monthlySepData'], "bar", "Current Month Sales", {})

		})


	//monthly sales line and bar graph
		fetch(`https://billyapi.root.sx/monthlySales`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"uid": auth.currentUser.uid})
		})
			.then(data => data.json())
			.then(data => {
				if (data.success === false) {
					window.alert("Please try again later")
					return
				}

				const dates = Object.keys(data.data)
				const monthlyData = {}
				dates.forEach((date) => {
					monthlyData[date] = {"totalUnitsSold": data.data[date]['total']}
					let totalSales = 0
					let totalProfit = 0
					const itemNames = Object.keys(data.data[date])
					itemNames.forEach((name) => {
						if (name === 'total') { return }
						totalSales += (parseInt(data.data[date][name]) * items[name]['SP'])
						totalProfit += (parseInt(data.data[date][name]) * items[name]['Profit'])
					})
					monthlyData[date]['totalSales'] = totalSales
					monthlyData[date]['totalProfit'] = totalProfit
				})

				graphData['monthlyData'] = monthlyData
				const salesValues = []
				const profitValues = []
				const unitsSoldValues = []
				const labels = Object.keys(graphData['monthlyData'])
				dates.forEach((date) => {
					salesValues.push(graphData['monthlyData'][date]['totalSales'])
					profitValues.push(graphData['monthlyData'][date]['totalProfit'])
					unitsSoldValues.push(graphData['monthlyData'][date]['totalUnitsSold'])
				})

				const datasets = []
				datasets.push({
					label: "Sales",
					backgroundColor: "#ff0000",
					borderColor: "#ff0000",
					data: salesValues
				})

				datasets.push({
					label: "Profit",
					backgroundColor: "#00ff00",
					borderColor: "#00ff00",
					data: profitValues
				})

				datasets.push({
					label: "Units Sold",
					backgroundColor: "#036bfc",
					borderColor: "#036bfc",
					data: unitsSoldValues
				})

				const graphDatas = {
					labels: labels,
					datasets: datasets
				}

				const config = {
					type: 'line',
					data: graphDatas,
					options: {}
				}
				addGraph("Sales VS Profit VS Units", config)

			})


		// daily sales vs per item sales line graph
		fetch(`https://billyapi.root.sx/dailySales`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"uid": getAuth().currentUser.uid})
		})
			.then(data => data.json())
			.then(data => {
				if (data.success === false) {
					window.alert(data['Error'])
					return
				}

				const dailyData = {}
				let totalSales = 0
				const names = Object.keys(data)
				names.forEach((name) => {
					dailyData[name] = {"quantitySold": parseInt(data[name]), "SP": parseInt(items[name]["SP"]), "ProfitPerUnit": parseInt(items[name]["Profit"])}
					dailyData[name]['totalSales'] = dailyData[name]["quantitySold"] * dailyData[name]["SP"]
					dailyData[name]['totalProfit'] = dailyData[name]["quantitySold"] * dailyData[name]["ProfitPerUnit"]
					totalSales += dailyData[name]['totalSales']
				})


				graphData['dailyData'] = dailyData
				const datasets = []
				const totalSalesData = []
				const perItemSalesData = []
				const backgroundColours = []
				const labels = []
				Object.keys(graphData['dailyData']).forEach((item) => {
					totalSalesData.push(totalSales)
					perItemSalesData.push(graphData['dailyData'][item]['totalSales'])
					backgroundColours.push(getRandomColor())
					labels.push(item)
				})

				datasets.push({
					type: 'bar',
					label: 'Sales',
					data: perItemSalesData,
					backgroundColor: backgroundColours
				})
				datasets.push({
					type: 'line',
					label: 'Total Sales',
					data: totalSalesData,
					backgroundColor: "#036bfc",
					borderColor: "#036bfc"
				})


				const mixedData = {
					datasets: datasets,
					labels: labels
				}
				const config = {
					type: "scatter",
					data: mixedData,
					options:
					{
						scales:
						{
							y:
							{
								beginAtZero: true
							}
						}
					}
				}

				addGraph('Daily Sales', config)
			})

		// yearly sales graph
		fetch("https://billyapi.root.sx/yearlySales", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({ "uid": auth.currentUser.uid })
		})
			.then(data => data.json())
			.then(data => {
				if (data.success === false) {
					window.alert("Please try again later")
					return
				}

				const yearlyItemsData = data.data
				const yearlySalesData = {}
				Object.keys(yearlyItemsData).forEach((month) => {
					yearlySalesData[month] = {"sales": 0}
					Object.keys(yearlyItemsData[month]).forEach((item) => {
						yearlySalesData[month]['sales'] += (parseInt(yearlyItemsData[month][item]) * items[item]['SP'])
					})
				})
				createGraph(yearlySalesData, "bar", "Current Year Sales", {})
			})
		})

	document.getElementById("loader").classList.remove("active")
	
})


