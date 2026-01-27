const book = require("../models/book");

// Create a new book
const createBook = async (req, res) => {
  try {
    const { title, author, subtitle, chapters } = req.body;
    if (!title || !author) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }
    const book = await Book.create({
      userId: req.user._id,
      title,
      author,
      subtitle,
      chapters,
    });
    res.status(201).json({ message: "Book created successfully", book });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Get all books for a user
const getBooks = async (req, res) => {
  try {
    const books = await Book.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ books });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Get a single book by ID
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.userId.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to view this book" });
    }
    res.status(200).json({ book });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Update a book by ID
const updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.userId.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this book" });
    }
    const updateBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json({ message: "Book updated successfully", updateBook });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete a book by ID
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.userId.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to delete this book" });
    }
    await book.deleteOne();
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

const updateBookCover = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.userId.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this book cover" });
    }
    if (req.file) {
      book.coverImage = `/${req.file.path}`;
    } else {
      return res.status(400).json({ message: "No image file provided" });
    }
    const updatedBook = await book.save();
    res
      .status(200)
      .json({ message: "Book cover updated successfully", updatedBook });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  updateBookCover,
};
