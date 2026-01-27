const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

// Generate a book Outline
const generateBookOutline = async (req, res) => {
  try {
    const { topic, style, numChapters, description } = req.body;
    if (!topic) {
      return res.status(400).json({ message: "Topic is required" });
    }
    const prompt = `You are an expert book outline generator. Create a comprehensive book outline based on the following requirements:
    Topic: "${topic}"
    ${description ? `Description: "${description}"` : ""}
    Writing Style: ${style}
    Number of Chapters: ${numChapters || 5}
    
    Requirements:
    1.Generate exactly ${numChapters || 5} chapters
    2.Each chapter title should be clear, engaging, and follow a logical progression.
    3.Each chapter description should be  2-3 sentences explaining the chapter content.
    4.Ensure chapters build upon each other coherently.
    5.Match the "${style}" writing style  in your titles and descriptions.
    
    Output Format:
    Return only a valid JSON array with no additional  text, markdown, or formatting, eachh object must have exactly two kkeys:"title" and "description".
    Example Structure:[
{
    "title": "Chapter 1: Introduction to the Topic",
    "description": "A comprehensive overview introducing te main concepts.Sets the foundation for understanding the subject matter."},

    {
    "title": "Chapter 2: Core Principles",
    "description": "Explores the fundamental principles and theories.Provides detailed examples and real-world applications."}]
    Generate the outline now.`;

    const response = await ai.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });
    const text = response.text;

    const startIndex = text.indexOf("[");
    const endIndex = text.lastIndexOf("]");
    if (startIndex === -1 || endIndex === -1) {
      console.error("Could not find JSON array in AI response:", text);
      return res.status(500).json({ message: "Invalid AI response format" });
    }
    const jsonArrayString = text.substring(startIndex, endIndex + 1);
    try {
      const outline = JSON.parse(jsonArrayString);
      res.status(200).json({ outline });
    } catch (parseError) {
      console.error("Error parsing JSON array from AI response:", parseError);
      return res.status(500).json({
        message:
          "Failed to generate a valid outline. The AI response was not valid JSON",
      });
    }
  } catch (error) {
    console.error("Error generating book outline:", error);
    res.status(500).json({ message: "Server Error during AI outline" });
  }
};

// Generate chapter content
const generateChapterContent = async (req, res) => {
  try {
    const { chapterTitle, chapterDescription, style } = req.body;
    if (!chapterTitle) {
      return res.status(400).json({ message: "Chapter title is required" });
    }

    const prompt = `You are an expert writer specialization in ${style} content. Write a complete chapter for a book with the following specifications:
    Chapter Title: "${chapterTitle}"
    ${chapterDescription ? `Chapter Description: "${chapterDescription}"` : ""}
    Writing Style: ${style}
    Target Length:Comprehensive and detailed content (aim for 1500-2000 words)
    Requirements:
    1.Write in a ${style.toLowerCase()} tone througout the chapter
    2.Structure the content with clear sections and smooth transitions.
    3.Include relevant examples, explanations, or anecdotes as appropriate for the style.
    4.Ensure the content flows logicaly from introduction to conclusion.
    5.Make te content engaging and valuable to readers.
    ${chapterDescription ? "6.Cover all points mentioned in the chapter description" : ""}
    
    Format Guidelines:
    - Starts with a compelling opening pararaph
    -Use clear paragraph breaks for readability
    -Include subheadings if appropriate for the content length
    -End with a strong conclusions or transition to the next chapter
    -Write in plain text without markdown formatting
    
    Begin writing the chapter content now.`;
    const response = await ai.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    res.status(200).json({ content: response.text });
  } catch (error) {
    console.error("Error generating chapter content:", error);
    res
      .status(500)
      .json({ message: "Server Error during AI chapter generation" });
  }
};
