const server = async (req, res) => {
    try {
        res.status(200).send({
            message: "Bot server is up"
        })
    } catch (err) {
        res.status(500).send({
            message: "Bot server is down"
        })
    }
}

export default {
    server
}