require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const mqtt = require("mqtt");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ===========================
   MONGODB CONNECTION
=========================== */

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log("Mongo Error:",err));

/* ===========================
   EMAIL TRANSPORTER
=========================== */

const transporter = nodemailer.createTransport({
service:"gmail",
auth:{
user:process.env.ADMIN_EMAIL,
pass:process.env.EMAIL_PASS
}
});

/* ===========================
   SCHEMA
=========================== */

const FireSchema = new mongoose.Schema({
temperature:Number,
smoke:Number,
status:String,
timestamp:{type:Date,default:Date.now}
});

const FireData = mongoose.model("FireData",FireSchema);

/* ===========================
   MQTT CONNECT
=========================== */

const mqttClient = mqtt.connect({
host:process.env.MQTT_HOST,
port:8883,
protocol:"mqtts",
username:process.env.MQTT_USER,
password:process.env.MQTT_PASS
});

mqttClient.on("connect",()=>{

console.log("MQTT Connected");

mqttClient.subscribe("kaif/fire/#");

});

/* ===========================
   MQTT MESSAGE RECEIVE
=========================== */
let fireAlertSent = false;
let latestData={
temperature:0,
smoke:0,
status:"SAFE"
};

mqttClient.on("message",async(topic,message)=>{

try{

const msg = message.toString();

/* TEMPERATURE */

if(topic.includes("temperature")){
latestData.temperature=parseFloat(msg);
}

/* SMOKE */

if(topic.includes("smoke")){
latestData.smoke=parseInt(msg);
}

/* STATUS */

if(topic.includes("status")){

latestData.status=msg;
if(msg==="SAFE"){
fireAlertSent = false;
}
/* SAVE TO DATABASE */

const newEntry=new FireData({
temperature:latestData.temperature,
smoke:latestData.smoke,
status:latestData.status
});

await newEntry.save();

console.log("Saved to DB");

/* =====================
   FIRE EMAIL ALERT
===================== */

if(msg==="FIRE" && fireAlertSent===false){

const mailOptions={
from:process.env.ADMIN_EMAIL,
to:process.env.ADMIN_EMAIL,
subject:"🔥 FIRE ALERT DETECTED",
text:`

FIRE DETECTED!

Temperature: ${latestData.temperature} °C
Smoke Level: ${latestData.smoke}

Check the dashboard immediately.

`
};

transporter.sendMail(mailOptions,(err,info)=>{

if(err){
console.log("Email Error:",err);
}
else{
console.log("Fire alert email sent");
}

});
fireAlertSent = true;
}

}

}catch(err){

console.log("MQTT Error:",err);

}

});

/* ===========================
   API ROUTES
=========================== */

/* LIVE DATA */

app.get("/api/latest",(req,res)=>{

res.json(latestData);

});

/* LAST 20 RECORDS */

app.get("/api/history",async(req,res)=>{

try{

const data = await FireData
.find()
.sort({timestamp:-1})
.limit(20);

res.json(data);

}catch(err){

res.status(500).json({error:err.message});

}

});

/* ===========================
   SERVER START
=========================== */

app.listen(5000,()=>{

console.log("Server running on port 5000");

});