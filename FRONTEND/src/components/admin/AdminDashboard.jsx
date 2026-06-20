import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import './AdminDashboard.css'; // Will create this basic styling file

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [usersData, groupsData, tasksData] = await Promise.all([
                adminService.getAllUsers(),
                adminService.getAllGroups(),
                adminService.getAllTasks()
            ]);
            setUsers(usersData);
            setGroups(groupsData);
            setTasks(tasksData.tasks || []);
        } catch (err) {
            setError(err.response?.data?.msg || err.message || 'Failed to fetch admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await adminService.deleteUser(id);
            setUsers(users.filter(u => u._id !== id));
        } catch (err) {
            alert("Failed to delete user");
        }
    };

    const handleDeleteGroup = async (id) => {
        if (!window.confirm("Are you sure you want to delete this group?")) return;
        try {
            await adminService.deleteGroup(id);
            setGroups(groups.filter(g => g._id !== id));
        } catch (err) {
            alert("Failed to delete group");
        }
    };

    const handleDeleteTask = async (id) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        try {
            await adminService.deleteTask(id);
            setTasks(tasks.filter(t => t._id !== id));
        } catch (err) {
            alert("Failed to delete task");
        }
    };

    if (loading) return <div className="admin-loading">Loading Admin Console...</div>;
    if (error) return <div className="admin-error">Error: {error}</div>;

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <h1>Admin Console</h1>
                <div className="admin-tabs">
                    <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Users ({users.length})</button>
                    <button className={activeTab === 'groups' ? 'active' : ''} onClick={() => setActiveTab('groups')}>Groups ({groups.length})</button>
                    <button className={activeTab === 'tasks' ? 'active' : ''} onClick={() => setActiveTab('tasks')}>Tasks ({tasks.length})</button>
                </div>
            </header>

            <main className="admin-content">
                {activeTab === 'users' && (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id}>
                                    <td>{u.name}</td>
                                    <td>{u.email}</td>
                                    <td>{u.role}</td>
                                    <td>
                                        <button className="btn-delete" onClick={() => handleDeleteUser(u._id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'groups' && (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Group Name</th>
                                <th>User (Owner)</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map(g => (
                                <tr key={g._id}>
                                    <td>{g.name}</td>
                                    <td>{g.user?.name || g.user || 'Unknown'}</td>
                                    <td>
                                        <button className="btn-delete" onClick={() => handleDeleteGroup(g._id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'tasks' && (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Task Name</th>
                                <th>Group</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(t => (
                                <tr key={t._id}>
                                    <td>{t.name}</td>
                                    <td>{t.groupId?.name || t.groupId || 'Unknown'}</td>
                                    <td>{t.completed ? 'Completed' : 'Pending'}</td>
                                    <td>
                                        <button className="btn-delete" onClick={() => handleDeleteTask(t._id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
