export const getMessage = async (transcript) => {
  try {
    const response = await fetch(
      "https://api.intelligence.io.solutions/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${process.env.IO_TOKEN}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.3-70B-Instruct",
          messages: [
            {
              role: "user",
              content: transcript,
            },
          ],
          temperature: 0.7,
          format: "text",
          system:
            "You are a helpful AI assistant. Provide clear, concise, and accurate responses to user questions. Keep responses friendly and conversational, but focused on delivering valuable information.",
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("IO.net API Error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      if (response.status === 401) {
        return "Authentication error. Please check your API key configuration.";
      } else if (response.status === 429) {
        return "Rate limit exceeded. Please try again in a moment.";
      }

      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return (
      data["choices"][0]["message"]["content"] ||
      "I apologize, but I couldn't generate a response at the moment. Please try again."
    );
  } catch (error) {
    console.error("Error processing transcript with io.net:", error);

    if (error instanceof TypeError && error.message === "Failed to fetch") {
      return "Unable to connect to the service. Please check your internet connection and try again.";
    }

    return "I apologize, but I'm having trouble connecting to my language processing service. Please try again in a moment.";
  }
};
