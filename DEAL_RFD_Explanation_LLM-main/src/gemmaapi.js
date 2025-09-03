const Groq = require('groq-sdk');

const apiKey = 'DUMMY_KEY_FOR_GITHUB';
const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

async function gemmaHandleUserInput(input) {
  const apiRequestJson = {
    "messages": [
      {
        "role": "user",
        "content": input
      }
    ],
    "model": "gemma2-9b-it",
    "temperature": 1,
    "max_tokens": 2048,
    "top_p": 1,
    "stream": false,
    "stop": null
  };

  try {
    const response = await groq.chat.completions.create(apiRequestJson);

    if (response.choices && response.choices.length > 0) {
      const message = response.choices[0].message;
      if (message && message.content) {
        return message.content;
      } else {
        return "Message not found.";
      }
    } else {
      return "No choices in the response.";
    }
  } catch (error) {
    console.error("Error:", error);
    return "An error occurred.";
  }
}

export { gemmaHandleUserInput };
