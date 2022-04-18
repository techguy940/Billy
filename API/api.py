from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import aiosqlite
from datetime import datetime, timedelta
import json
import ast




app = FastAPI()

origins = ["*"]

app.add_middleware(
	CORSMiddleware,
	allow_origins=origins,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

async def check_account(request):
	try:
		request = await request.json()
	except:
		return {"Error": "Invalid Format", "success": False}

	if not request.get("uid"):
		return {"Error": "Invalid Format", "success": False}

	conn = await aiosqlite.connect("maindb.db")
	c = await conn.cursor()
	data = await c.execute('SELECT personName FROM Users WHERE UID=$1', (request['uid'], ))
	result = await data.fetchone()
	if not result:
		return {"Error": "Account does not exists", "success": False}
	return {"success": True}

@app.post("/contactUs")
async def contact_us(request: Request):
	try:
		request = await request.json()
	except:
		return {"Error": "Invalid Format", "success": False}
	name = request.get("name")
	email = request.get("email")
	msg = request.get("msg")
	with open("contact_us_s.json", "r") as f:
		contact_us_data = json.load(f)
		contact_us_data.append({"name": name, "email": email, "msg": msg})
	with open("contact_us_s.json", "w") as f:
		json.dump(contact_us_data, f, indent=4)
		return {"success": True}

@app.post("/checkFirstTime")
async def home(request: Request):
	try:
		request = await request.json()
		request["uid"]
	except:
		return {"Error": "Invalid Format"}
	uid = request['uid']
	conn = await aiosqlite.connect("maindb.db")
	c = await conn.cursor()
	data = await c.execute('SELECT personName FROM Users WHERE UID=$1', (request['uid'], ))
	result = await data.fetchone()
	await conn.close()
	return {"firstTime": True if not result else False}

@app.post("/createUser")
async def create(request: Request):
	try:
		request = await request.json()
	except:
		return {"Error": "Invalid Format"}

	if not request.get("uid"):
		return {"Error": "Invalid Format"}

	conn = await aiosqlite.connect("maindb.db")
	c = await conn.cursor()
	data = await c.execute('SELECT PersonName FROM Users WHERE UID=$1', (request['uid'], ))
	result = await data.fetchone()
	if result:
		return {"Error": "Account already exists"}
	await c.execute('INSERT INTO Users (UID, PersonName, BusinessName) VALUES ($1, $2, $3)', (request['uid'], request['personName'], request['businessName']))
	await c.execute('INSERT INTO Items (UID, ItemsData) VALUES ($1, $2)', (request['uid'], str(request['items'])))
	await conn.commit()
	await conn.close()
	return {"Success": "Account created"}


@app.post("/addSales")
async def add_sales(request: Request):
	check = await check_account(request)
	if not check['success']:
		return check

	request = await request.json()

	conn = await aiosqlite.connect("maindb.db")
	c = await conn.cursor()

	await c.execute('INSERT INTO Sales (UID, Date, ItemsSold) VALUES ($1, $2, $3)', (request['uid'], datetime.now().strftime("%Y-%m-%d"), str(request['salesData'])))
	await conn.commit()
	await conn.close()
	return {"success": True}

@app.post("/editProfile")
async def edit_profile(request: Request):
	check = await check_account(request)
	if not check['success']:
		return check

	request = await request.json()

	conn = await aiosqlite.connect("maindb.db")
	c = await conn.cursor()

	await c.execute('UPDATE Users SET PersonName=$1, BusinessName=$2 WHERE UID=$3', (request['personName'], request['businessName'], request['uid']))

	await c.execute('UPDATE Items SET ItemsData=$1 WHERE UID=$2', (str(request['items']), request['uid']))
	await conn.commit()
	await conn.close()
	return {"success": True}

@app.post("/dailySales")
async def daily_sales(request: Request):
	check = await check_account(request)
	if not check['success']:
		return check

	request = await request.json()

	conn = await aiosqlite.connect("maindb.db")
	c = await conn.cursor()

	data = await c.execute('SELECT ItemsSold FROM Sales WHERE (UID=$1 AND Date=$2)', (request['uid'], datetime.now().strftime("%Y-%m-%d")))
	result = await data.fetchall()
	sales = {}
	for i in result:
		main_data = ast.literal_eval(i[0])
		for j in main_data:
			if j in sales:
				sales[j] += main_data[j]
			else:
				sales[j] = main_data[j]
	return sales


@app.post("/yesterdaySales")
async def yesteray_sales(request: Request):
	check = await check_account(request)
	if not check['success']:
		return check

	request = await request.json()

	conn = await aiosqlite.connect("maindb.db")
	c = await conn.cursor()

	data = await c.execute('SELECT ItemsSold FROM Sales WHERE (UID=$1 AND Date=$2)', (request['uid'], (datetime.now()-timedelta(days=1)).strftime("%Y-%m-%d")))
	result = await data.fetchall()
	sales = {}
	for i in result:
		main_data = ast.literal_eval(i[0])
		for j in main_data:
			if j in sales:
				sales[j] += main_data[j]
			else:
				sales[j] = main_data[j]
	return sales

@app.post("/monthlySales")
async def monthly_sales(request: Request):
	check = await check_account(request)
	if not check['success']:
		return check
	request = await request.json()
	month = datetime.now().strftime("-%m-")

	conn = await aiosqlite.connect("maindb.db")
	c = await conn.cursor()

	data = await c.execute(f'SELECT * FROM Sales WHERE (UID=$1 AND Date LIKE "%{month}%")', (request['uid'], ))
	result = await data.fetchall()
	monthly_data = {}
	for i in result:
		item_data = ast.literal_eval(i[2])
		if i[1] in monthly_data:
			for j in item_data:
				if j in monthly_data[i[1]]:
					monthly_data[i[1]][j] += item_data[j]
				else:
					monthly_data[i[1]][j] = item_data[j]
		else:
			monthly_data[i[1]] = item_data
	for i in monthly_data:
		monthly_data[i]['total'] = sum(list(monthly_data[i].values()))
	return {"success": True, "data": monthly_data}

@app.post("/lastMonthlySales")
async def last_monthly_sales(request: Request):
	check = await check_account(request)
	if not check['success']:
		return check
	request = await request.json()
	month = "-" + str(int(datetime.now().strftime("%m"))-1) + "-"

	conn = await aiosqlite.connect("maindb.db")
	c = await conn.cursor()

	data = await c.execute(f'SELECT * FROM Sales WHERE (UID=$1 AND Date LIKE "%{month}%")', (request['uid'], ))
	result = await data.fetchall()
	monthly_data = {}
	for i in result:
		item_data = ast.literal_eval(i[2])
		if i[1] in monthly_data:
			for j in item_data:
				if j in monthly_data[i[1]]:
					monthly_data[i[1]][j] += item_data[j]
				else:
					monthly_data[i[1]][j] = item_data[j]
		else:
			monthly_data[i[1]] = item_data
	for i in monthly_data:
		monthly_data[i]['total'] = sum(list(monthly_data[i].values()))
	return {"success": True, "data": monthly_data}

@app.get("/userProfile")
async def user_profile(uid: str):
	if not uid:
		return {"Error": "Invalid Format", "success": False}

	conn = await aiosqlite.connect("maindb.db")
	c = await conn.cursor()
	data = await c.execute('SELECT PersonName, BusinessName FROM Users WHERE UID=$1', (uid, ))
	result = await data.fetchone()
	if not result:
		return {"Error": "Account does not exists", "success": False}
	await conn.close()
	return {"success": True, "personName": result[0], "businessName": result[1]}

@app.get("/items")
async def get_items(uid: str):
	if not uid:
		return {"Error": "Invalid Format", "success": False}

	conn = await aiosqlite.connect("maindb.db")
	c = await conn.cursor()
	data = await c.execute('SELECT ItemsData FROM Items WHERE UID=$1', (uid, ))
	result = await data.fetchone()
	if not result:
		return {"Error": "Account does not exists", "success": False}
	await conn.close()
	items = []
	for i in result:
		main_data = ast.literal_eval(i)
		items.append(main_data)
	return {"success": True, "items": items}


@app.post("/priceDistribution")
async def price_distribution(request: Request):
	check = await check_account(request)
	if not check['success']:
		return check
	request = await request.json()

	conn = await aiosqlite.connect("maindb.db")
	c = await conn.cursor()
	data = await c.execute('SELECT ItemsSold FROM Sales WHERE UID=$1', (request['uid'], ))
	results = await data.fetchall()
	all_time_data = {}
	for i in results:
		main_data = ast.literal_eval(i[0])
		for item in main_data:
			if item in all_time_data:
				all_time_data[item] += main_data[item]
			else:
				all_time_data[item] = main_data[item]
	return {"success": True, "data": all_time_data}



@app.post("/yearlySales")
async def yearly_sales(request: Request):
	check = await check_account(request)
	if not check['success']:
		return check
	request = await request.json()

	conn = await aiosqlite.connect("maindb.db")
	c = await conn.cursor()
	year = datetime.now().strftime("%Y")
	data = await c.execute(f'SELECT * FROM Sales WHERE (UID=$1 AND Date LIKE "{year}%")', (request['uid'], ))
	results = await data.fetchall()
	yearly_sales = {}
	for i in results:
		date = datetime.strptime(i[1], "%Y-%m-%d").strftime("%B")
		data = ast.literal_eval(i[2])
		if date not in yearly_sales:
			yearly_sales[date] = {}
		for item in data:
			if item not in yearly_sales[date]:
				yearly_sales[date][item] = data[item]
			else:
				yearly_sales[date][item] += data[item]
	return {"success": True, "data": yearly_sales}






uvicorn.run(app, host="0.0.0.0", port=8000)
