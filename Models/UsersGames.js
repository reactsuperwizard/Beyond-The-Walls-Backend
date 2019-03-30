/**
 * Created by cbl102 on 26/12/16.
 */
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var Config = require("../Config");

var logs = new Schema({
  ChallengeId: { type: Schema.ObjectId, ref: "Challenges" },
  video: { type: String, default: "" },
  userId: { type: Schema.ObjectId, ref: "User" },
  startDate: { type: Date, default: Date.now }
});

var UsersGames = new Schema({
  gameId: { type: Schema.ObjectId, ref: "Games" },
  challengeId: [{ type: Schema.ObjectId, ref: "Challenges" }],
  lastChallenge: [{ type: Schema.ObjectId, ref: "Challenges" }],
  easyHintChallengesId: [{ type: Schema.ObjectId, ref: "Challenges" }],
  hardHintChallengesId: [{ type: Schema.ObjectId, ref: "Challenges" }],
  toughHintChallengesId: [{ type: Schema.ObjectId, ref: "Challenges" }],
  createBy: { type: Schema.ObjectId, ref: "User" },
  member: [{ type: Schema.ObjectId, ref: "User" }],
  name: { type: String, required: true },
  easyHintOpen: { type: Boolean, default: false, required: true },
  hardHintOpen: { type: Boolean, default: false, required: true },
  toughHintOpen: { type: Boolean, default: false, required: true },
  pause: { type: Boolean, default: false, required: true },
  timerGame: { type: Boolean, default: false, required: true },
  takeTime: { type: Number, required: true, default: 0 },
  gameTime: { type: Number, required: true, default: 0 },
  type: { type: String, default: "Solo" },
  logs: [logs],
  gameStartTime: { type: Number, required: true, default: 0 },
  startTime: { type: Number, required: true, default: 0 },
  gameEndTime: { type: Number, required: true, default: 0 },
  totalPoints: { type: Number, required: true, default: 0 },
  teamImage: {
    original: { type: String, default: "" },
    thumbnail: { type: String, default: "" }
  },
  createdAt: { type: Date, default: Date.now },
  is_delete: { type: Boolean, default: false, required: true },
  completeGame: { type: Boolean, default: false },
  timerStart: { type: Boolean, default: false },
  usedTime: { type: Number, required: true, default: 0 },
  easyUsed: { type: Boolean, default: false },
  hardUsed: { type: Boolean, default: false },
  tootoughUsed: { type: Boolean, default: false }
});
module.exports = mongoose.model("UsersGames", UsersGames);
