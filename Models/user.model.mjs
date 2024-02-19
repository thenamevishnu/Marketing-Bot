import { Schema, model } from "mongoose";

const user = new Schema({
    _id: {
        type: Number,
        unique: true
    },
    refId: {
        type: String,
        unique: true,
        required: true
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String
    },
    username: {
        type: String
    },
    invited_by: {
        type: String
    },
    invites: {
        type: Number,
        default: 0
    },
    balance: {
        type: Number,
        default: 0
    },
    spent: {
        type: Number,
        default: 0
    },
    joining_bonus_received: {
        times: {
            type: Number,
            default: 0
        },
        received: {
            type: Boolean,
            default: false
        }
    },
    deposit: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

export const userDB = model("users", user)