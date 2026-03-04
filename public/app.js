const tempData = []
const smokeData = []
const labels = []

/* ================================
   TEMPERATURE GRAPH
================================ */

const tempChart = new Chart(
document.getElementById("tempChart"),
{
type:"line",
data:{
labels:labels,
datasets:[{
label:"Temperature °C",
data:tempData,
borderColor:"red",
backgroundColor:"rgba(255,0,0,0.2)",
fill:true,
tension:0.3
}]
},
options:{
responsive:true,
plugins:{
legend:{labels:{color:"white"}}
},
scales:{
x:{ticks:{color:"white"}},
y:{ticks:{color:"white"}}
}
}
})

/* ================================
   SMOKE GRAPH
================================ */

const smokeChart = new Chart(
document.getElementById("smokeChart"),
{
type:"line",
data:{
labels:labels,
datasets:[{
label:"Smoke",
data:smokeData,
borderColor:"orange",
backgroundColor:"rgba(255,165,0,0.2)",
fill:true,
tension:0.3
}]
},
options:{
responsive:true,
plugins:{
legend:{labels:{color:"white"}}
},
scales:{
x:{ticks:{color:"white"}},
y:{ticks:{color:"white"}}
}
}
})

/* ================================
   LOAD LIVE SENSOR DATA
================================ */

async function loadData(){

try{

const res = await fetch("/api/latest")
const data = await res.json()

/* CARD UPDATE */

document.getElementById("temp").innerText =
data.temperature + " °C"

document.getElementById("smoke").innerText =
data.smoke

document.getElementById("status").innerText =
data.status

/* STATUS COLOR */

const statusCard =
document.getElementById("statusCard")

statusCard.classList.remove("safe","warning","fire")

if(data.status==="SAFE"){
statusCard.classList.add("safe")
}

if(data.status==="WARNING"){
statusCard.classList.add("warning")
}

if(data.status==="FIRE"){
statusCard.classList.add("fire")
}

/* GRAPH UPDATE */

labels.push(new Date().toLocaleTimeString())

tempData.push(data.temperature)

smokeData.push(data.smoke)

/* KEEP LAST 20 */

if(labels.length>20){
labels.shift()
tempData.shift()
smokeData.shift()
}

tempChart.update()
smokeChart.update()

}catch(err){
console.log("Data error",err)
}

}

/* ================================
   LOAD HISTORY TABLE
================================ */

async function loadHistory(){

try{

const res = await fetch("/api/history")
const data = await res.json()

const table =
document.getElementById("historyTable")

/* CLEAR OLD TABLE */

table.innerHTML = `
<tr>
<th>Time</th>
<th>Temp</th>
<th>Smoke</th>
<th>Status</th>
</tr>
`

data.forEach(d=>{

const row = table.insertRow()

row.insertCell(0).innerText =
new Date(d.timestamp).toLocaleTimeString()

row.insertCell(1).innerText =
d.temperature

row.insertCell(2).innerText =
d.smoke

row.insertCell(3).innerText =
d.status

})

}catch(err){
console.log("History error",err)
}

}

/* ================================
   AUTO REFRESH
================================ */

setInterval(loadData,2000)

setInterval(loadHistory,30000)

loadData()

loadHistory()