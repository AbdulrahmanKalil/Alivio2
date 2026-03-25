const axios = require("axios");

exports.chatWithModel = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  try {
    const response = await axios.post(
      "https://11amr-arevo-2.hf.space/chat",
      { text: message },
      { responseType: "stream" },
    );

    let fullReply = "";

    response.data.on("data", (chunk) => {
      const lines = chunk.toString().split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.chunk) fullReply += parsed.chunk;
        } catch (_) {}
      }
    });

    response.data.on("end", () => {
      res.json({ reply: fullReply });
    });

    response.data.on("error", (err) => {
      res.status(500).json({ message: "Stream error" });
    });
  } catch (err) {
    console.error("AI Error:", err.message);
    res.status(500).json({ message: "AI service error" });
  }
};
