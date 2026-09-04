const mongoose = require("mongoose");

const coordinatorActivitySchema = new mongoose.Schema(
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

    coordinatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    arrivedAtBooth: {
      type: Boolean,
      default: false,
    },

    arrivalTime: {
      type: Date,
      default: null,
    },

    evmStatus: {
      type: String,
      enum: ["WORKING", "NOT_WORKING"],
      default: "WORKING",
    },

    pollingStarted: {
      type: Boolean,
      default: false,
    },

    pollingStartTime: {
      type: Date,
      default: null,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    currentLocation: {
      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },
    },

    // Time-stamped log of every update made by the coordinator during election day
    updateHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        action: { type: String, default: "" }, // e.g. "CHECK_IN", "EVM_UPDATE", "POLLING_STARTED", "REMARKS_UPDATE"
        evmStatus: { type: String, default: null },
        pollingStarted: { type: Boolean, default: null },
        remarks: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

coordinatorActivitySchema.index(
  {
    coordinatorId: 1,
    electionId: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "CoordinatorActivity",
  coordinatorActivitySchema
);