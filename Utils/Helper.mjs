import tg from "../Config/Telegram.mjs"
import ShortUniqueId from "short-unique-id"

export const displayError = err => {
    return console.log(err.message)
}

export const getRefId = () => {
    const uuid = new ShortUniqueId({ length: 10 })
    return uuid.rnd()
}

export const getChat = async id => {
    try {
        const { id: chat_id, first_name, last_name, username, type } = await tg.getChat(id)
        const mention = username ? `@${username}` : `<a href='tg://user?id=${chat_id}'>${first_name}</a>`
        return {
            chat_id,
            first_name,
            last_name,
            username,
            type,
            mention
        }
    } catch (err) {
        return displayError(err)
    }
}

export const keys = {
    mainKey: [
        ["👆 Join Chat / Channel"],
        ["🪙 Coins", "✅ My Lists", "👛 Refer"],
        ["➕ Add Chat / Channel"]
    ],
    cancelKey: [
        ["✖️ Cancel"]
    ]
}

export const answerCallback = {}
export const answerStore = {}