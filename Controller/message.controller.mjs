import tg from "../Config/Telegram.mjs";
import { chatDB } from "../Models/chat.model.mjs";
import { answerCallback, answerStore, displayError, getChat, keys } from "../Utils/Helper.mjs";
import { env } from "../env.mjs";

tg.on("message", async message => {
    try {
        const { chat_id } = await getChat(message.chat.id)
        const store = answerStore[chat_id]
        if (!store) {
            answerStore[chat_id] = {}
        }
        const callback = answerCallback[chat_id]

        const exeptText = ["➕ Add Chat / Channel"]

        if (exeptText.includes(message.text)) {
            return
        }

        if (message.text == "✖️ Cancel") {
            answerCallback[chat_id] = null
            return await tg.sendMessage(chat_id, `<i>✖️ Process cancelled!</i>`, {
                parse_mode: "HTML",
                reply_markup: {
                    keyboard: keys.mainKey,
                    resize_keyboard: true
                }
            })
        }

        if (callback == "add_username") {
            if (!message.text) {
                return await tg.sendMessage(chat_id, `<i>✖️ Looks like an invalid input!</i>`, {
                    parse_mode: "HTML"
                })
            }
            const receivedUsername = message.text.replace("@", "")
            let chat_username = `@${receivedUsername}`
            try {
                const response = await tg.getChat(chat_username)
                const chatType = response.type
                const chatId = response.id
                if (chatType != "channel" && chatType != "group" && chatType != "supergroup") {
                    return await tg.sendMessage(chat_id, `<i>✖️ Looks like an invalid chat / channel</i>`, {
                        parse_mode: "HTML"
                    })
                }
                try {
                    const exist = await chatDB.findOne({
                        user: chat_id,
                        username: receivedUsername
                    })
                    if (exist) {
                        return await tg.sendMessage(chat_id, `<i>✖️ Looks like chat / channel already exist</i>`, {
                            parse_mode: "HTML"
                        })
                    }
                    const response = await tg.getChatMember(chat_username, env.BOT_ID)
                    if (response.status == "administrator") {
                        await chatDB.create({
                            user: chat_id,
                            username: receivedUsername,
                            type: chatType,
                            chat_id: chatId
                        })
                        answerCallback[chat_id] = null
                        return await tg.sendMessage(chat_id, `<i>✅ ${chat_username} added</i>`, {
                            parse_mode: "HTML",
                            reply_markup: {
                                keyboard: keys.mainKey,
                                resize_keyboard: true
                            }
                        })
                    } else {
                        return await tg.sendMessage(chat_id, `<i>✖️ @${env.BOT_NAME} is not an administrator of ${chat_username}</i>`, {
                            parse_mode: "HTML"
                        })
                    }
                } catch (err) {
                    return await tg.sendMessage(chat_id, `<i>✖️ @${env.BOT_NAME} is not an administrator of ${chat_username}</i>`, {
                        parse_mode: "HTML"
                    })
                }
            } catch (err) {
                return await tg.sendMessage(chat_id, `<i>✖️ Looks like an invalid chat / channel</i>`, {
                    parse_mode: "HTML"
                })
            }
        }

    } catch (err) {
        return displayError(err)
    }
})