const express = require("express");
const router = express.Router();
const Poll = require("../models/Poll");
const Response = require("../models/Response");
const { protect } = require("../middleware/authMiddleware");


const createPoll = async (req, res) => {
  try {
    const { title, description, questions, pollSessionExpiry, maxVotes, resultsVisibility, collectVoterDetails, isPasswordProtected, pollPassword, accentColor } = req.body;

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ message: "Title and at least one question are required." });
    }

    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const randomString = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomString}`;

    const newPoll = await Poll.create({
      creator: req.user.id,
      title, description, slug, questions, pollSessionExpiry,
      maxVotes: maxVotes ? parseInt(maxVotes) : null,
      resultsVisibility, collectVoterDetails, isPasswordProtected,
      pollPassword: isPasswordProtected ? pollPassword : "", accentColor,
    });

    res.status(201).json({ success: true, message: "Campaign Deployed!", poll: newPoll });
  } catch (error) {
    console.error("Poll Creation Error:", error);
    res.status(500).json({ message: "Creation failed", error: error.message });
  }
};


const getPollBySlug = async (req, res) => {
  try {
    const poll = await Poll.findOne({ slug: req.params.slug });
    if (!poll) return res.status(404).json({ message: "Campaign not found or link expired." });

    res.status(200).json({ success: true, poll });
  } catch (error) {
    console.error("Fetch Poll Error:", error);
    res.status(500).json({ message: "Server error fetching the poll.", error: error.message });
  }
};


const submitResponse = async (req, res) => {
   try {
      const poll = await Poll.findById(req.params.id);
      if (!poll) return res.status(404).json({ message: "Poll not found" });

      const newResponse = new Response({
        pollId: req.params.id,
        respondentId: req.body.userId || "Anonymous",
        answers: req.body.answers,
      });

      await newResponse.save();

      const io = req.app.get("io");
      io.to(req.params.id).emit("update-analytics");


      io.emit("global-vote-update", { pollId: req.params.id });

      res.status(201).json({ message: "Response submitted successfully" });
    } catch (error) {
      console.error("Submit Error:", error);
      res.status(500).json({ message: error.message });
    }
};


const getPollAnalytics = async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: "Poll not found" });

        if (poll.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized owner" });
        }

        const responses = await Response.find({ pollId: req.params.id });
        let counts = generateCountsArray(responses);

        res.status(200).json(counts);
    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: "Error fetching analytics" });
    }
};


const getPublicAnalytics = async (req, res) => {
    try {
        const responses = await Response.find({ pollId: req.params.id });
        let counts = generateCountsArray(responses);
        res.status(200).json(counts);
    } catch (error) {
        console.error("Public Analytics Error:", error);
        res.status(500).json({ message: "Error fetching live results" });
    }
};


const generateCountsArray = (responses) => {
    let counts = [];
    let map = {};
    responses.forEach(response => {
        response.answers.forEach(ans => {
            let key = `${ans.questionIndex}-${ans.selectedOption}`;
            map[key] = (map[key] || 0) + 1;
        });
    });
    for (let key in map) {
        let [qIdx, optIdx] = key.split('-');
        counts.push({
            _id: { qIdx: parseInt(qIdx), optIdx: optIdx },
            count: map[key]
        });
    }
    return counts;
};


const getPollById = async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: "Poll not found" });

        if (poll.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        res.status(200).json({ success: true, poll });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getMyPolls = async (req, res) => {
    try {
        const polls = await Poll.find({ creator: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, polls });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch polls", error: error.message });
    }
};


const deletePoll = async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: "Poll not found" });

        if (poll.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized: Bhai, ye tera poll nahi hai!" });
        }

        await Poll.findByIdAndDelete(req.params.id);
        await Response.deleteMany({ pollId: req.params.id });

        res.status(200).json({ success: true, message: "Poll and its responses deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete poll", error: error.message });
    }
};


const bulkDeletePolls = async (req, res) => {
    try {
        const { pollIds } = req.body;
        if (!pollIds || pollIds.length === 0) {
            return res.status(400).json({ message: "No polls selected for deletion." });
        }

        const result = await Poll.deleteMany({
            _id: { $in: pollIds },
            creator: req.user.id
        });

        await Response.deleteMany({ pollId: { $in: pollIds } });

        res.status(200).json({
            success: true,
            message: `${result.deletedCount} campaigns deleted successfully! 🗑️`
        });
    } catch (error) {
        res.status(500).json({ message: "Bulk deletion failed", error: error.message });
    }
};


const clearAllResponses = async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: "Poll not found" });


        if (poll.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized access" });
        }


        await Response.deleteMany({ pollId: req.params.id });


        const io = req.app.get("io");
        io.to(req.params.id).emit("update-analytics");
        io.emit("global-vote-update", { pollId: req.params.id });

        res.status(200).json({ success: true, message: "Sare questions ka data successfully clear ho gaya! 🧹" });
    } catch (error) {
        res.status(500).json({ message: "Failed to clear responses", error: error.message });
    }
};


const clearQuestionResponses = async (req, res) => {
    try {
        const { id } = req.params;
        const { questionIndex } = req.body;

        const poll = await Poll.findById(id);
        if (!poll) return res.status(404).json({ message: "Poll not found" });

        if (poll.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized access" });
        }


        await Response.updateMany(
            { pollId: id },
            { $pull: { answers: { questionIndex: parseInt(questionIndex) } } }
        );


        await Response.deleteMany({ pollId: id, answers: { $size: 0 } });


        const io = req.app.get("io");
        io.to(id).emit("update-analytics");
        io.emit("global-vote-update", { pollId: id });

        res.status(200).json({ success: true, message: `Question ${questionIndex + 1} ka data clear ho gaya! 🧹` });
    } catch (error) {
        res.status(500).json({ message: "Failed to clear question responses", error: error.message });
    }
};




router.post("/create", protect, createPoll);
router.get("/slug/:slug", getPollBySlug);
router.post("/:id/respond", submitResponse);


router.get("/public-analytics/:id", getPublicAnalytics);


router.get("/user/my-polls", protect, getMyPolls);
router.get("/analytics/:id", protect, getPollAnalytics);
router.post("/user/bulk-delete", protect, bulkDeletePolls);
router.delete("/:id", protect, deletePoll);
router.post("/:id/clear-all", protect, clearAllResponses);
router.post("/:id/clear-question", protect, clearQuestionResponses);

router.get("/:id", protect, getPollById);

module.exports = router;