const proxy = async (req, res, url, client) => {
    console.log('request comes in proxy')
    try {
        const response = await client({
            method: req.method,
            url: url,
            data: req.body,
            headers: {
                authorization: req.headers.authorization
            }
        });
        console.log(response)
        res.status(response?.status).json(response.data)
    }
    catch (err) {
        console.log(err);

        res.status(err.response?.status || 500).json(err.response?.data || {
            msg: 'gateway error'
        });
    }
}
module.exports = { proxy };
