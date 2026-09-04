const mongoose = require("mongoose");

const turnoutSchema = new mongoose.Schema(
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

    reportHour: {
      type: String,
      required: true,
    },

    totalVotesCast: {
      type: Number,
      required: true,
      min: 0,
    },

    turnoutPercentage: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

turnoutSchema.index(
  {
    boothId: 1,
    reportHour: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "Turnout",
  turnoutSchema
);