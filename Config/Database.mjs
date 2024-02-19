import { connect } from "mongoose"
import { env } from "../env.mjs"

connect(env.DB_URL, {
    autoIndex: false
}).then(() => {
    console.log("MongoDB Connected")
}).catch(err => {
    console.log(err.message)
})