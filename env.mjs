import dotenv from "dotenv"

dotenv.config()

export const env = {
    DB_URL: process.env.DB_URL,
    BOT_TOKEN: process.env.BOT_TOKEN,
    SERVER: process.env.SERVER,
    ADMIN_ID: process.env.ADMIN_ID,
    BOT_NAME: process.env.BOT_NAME,
    BOT_ID: process.env.BOT_ID,
    CHANNEL_ID: process.env.CHANNEL_ID,
    CHANNEL_USERNAME: process.env.CHANNEL_USERNAME
}