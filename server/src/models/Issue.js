const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },

    boothId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booth",
      required: true,
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    issueType: {
      type: String,
      enum: [
        "EVM_ISSUE",
        "LAW_AND_ORDER",
        "OPPOSITION_OBJECTION",
        "VOTER_ISSUE",
        "POLLING_STAFF_ISSUE",
        "TECHNICAL_ISSUE",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED"],
      default: "OPEN",
    },

    resolutionNote: {
      type: String,
      default: null,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    aiPriority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: null,
    },

    aiSummary: {
      type: String,
      default: null,
    },

    aiSuggestedResolution: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Issue", issueSchema);