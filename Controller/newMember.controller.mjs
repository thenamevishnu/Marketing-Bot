import tg from "../Config/Telegram.mjs";
import { userDB } from "../Models/user.model.mjs";
import { displayError, getChat } from "../Utils/Helper.mjs";
import { env } from "../env.mjs";

tg.on("new_chat_members", async message => {
    try {
        if(message.chat.username != env.CHANNEL_USERNAME) return
        const chat = await getChat(message.new_chat_members[0].id)
        const user = await userDB.findOne({
            _id: chat.chat_id,
            "joining_bonus_received.received": false,
            "joining_bonus_received.times": 0
        })
        if (user) {
            await userDB.updateOne({
                refId: user.invited_by
            }, {
                $inc: {
                    balance: 1,
                    invites: 1
                }
            })
            await userDB.updateOne({
                _id: chat.chat_id,
                "joining_bonus_received.received": false,
                "joining_bonus_received.times": 0
            }, {
                $set: {
                    "joining_bonus_received.received": true
                },
                $inc: {
                    "joining_bonus_received.times": 1,
                    balance: 5
                }
            })
            return await tg.sendMessage(chat.chat_id, `<i>🎁 You have received 5 coins as joining bonus!</i>`, {
                parse_mode: "HTML"
            })
        }
        return await userDB.updateOne({
            _id: chat.chat_id
        }, {
            $inc: {
                "joining_bonus_received.times": 1
            }
        })
    } catch (err) {
        return displayError(err)
    }
})

tg.on("left_chat_member", async message => {
    try {
        if(message.chat.username != env.CHANNEL_USERNAME) return
        const chat = await getChat(message.left_chat_member.id)
        const user = await userDB.findOne({
            _id: chat.chat_id,
            "joining_bonus_received.received": true,
            "joining_bonus_received.times": 1
        })
        if (user) {
            await userDB.updateOne({
                _id: chat.chat_id,
                "joining_bonus_received.received": true,
                "joining_bonus_received.times": 1
            }, {
                $inc: {
                    balance: -5
                }
            })
            return await tg.sendMessage(chat.chat_id, `<i>❌ Deducted joining bonus, Because you let the chat!</i>`, {
                parse_mode: "HTML"
            })
        }
    } catch (err) {
        return displayError(err)
    }
})