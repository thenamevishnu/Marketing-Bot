import { Schema, model } from "mongoose";

const chat = new Schema({
    user: {
        type: Number,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    chat_id: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    is_active: {
        type: Boolean,
        default: true
    },
    joined: {
        type: Array,
        default: []
    }
}, {
    timestamps: true
})

export const chatDB = model("chats", chat)