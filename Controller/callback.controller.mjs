import { Types } from "mongoose";
import tg from "../Config/Telegram.mjs";
import { chatDB } from "../Models/chat.model.mjs";
import { displayError, getChat } from "../Utils/Helper.mjs";
import { env } from "../env.mjs";
import { userDB } from "../Models/user.model.mjs";

tg.on("callback_query", async callback => {
    try {
        const { chat_id } = await getChat(callback.from.id)
        const query = callback.data
        const message_id = callback.message.message_id
        const params = query.split(" ")
        const command = params[0]
        params.shift()

        if (command === "/status") {
            const _id = params[0]
            const response = await chatDB.findOne({ _id: _id })
            await chatDB.updateOne({ _id: new Types.ObjectId(_id) }, { $set: { is_active: !response.is_active } })
            const key = callback.message.reply_markup.inline_keyboard.map(item => {
                if (item[0].text == `@${response.username}`) {
                    return [
                        { text: `@${response.username}`, url: `https://t.me/${response.username}` },
                        { text: `${response.is_active ? "❌ Stopped" : "✅ Running"}`, callback_data: `/status ${_id}` },
                        { text: `⛔ Remove`, callback_data: `/removeChat ${_id}`}
                    ]
                }
                return item
            })
            return await tg.editMessageReplyMarkup({
                inline_keyboard: key
            }, {
                chat_id: chat_id,
                message_id: message_id
            })
        }

        if (command === "/removeChat") {
            const _id = params[0]
            const response = await chatDB.findOne({ _id: _id })
            return await tg.editMessageText(`<i>⛔ Are you sure to delete @${response.username}?</i>`, {
                chat_id: chat_id,
                message_id: message_id,
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "✅ Yes", callback_data: `/deleteChat ${_id}` },
                            { text: `❌ Cancel`, callback_data: `/cancelChatDeletion`}
                        ]
                    ]
                }
            })
        }

        if (command === "/cancelChatDeletion") {
            return await tg.editMessageText(`<i>✖️ Process cancelled!</i>`, {
                chat_id: chat_id,
                message_id: message_id,
                parse_mode: "HTML"
            })
        }

        if (command === "/deleteChat") {
            const _id = params[0]
            const response = await chatDB.findOneAndDelete({ _id: _id })
            return await tg.editMessageText(`<i>@${response.username} has been deleted!</i>`, {
                chat_id: chat_id,
                message_id: message_id,
                parse_mode: "HTML"
            })
        }

        if (command === "/joinedChat") {
            const _id = params[0]
            const chat = await chatDB.aggregate([
                {
                    $match: {
                        _id: new Types.ObjectId(_id)
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
            try {
                const response = await tg.getChatMember(chat[0].chat_id, chat_id)
                if (response.status == "administrator" || response.status == "creator" || response.status == "member") {
                    if (chat[0].userinfo[0].balance > 0) {
                        await userDB.updateOne({
                            _id: chat_id
                        }, {
                            $inc: {
                                balance: 1
                            }
                        })
                        await userDB.updateOne({
                            _id: chat[0].user
                        }, {
                            $inc: {
                                balance: -1
                            }
                        })
                        await chatDB.updateOne({
                            _id: new Types.ObjectId(_id)
                        }, {
                            $addToSet: {
                                joined: chat_id
                            }
                        })
                        await tg.editMessageText(`<i>✅ Completed: +1 coin</i>`, {
                            parse_mode: "HTML",
                            chat_id: chat_id,
                            message_id: message_id
                        })
                    } else {
                        await chatDB.updateOne({
                            _id: new Types.ObjectId(_id)
                        }, {
                            $set: {
                                is_active: false
                            }
                        })
                        await tg.deleteMessage(chat_id, message_id)
                        return await tg.answerCallbackQuery(callback.id, {
                            text: `❌ Advertiser balance is zero!`,
                            show_alert: true
                        })
                    }
                } else {
                    return await tg.answerCallbackQuery(callback.id, {
                        text: `❌ We can't find you there!`,
                        show_alert: true
                    })
                }
            } catch (err) {
                await chatDB.updateOne({
                    _id: new Types.ObjectId(_id)
                }, {
                    $set: {
                        is_active: false
                    }
                })
                return await tg.answerCallbackQuery(callback.id, {
                    text: `❌ Something error happend!`,
                    show_alert: true
                })
            }
        }

    } catch (err) {
        return displayError(err)
    }
})