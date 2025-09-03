import LlamaAI from 'llamaai';

const apiToken = 'OPENAI_API_KEY=la_tua_chiave_openai'
const llamaAPI = new LlamaAI(apiToken);

const llamaHandleUserInput = async (input) => {
  const apiRequestJson = {
    "messages": [
      { "role": "user", "content": input }
    ],
    "max_tokens": 2048,
    "stream": false,
    "function_call": null
  };

  try {
    const response = await llamaAPI.run(apiRequestJson);

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

export { llamaHandleUserInput };
