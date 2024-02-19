import express from "express"
import * as db from "./Config/Database.mjs"
import cronJob from "node-cron"
import axios from "axios"
import serverRoute from "./Routes/server.route.mjs"
import "./Routes/tg.route.mjs"
import { env } from "./env.mjs"
import "./Config/Database.mjs"

const app = express()

cronJob.schedule("* * * * *", async () => {
    axios.get(`${env.SERVER}`).then(({ data: resData }) => {
        console.log("Server wokeup")
    }).catch(err => {
        console.log(err.message)
    })
})

app.use(express.json())

app.use("/", serverRoute)

app.listen(3000, () => {
    console.log("Server started!")
})