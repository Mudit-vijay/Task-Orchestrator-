import { groupService } from "../../../services/api"

const createGroup = async (data) => {
    await groupService.createGroups(data);
}

const updateGroup = async (data) => {
    await groupService.updateGroup(data);
}

const deleteGroup = async () => {
    await groupService.deleteGroup();
}

export default { createGroup, updateGroup, deleteGroup }