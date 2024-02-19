import tg from "../Config/Telegram.mjs"
import { chatDB } from "../Models/chat.model.mjs"
import { userDB } from "../Models/user.model.mjs"
import { answerCallback, displayError, getChat, getRefId, keys } from "../Utils/Helper.mjs"
import { env } from "../env.mjs"

tg.onText(/\/start(?: (.+))?$/, async (message, match) => {
    try {
        const { chat_id, first_name, last_name, username, type, mention } = await getChat(message.chat.id)
        if (!chat_id || type != "private") return
        let inviter = match ? match[1] ? match[1] : null : null
        const user = await userDB.findOne({
            _id: chat_id
        })
        if (!user) {
            const findInviter = await userDB.findOne({
                refId: inviter
            })
            if (!findInviter) {
                inviter = null
            }
            let refid = getRefId()
            let findExist = await userDB.findOne({ refId: refid })
            while (findExist) {
                refid = getRefId()
                findExist = await userDB.findOne({ refId: refid })
                if(!findExist) break
            }
            await userDB.create({
                _id: chat_id,
                first_name: first_name,
                last_name: last_name,
                username: username,
                invited_by: inviter,
                refId: refid
            })
            const count = await userDB.countDocuments()
            await tg.sendMessage(env.ADMIN_ID, `<i>👤 New User: ${count}\n🛰️ UserName: ${mention}\n🆔 UserID: <code>${chat_id}</code></i>`, {
                parse_mode: "HTML"
            })
            const text = `<i><b>📌 Adding Your Chat/Channel: </b>Users can easily add their Telegram chat or channel by clicking on the <b>➕ "Add Chat/Channel"</b> button. To join chats or channels, simply click on <b>👆 "Join Chat/Channel."</b> Upon joining, you will receive 1 coin, where 1 coin equals 1 member for your chat or channel.

            <b>💼 Managing Your Chats/Channels: </b>Navigate to ✅ "My Lists" to effectively manage your chat or channel status. Here, you can switch the status between <b>✅ "Running"</b> and <b>❌ "Stopped."</b>
            
            <b>🤔 How to Start or Stop: </b>To start a chat or channel, click on the <b>❌ "Stopped"</b> status. This will activate your chat or channel for growth. If you wish to stop it, click on <b>✅ "Running"</b> to temporarily halt activities.</i>`
            await tg.sendMessage(chat_id, text, {
                parse_mode: "HTML"
            })
        }
        await tg.sendMessage(chat_id, `<i>🔥 Free Telegram Members</i>`, {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: keys.mainKey,
                resize_keyboard: true
            }
        })
    } catch (err) {
        return displayError(err)
    }
})

tg.onText(/🪙 Coins$/, async message => {
    try {
        const { chat_id } = await getChat(message.chat.id)
        const user = await userDB.findOne({ _id: chat_id })
        const balance = user.balance
        return await tg.sendMessage(chat_id, `<i>🪙 You have: ${balance} coins</i>`, {
            parse_mode: "HTML"
        })
    } catch (err) {
        return displayError(err)
    }
})

tg.onText(/👛 Refer$/, async message => {
    try {
        const { chat_id } = await getChat(message.chat.id)
        const user = await userDB.findOne({ _id: chat_id })
        const refId = user.refId
        const invites = user.invites
        return await tg.sendMessage(chat_id, `<i>🚀 You have invited ${invites} members\n\n🔗 Link: https://t.me/${env.BOT_NAME}?start=${refId}\n\n✅ You'll receive 1 coin for every verified referral.</i>`, {
            parse_mode: "HTML"
        })
    } catch (err) {
        return displayError(err)
    }
})

tg.onText(/➕ Add Chat \/ Channel$/, async message => {
    try {
        const { chat_id } = await getChat(message.chat.id)
        answerCallback[chat_id] = "add_username"
        return await tg.sendMessage(chat_id, `<i>🚁 Enter username of your chat / channel</i>`, {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: keys.cancelKey,
                resize_keyboard: true
            }
        })
    } catch (err) {
        return displayError(err)
    }
})

tg.onText(/✅ My Lists$/, async message => {
    try {
        const { chat_id } = await getChat(message.chat.id)
        const list = await chatDB.find({ user: chat_id })
        let text = `<i>📃 List of chat / channels</i>`
        const key = list.map(item => {
            return [
                { text: `@${item.username}`, url: `https://t.me/${item.username}` },
                { text: `${item.is_active ? "✅ Running" : "❌ Stopped"}`, callback_data: `/status ${item._id}` },
                { text: `⛔ Remove`, callback_data: `/removeChat ${item._id}`}
            ]
        })
        return await tg.sendMessage(chat_id, text, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: key
            }
        })
    } catch (err) {
        return displayError(err)
    }
})

tg.onText(/👆 Join Chat \/ Channel$/, async message => {
    try {
        const { chat_id } = await getChat(message.chat.id)
        const usersWithBalanceZero = await userDB.find({ balance: { $lte: 0 } }, { _id: 1 })
        const ids = usersWithBalanceZero.map(item => item._id)
        if (usersWithBalanceZero.length > 0) {
            await chatDB.updateMany({
                user: { $in: ids }
            }, {
                $set: {
                    is_active: false
                }
            })
        }
        const chat = await chatDB.aggregate([
            {
                $match: {
                    is_active: true,
                    joined: {
                        $nin: [chat_id]
                    }
                }
            }, {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userinfo"
                }
            }, {
                $limit: 1
            }
        ])
        if (chat.length == 0) {
            return await tg.sendMessage(chat_id, `<i>✖️ No chats / channels found!\n\n⌛ Wait for new new chats / channels</i>`, {
                parse_mode: "HTML"
            })
        }
        const key = [
            [
                { text: "🔗 Click to join", url: `https://t.me/${chat[0].username}` },
                { text: "✅ Joined", callback_data: `/joinedChat ${chat[0]._id}` }
            ]
        ]
        const text = `<i>⚠️ WARNING: the following is a third party advertisement. We are not responsible for this.\n\n🪙 Join the ${chat[0].type} to get 1 coin</i>`
        return await tg.sendMessage(chat_id, text, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: key
            }
        })
    } catch (err) {
        return displayError(err)
    }
})

tg.onText(/\/help$/, async message => {
    try {
        const { chat_id } = await getChat(message.chat.id)
        const text = `<i><b>📌 Adding Your Chat/Channel: </b>Users can easily add their Telegram chat or channel by clicking on the <b>➕ "Add Chat/Channel"</b> button. To join chats or channels, simply click on <b>👆 "Join Chat/Channel."</b> Upon joining, you will receive 1 coin, where 1 coin equals 1 member for your chat or channel.

<b>💼 Managing Your Chats/Channels: </b>Navigate to ✅ "My Lists" to effectively manage your chat or channel status. Here, you can switch the status between <b>✅ "Running"</b> and <b>❌ "Stopped."</b>

<b>🤔 How to Start or Stop: </b>To start a chat or channel, click on the <b>❌ "Stopped"</b> status. This will activate your chat or channel for growth. If you wish to stop it, click on <b>✅ "Running"</b> to temporarily halt activities.</i>`
        return await tg.sendMessage(chat_id, text, {
            parse_mode: "HTML"
        })
    } catch (err) {
        return displayError(err)
    }
})