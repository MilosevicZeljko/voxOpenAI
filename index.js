const OpenAI = require('openai');
require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

app.post('/ask', async (req, res) => {
  const message = req.body.message;
  // Generate a response text.

  const prompt = `
  Based on users input, who will try to schedule a restaurant reservation, answer positively or negatively.
  If the user has provided day and time for reservation, answer with a confirmation, but if the user didn't provide you valid day and time, answer with a negation.
  The answer must be short and simple, and it must be either positive or negative. We can assume that the reservation is possible if the time is provided.
  If positive, return message in format: You have successfully made a reservation for [time and date user provided].
  If the input is invalid (not time or date/day) say: You have to provide me with a valid time and date.
  If negative, please, say: I'm sorry, but we don't have any available tables for [time and date user provided].
  `;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: message },
    ],
  });

  const completion_text = completion.choices[0].message.content;

  const responseText = `${completion_text}`;

  // Send the response.
  res.send({ text: responseText });
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
