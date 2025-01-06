require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Create product and price dynamically
app.post('/api/create-box', async (req, res) => {
  const { boxName, description, price, imageUrl } = req.body;
  try {
    const product = await stripe.products.create({
      name: boxName,
      description,
      images: [imageUrl],
    });

    const stripePrice = await stripe.prices.create({
      unit_amount: Math.round(price * 100),
      currency: 'eur',
      recurring: { interval: 'month' },
      product: product.id,
    });

    res.json({
      productId: product.id,
      priceId: stripePrice.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  const { priceId, successUrl, cancelUrl } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
