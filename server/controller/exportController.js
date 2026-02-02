const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  UnderlineType,
  ImageRun,
} = require("docx");

const PDFDocument = require("pdfkit");
const MarkdownIt = require("markdown-it");
const Book = require("../models/book");
const fs = require("fs");
const path = require("path");
const doc = require("pdfkit");

const md = new MarkdownIt();

const DOCX_STYLES = {
  fonts: {
    body: "Character",
    heading: "Inter",
  },
  sizes: {
    title: 32,
    subscribe: 20,
    author: 24,
    chapterTitle: 24,
    h1: 20,
    h2: 18,
    h3: 16,
    body: 12,
  },
  spacing: {
    paragraphBefore: 200,
    paragraphAfter: 200,
    chapterBefore: 400,
    chapterAfter: 300,
    headingBefore: 300,
    headingAfter: 150,
  },
};

// Process markdown content into docx paragraphs
const processMarkdownToDocx = (markdown) => {
  const tokens = md.parse(markdown, {});
  const paragraphs = [];
  let inList = false;
  let listType = null;
  let orderedCounter = 1;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    try {
      if (token.type === "heading_open") {
        const level = parseInt(token.tag.substring(1), 10);
        const nextToken = tokens[i + 1];
        if (nextToken && nextToken.type === "inline") {
          let headingLevel;
          let fontsize;

            switch (level) {
            case 1:
              headingLevel = HeadingLevel.HEADING_1;
              fontsize = DOCX_STYLES.sizes.h1;
              break;
            case 2:
                headingLevel = HeadingLevel.HEADING_2;
                fontsize = DOCX_STYLES.sizes.h2;
                break;
            case 3:
                headingLevel = HeadingLevel.HEADING_3;
                fontsize = DOCX_STYLES.sizes.h3;
                break;
            default:
              headingLevel = HeadingLevel.HEADING_3;
              fontsize = DOCX_STYLES.sizes.h3;
          }

            paragraphs.push(
            new Paragraph({
              text: nextToken.content,
              heading: headingLevel,
                spacing: {
                before: DOCX_STYLES.spacing.headingBefore,
                after: DOCX_STYLES.spacing.headingAfter,
              },
              style: {
                font: DOCX_STYLES.fonts.heading,
                size: fontsize * 2,

                },
            }),
          );
          i += 2; // Skip the inline and closing tag
        }
        } else if (token.type === "paragraph_open") {
        const nextToken = tokens[i + 1];
        if (nextToken && nextToken.type === "inline" && nextToken.children) {
            const textRuns = processInlineContent(nextToken.children);
            if(textRuns.length > 0){
            paragraphs.push(
              new Paragraph({
                children: textRuns,
                spacing: {
                  before: inList ? 100 :DOCX_STYLES.spacing.paragraphBefore,
                    after: inList ? 100 : DOCX_STYLES.spacing.paragraphAfter,
                    line: 360,
                },
                alignment: AlignmentType.JUSTIFIED,
              }),
            );
          }
            i += 2; // Skip the inline and closing tag
        }
        } else if (token.type === "bullet_list_open") {
        inList = true;
        listType = "bullet";
        } else if (token.type === "bullet_list_close") {
        inList = false;
        listType = null;
        paragraphs.push(new Paragraph({ text: "" , spacing:{after: 100}})); // Add spacing after list
        } else if (token.type === "ordered_list_open") {
        inList = true;
        listType = "ordered";
        orderedCounter = 1;
        } else if (token.type === "ordered_list_close") {
        inList = false;
        listType = null;
        paragraphs.push(new Paragraph({ text: "" , spacing:{after: 100}})); // Add spacing after list
        } else if (token.type === "list_item_open") {
        const nextToken = tokens[i + 1];
        if (nextToken && nextToken.type === "paragraph_open") {
            const inlineToken = tokens[i + 2];  
            if (inlineToken && inlineToken.type === "inline" && inlineToken.children) {
            const textRuns = processInlineContent(inlineToken.children);
            let bulletText = "";
            if (listType === "bullet") {
                bulletText = "."; // Bullet character
            } else if (listType === "ordered") {
                bulletText = `${orderedCounter}.`;
                orderedCounter++;
            }
            paragraphs.push(
              new Paragraph({
                children: [ 
                    new TextRun({
                        text: bulletText,
                       fontsize: DOCX_STYLES.sizes.body;
                    }),
                    ...textRuns
                ],
                spacing: {
                  before: 50,
                  after: 50,
                },
                indent:{left:720},
              }),
            );
            i += 4; // Skip to the closing list_item tag
          }
            }
        }else if (token.type === "blockquote_open") {
        const nextToken = tokens[i + 1];
        if (nextToken && nextToken.type === "paragraph_open") {
            const inlineToken = tokens[i + 2];
            if (inlineToken && inlineToken.type === "inline") {
                paragraphs.push(
                new Paragraph({
                    children:[
                        new TextRun({
                            text: inlineToken.content,
                            italics: true,  
                            color: "666666",
                            font: DOCX_STYLES.fonts.body,
                        }),

                    ],
                    spacing:{ before: 200,
                             after: 200},
                    indent:{left:720},
                    alignment: AlignmentType.JUSTIFIED,
                    border:{
                        left:{
                            color:"4F46E5",
                            space:1,
                            style:"single",
                            size:24,
                        },
                    },
                }),
                );
                i +=4; // Skip to closing blockquote tag
            }
        }
        }else if (token.type === "code_block" || token.type === "fence") {
            paragraphs.push(
            new Paragraph({
                children:[
                    new TextRun({
                        text: token.content,
                        font: "Courier New",
                        size: 20,
                        color:"333333",
                    }),
                ],  
                spacing:{ before:200, after:200},
                shading:{
                    fill:"F5F5F5",
                },
                
            }),
            );
        } else if (token.type === "hr") {
        paragraphs.push(
          new Paragraph({       
            text: "",
            border: {
              bottom: {
                color: "CCCCCC",
                space: 1,
                value: "single",
                size: 6,
                },
            },
            spacing: { before: 300, after: 300 },
          }),
        );
      }
     } catch (tokenErr) {
        console.error("Error processing token:", token.type, tokenErr);
        continue;
      }

}
    return paragraphs;
};

// Process inline content for styles like bold, italics, text
const processInlineContent = (children) => {
    const textRuns = [];
    let currentFormatting = { bold: false, italics: false };
    let buffer = "";

    const flushText = () => {
        if(textBuffer.trim()){
            textRuns.push(
                new TextRun({
                    text: textBuffer,
                    bold: currentFormatting.bold,
                    italics: currentFormatting.italics,
                    font: DOCX_STYLES.fonts.body,
                    size: DOCX_STYLES.sizes.body * 2,
                }),
            );
            textBuffer = "";
        }
    }
    children.forEach((child) => {
            if(child.type === "strong_open"){
                flushText();
                currentFormatting.bold = true;
            } else if (child.type === "strong_close"){
                flushText();
                currentFormatting.bold = false;
            } else if (child.type === "em_open"){
                flushText();
                currentFormatting.italics = true;
            } else if (child.type === "em_close"){
                flushText();
                currentFormatting.italics = false;
            }else if (child.type === "text"){
                textBuffer += child.content;
            }
        });
        flushText();
        return textRuns;
};

// Export book as DOCX
const exportAsDocument = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.userId.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to export this book" });
    }

    const sections = [];

    // Cover Page with Image if available
    const coverPage = [];

    if (book.coverImage && !book.coverImage.includes("pravatar")) {
      const imagePath = book.coverImage.substring(1);
      try {
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);

          // Add some top spacing
          coverPage.push(
            new Paragraph({
              text: "",
              spacing: { before: 1000 },
            }),
          );

          // Add Image centered on the cover page
          coverPage.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: 400,
                    height: 550,
                  },
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 2000, after: 400 },
            }),
          );

          // Ensure page break after cover page
          coverPage.push(
            new Paragraph({
              text: "",
              pageBreakAfter: true,
            }),
          );
        }
      } catch (imgErr) {
        console.error(`Could not embed image: ${imagePath}`, imgErr);
      }

      sections.push(...coverPage);

      // Title Page section
      const titlePage = [];

      // Main Title
      titlePage.push(
        new Paragraph({
          children: [
            new TextRun({
              text: book.title,
              bold: true,
              size: DOCX_STYLES.sizes.title * 2,
              font: DOCX_STYLES.fonts.heading,
              color: "1A202C",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 2000, after: 400 },
        }),
      );

      // Subtitle if available
      if (book.subtitle && book.subtitle.trim()) {
        titlePage.push(
          new Paragraph({
            children: [
              new TextRun({
                text: book.subtitle,
                font: DOCX_STYLES.fonts.heading,
                size: DOCX_STYLES.sizes.subtitle * 2,
                color: "4A5568",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
        );
      }

      // Author
      titlePage.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `by ${book.author}`,
              font: DOCX_STYLES.fonts.heading,
              size: DOCX_STYLES.sizes.author * 2,
              color: "2D3748",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
      );

      //Decorative Line
      titlePage.push(
        new Paragraph({
          text: "",
          border: {
            bottom: {
              color: "CBD5E0",
              space: 1,
              value: "single",
              size: 12,
            },
          },
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
        }),
      );

      sections.push(...titlePage);

      // Process Chapters
      book.chapters.forEach((chapter, index) => {
        try {
          // Page Break before each chapter except the first
          if (index > 0) {
            sections.push(
              new Paragraph({
                text: "",
                pageBreakBefore: true,
              }),
            );
          }
          // Chapter Title
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: chapter.title,
                  bold: true,
                  font: DOCX_STYLES.fonts.heading,
                  size: DOCX_STYLES.sizes.chapterTitle * 2,
                  color: "2C5282",
                }),
              ],
              spacing: {
                before: DOCX_STYLES.spacing.chapterBefore,
                after: DOCX_STYLES.spacing.chapterAfter,
              },
            }),
          );

          // Chapter Content
          const contentParagraphs = processMarkdownToDocx(
            chapter.content || "",
          );
          sections.push(...contentParagraphs);
        } catch (chapterErr) {
          console.error(`Error processing chapter ${index}:`, chapterErr);
        }
      });

      // Create Document
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1440,
                  right: 1440,
                  bottom: 1440,
                  left: 1440,
                },
              },
            },
            children: sections,
          },
        ],
      });

      // Generate the document buffer
      const buffer = await Packer.toBuffer(doc);

      // Send the document
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${book.title.replace(/[^a-zA-Z0-9]/g, "_")}.docx`,
      );
      res.setHeader("Content-Length", buffer.length);
      res.send(buffer);
    }
  } catch (error) {
    console.error("Error exporting document:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server Error during document export",
        error: error.message,
      });
    }
  }
};

// Export book as PDF
const exportAsPDF = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
        return res.status(404).json({ message: "Book not found" });
        }
        if (book.userId.toString() !== req.user._id.toString()) {
        return res
            .status(401)
            .json({ message: "Not authorized to export this book" });
        }

        // Create a PDF document
        const pdfDoc = new PDFDocument({ 
            margin: { top: 72, bottom: 72, left: 72, right: 72 },
            bufferPages: true,
            autoFirstPage: true,
        });
         
        // Set response headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
        "Content-Disposition",
        `attachment; filename=${book.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
        );
        pdfDoc.pipe(res);

        // Cover Page with Image if available
        if (book.coverImage && !book.coverImage.includes("pravatar")) {
        const imagePath = book.coverImage.substring(1);
        try {
            if (fs.existsSync(imagePath)) {
                const pageWidth = doc.page.width- doc.page.margins.left - doc.page.margins.right;
                const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;

                doc.image(imagePath, doc.page.margins.left, doc.page.margins.top, {
                    fit: [pageWidth * 0.8, pageHeight * 0.8],
                    align: "center",
                    valign: "center",
                });
                doc.addPage();
            }

    } 
    catch (imgErr) {
    console.error(`Could not embed image: ${imagePath}`, imgErr);
   
    }

    }

    // Title Page
    pdfDoc
        .font(TYPOGRAPHY.fonts.sansBold)
        .fontSize(TYPOGRAPHY.sizes.title)
        .fillColor(TYPOGRAPHY.colors.heading)
        .text(book.title, {
        align: "center",
        });
    pdfDoc.moveDown(2);
    if (book.subtitle && book.subtitle.trim()) {
        pdfDoc
        .font(TYPOGRAPHY.fonts.sans)
        .fontSize(TYPOGRAPHY.sizes.h2)
        .fillColor(TYPOGRAPHY.colors.text)
        .text(book.subtitle, {
            align: "center",
        });
        pdfDoc.moveDown(1);
    }

    pdfDoc
        .font(TYPOGRAPHY.fonts.sans)
        .fontSize(TYPOGRAPHY.sizes.author)
        .fillColor(TYPOGRAPHY.colors.heading)
        .text(`by ${book.author}`, {
        align: "center",
        });
      
        // Process Chapters
        if(book.chapters && book.chapters.length > 0){
        book.chapters.forEach((chapter, index) => {
            try {   
                pdfDoc.addPage();

                // Chapter Title
                pdfDoc
                .font(TYPOGRAPHY.fonts.sansBold)
                .fontSize(TYPOGRAPHY.sizes.chapterTitle)
                .fillColor(TYPOGRAPHY.colors.heading)
                .text(chapter.title || `Chapter ${index + 1}`, {
                    align: "left",
                });
                pdfDoc.moveDown(
                   TYPOGRAPHY.spacing.chapterAfter / TYPOGRAPHY.sizes.body
                );
                // Chapter Content
                if(chapter.content && chapter.content.trim()){
                    renderMarkdownToPDF(pdfDoc, chapter.content);
                }
            } catch (chapterErr) {
                console.error(`Error processing chapter ${index}:`, chapterErr);
            }
        });
    }

    // Finalize the PDF and end the stream
    pdfDoc.end();
    } catch (error) {
        console.error("Error exporting PDF:", error);
        if (!res.headersSent) {
        res.status(500).json({
            message: "Server Error during PDF export",
            error: error.message,
        });
        }
    }
};

module.exports = {
  exportAsDocument,
  exportAsPDF,
};
