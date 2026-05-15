const Poll = require("../models/Poll");

const createPoll = async (req, res) => {
  try {

    const {
      title,
      description,
      questions,
      pollSessionExpiry,
      maxVotes,
      resultsVisibility,
      collectVoterDetails,
      isPasswordProtected,
      pollPassword,
      accentColor,
    } = req.body;


    if (!title || !questions || questions.length === 0) {
      return res
        .status(400)
        .json({ message: "Title and at least one question are required." });
    }


    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const randomString = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomString}`;


    const newPoll = await Poll.create({
      creator: req.user.id,
      title,
      description,
      slug,
      questions,
      pollSessionExpiry,
      maxVotes: maxVotes ? parseInt(maxVotes) : null,
      resultsVisibility,
      collectVoterDetails,
      isPasswordProtected,
      pollPassword: isPasswordProtected ? pollPassword : "",
      accentColor,
    });

    res
      .status(201)
      .json({ success: true, message: "Campaign Deployed!", poll: newPoll });
  } catch (error) {
    console.error("Poll Creation Error:", error);
    res.status(500).json({ message: "Creation failed", error: error.message });
  }
};


const getPollBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const poll = await Poll.findOne({ slug });

    if (!poll) {
      return res
        .status(404)
        .json({ message: "Campaign not found or link is invalid." });
    }


    if (!poll.isActive) {
      return res
        .status(403)
        .json({
          message:
            "This campaign is currently paused and not accepting responses.",
        });
    }


    res.status(200).json({ success: true, poll });
  } catch (error) {
    console.error("Fetch Poll Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



const getPollById = async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: "Poll not found" });


        if (poll.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: "Bhai, ye tera poll nahi hai! 🚫" });
        }

        res.status(200).json({ success: true, poll });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports = { createPoll, getPollBySlug };
