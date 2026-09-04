const mongoose = require("mongoose");

const boothSchema = new mongoose.Schema(
  {
    boothNumber: {
      type: String,
      required: true,
      trim: true,
    },

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

    state: {
      type: String,
      required: true,
      trim: true,
    },

    district: {
      type: String,
      required: true,
      trim: true,
    },

    constituency: {
      type: String,
      required: true,
      trim: true,
    },

    pollingStationName: {
      type: String,
      required: true,
      trim: true,
    },

    assignedCoordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedSectorOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    location: {
  latitude: {
    type: Number,
    default: null,
  },
  longitude: {
    type: Number,
    default: null,
  },
},
totalRegisteredVoters: {
    type: Number,
    required: true,
     min: 0,
},

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

boothSchema.index(
  {
    boothNumber: 1,
    electionId: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Booth", boothSchema);