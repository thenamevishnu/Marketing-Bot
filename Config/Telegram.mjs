import Telegram from "node-telegram-bot-api"
import { env } from "../env.mjs"

const tg = new Telegram(env.BOT_TOKEN, {
    polling: true
})

export default tg