import { taskSERVICES } from "../../../services/api";
const createTask = async (data, state) => {
    await taskSERVICES.createTASK(data, state);
}

const updateTask = async (data) => {
    await taskSERVICES.updateTASK(data)
}

const deleteTask = async () => {
    await taskSERVICES.deleteTASK()
}
export default { createTask, updateTask, deleteTask }