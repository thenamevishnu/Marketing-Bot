import { Router } from "express"
import serverController from "../Controller/server.controller.mjs"

const app = Router()

app.get("/", serverController.server)

export default app