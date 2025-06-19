// server.js
require('dotenv').config();
const express = require('express');
const { OpenAI } = require("openai");
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3000;

// Rate limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all requests
app.use(limiter);

// Enable CORS for all routes
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5500' // Adjust based on your frontend URL
}));

// Parse JSON request bodies
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage || typeof userMessage !== 'string') {
        return res.status(400).json({ error: "Invalid message format" });
    }

    try {
        const completion = await openai.chat.completions.create({
            model: process.env.AI_MODEL || "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful AI assistant. Be friendly, concise, and provide accurate information."
                },
                { 
                    role: "user", 
                    content: userMessage 
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const aiResponse = completion.choices[0].message.content;
        res.json({ response: aiResponse });
    } catch (error) {
        console.error("OpenAI API Error:", error);
        res.status(500).json({ 
            error: "Failed to get AI response",
            details: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});