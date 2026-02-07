const axios = require('axios');
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { reference, cart, shipping } = req.body;

    try {
        // 1. Verify with Paystack
        const paystackRes = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
        });

        if (paystackRes.data.data.status === 'success') {
            const total = cart.reduce((sum, item) => sum + item.price, 0);
            const itemList = cart.map(i => i.name).join(', ');

            // 2. Email the Customer
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: shipping.email,
                subject: 'Order Confirmed - QuickShop',
                text: `Hi ${shipping.name}, we received your payment of $${total}. Items: ${itemList}.`
            });

            // 3. Telegram Alert to YOU
            const msg = `🚨 *NEW ORDER* \n\n*Name:* ${shipping.name} \n*Items:* ${itemList} \n*Total:* $${total} \n*Address:* ${shipping.address}`;
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: msg,
                parse_mode: 'Markdown'
            });

            return res.status(200).json({ status: 'success' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server Error' });
    }
};
