import TelegramBot from "node-telegram-bot-api";

export const getMessage = async (transcript, id, onStreamChunk) => {
  try {
    const response = await fetch(
      `https://api.intelligence.io.solutions/api/v1/chat${
        id !== null ? "s/" + id + "/messages" : "/completions"
      }`,
      {
        method: "POST",
        headers: {
          accept: "text/event-stream",
          Authorization: `Bearer ${process.env.IO_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.2-90B-Vision-Instruct",
          messages: [
            {
              role: "user",
              content: transcript,
            },
          ],
          temperature: 0.7,
          format: "text",
          stream: true,
          system:
            "You are a helpful AI assistant. Provide clear, concise, and accurate responses to user questions. Keep responses friendly and conversational, but focused on delivering valuable information.",
        }),
      }
    );

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      console.error("API Error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      if (response.status === 401) {
        return "Authentication error. Please check your API key configuration.";
      } else if (response.status === 429) {
        return "Rate limit exceeded. Please try again in a moment.";
      }

      throw new Error(`API request failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      const lines = chunk
        .split("\n")
        .filter((line) => line.startsWith("data: "));
      for (const line of lines) {
        const json = line.replace(/^data: /, "").trim();
        if (json === "[DONE]") continue;

        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            if (onStreamChunk) onStreamChunk(content);
          }
        } catch (err) {
          console.warn("Failed to parse stream chunk:", err);
        }
      }
    }

    return (
      fullText ||
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

const launchBot = () => {
  const Bot = new TelegramBot(process.env.TELEGRAM_API, { polling: true });

  const commands = [
    {
      command: "start",
      description: "Start bot",
    },
    {
      command: "ref",
      description: "Get ref link",
    },
  ];

  Bot.setMyCommands(commands);

  Bot.onText(/\/start/, async (msg, match) => {
    try {
      const chatId = msg.from.id;

      await Bot.sendMessage(
        chatId,
        `Welcome to Connect! 👋\n\nThe Connect quest bot is a product of the <b>Black and White</b> ecosystem, aimed at developing the potential of The Open Network.\n\nPerform simple tasks from many of our partners and get acquaintance with colorful communities and a sea of tokens in return!`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Open WebApp",
                  url: "chess.com",
                },
              ],
            ],
          },
        }
      );
    } catch (error) {
      console.log(error);
    }
  });

  Bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    let fullResponse = "";

    const onStreamChunk = (chunk) => {
      fullResponse += chunk;
      console.log("Streamed chunk:", chunk);
    };

    try {
      const finalResponse = await getMessage(text, null, onStreamChunk);

      fullResponse = finalResponse || fullResponse;

      console.log("\nFull response from AI:", fullResponse);

      await Bot.sendMessage(chatId, fullResponse);
    } catch (error) {
      console.error("Error processing message with AI:", error);
      await Bot.sendMessage(
        chatId,
        "I apologize, but I encountered an error while processing your request. Please try again later."
      );
    }
  });

  return Bot;
};

export default launchBot;
