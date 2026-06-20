import React, { useEffect, useState, useMemo, useCallback } from "react";
import { groupService, taskSERVICES } from "../../services/api";
const InputWithButton = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  buttonText,
  buttonClass = "bg-blue-600 hover:bg-blue-700",
  disabled = false,
}) => (
  <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="flex-1 px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none disabled:opacity-50"
    />
    <button
      className={`${buttonClass} text-white px-4 py-2 rounded w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed`}
      onClick={onSubmit}
      disabled={disabled || !value.trim()}
    >
      {buttonText}
    </button>
  </div>
);

const TaskManager = () => {
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoized groups data
  const groupsData = useMemo(() => groups?.data || [], [groups?.data]);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await groupService.getGroups();
      setGroups(result);
    } catch (err) {
      setError("Failed to fetch groups. Please try again.");
      console.error("Error fetching groups:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const showError = useCallback((message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  const handleDeleteGroup = useCallback(
    async (id) => {
      if (!window.confirm("Are you sure you want to delete this group?"))
        return;

      try {
        await groupService.deleteGroup(id);
        await fetchGroups();
      } catch (err) {
        console.error(err);
        showError("Failed to delete group. Please try again.");
      }
    },
    [fetchGroups, showError]
  );

  const handleUpdateGroup = useCallback(
    async (id, newName) => {
      if (!newName.trim()) return;

      try {
        await groupService.updateGroup(id, newName);
        await fetchGroups();
      } catch (err) {
        console.error(err);
        showError("Group with that name already exists or update failed.");
      }
    },
    [fetchGroups, showError]
  );

  const createGroup = useCallback(
    async (name) => {
      if (!name.trim()) return;

      try {
        await groupService.createGroups(name, false);
        await fetchGroups();
        setNewGroupName("");
      } catch (err) {
        console.error(err);
        showError("Group with that name already exists.");
      }
    },
    [fetchGroups, showError]
  );

  const handleCreateTask = useCallback(
    async (groupId, name) => {
      if (!name.trim()) return;

      try {
        await taskSERVICES.createTASK(groupId, name);
        await fetchGroups();
      } catch (err) {
        showError("Failed to create task. Please try again.", err);
      }
    },
    [fetchGroups, showError]
  );

  const handleDeleteTask = useCallback(
    async (groupId, taskId) => {
      try {
        await taskSERVICES.deleteTASK(groupId, taskId);
        await fetchGroups();
      } catch (err) {
        showError("Failed to delete task. Please try again.", err);
      }
    },
    [fetchGroups, showError]
  );

  const handleUpdateTask = useCallback(
    async (groupId, taskId, newName) => {
      if (!newName.trim()) return;

      try {
        await taskSERVICES.updateTASK(groupId, taskId, newName);
        await fetchGroups();
      } catch (err) {
        showError("Failed to update task. Please try again.", err);
      }
    },
    [fetchGroups, showError]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-10">Task Manager</h1>

      {error && (
        <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-600 text-white rounded-lg">
          {error}
        </div>
      )}

      <div className="max-w-2xl mx-auto mb-10">
        <InputWithButton
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onSubmit={() => createGroup(newGroupName)}
          placeholder="New group name"
          buttonText="Add Group"
          buttonClass="bg-green-600 hover:bg-green-700"
        />
      </div>

      {groupsData.length === 0 ? (
        <p className="text-gray-400 text-center text-lg">No groups available</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
          {groupsData.map((group) => (
            <GroupCard
              key={group._id}
              group={group}
              onDeleteGroup={handleDeleteGroup}
              onUpdateGroup={handleUpdateGroup}
              onCreateTask={handleCreateTask}
              onDeleteTask={handleDeleteTask}
              onUpdateTask={handleUpdateTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskManager;
