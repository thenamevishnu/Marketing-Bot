const server = async (req, res) => {
    try {
        res.status(200).send({
            message: "Server up"
        })
    } catch (err) {
        res.status(500).send({
            message: "Server down"
        })
    }
}

export default {
    server
}