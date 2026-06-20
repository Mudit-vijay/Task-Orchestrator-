import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "customer",
        required: true,
        index: true
    },
    workspaceType: {
        type: String,
        enum: ["Personal", "Team", "Project"],
        default: "Personal"
    },
    members: [{
        type: String, // Storing emails for collaboration
        trim: true
    }],
    parentGroupId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Group",
        required:false,
        index: true
    }
}, { timestamps: true });

const Group = mongoose.models.Group || mongoose.model("Group", GroupSchema);

export default Group;
