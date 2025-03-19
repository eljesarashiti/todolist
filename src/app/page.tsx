"use client";

import { useStore } from "@/lib/store";
import { trpc } from "@/lib/trpc";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaUser, FaHome, FaLaptop, FaSun, FaMoon } from 'react-icons/fa';

export default function Home() {
  const { tasks, setTasks, isAuthenticated, logout } = useStore();
  const router = useRouter();
  const [filter, setFilter] = useState<string>('All');
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false); 

  useEffect(() => {
    const storedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(storedDarkMode);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const { refetch, error, isLoading } = trpc.task.getAll.useQuery(undefined, {
    onSuccess: (data) => {
      setTasks(data);
    },
    enabled: isAuthenticated,
  });

  const createTask = trpc.task.create.useMutation({ onSuccess: () => refetch() });
  const updateTask = trpc.task.update.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (err) => console.error('Update error:', err),
  });
  const deleteTask = trpc.task.delete.useMutation({ onSuccess: () => refetch() });
  const deleteCompleted = trpc.task.deleteCompleted.useMutation({ onSuccess: () => refetch() });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;
    const dueDate = formData.get("dueDate") as string;
    const category = formData.get("category") as string;
    
    createTask.mutate({ 
      title, 
      description, 
      priority, 
      dueDate: dueDate || undefined,
      category,
    });
    e.currentTarget.reset();
  };

  const handleTaskToggle = (task: typeof tasks[0]) => {
    updateTask.mutate({ 
      ...task, 
      completed: !task.completed,
      dueDate: task.dueDate || undefined,
    });
  };

  const handleEditStart = (task: typeof tasks[0]) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditTitle(e.target.value);
  };

  const handleEditSubmit = (task: typeof tasks[0]) => {
    if (editTitle.trim()) {
      updateTask.mutate({ ...task, title: editTitle });
    }
    setEditingTaskId(null);
  };

  const handleEditCancel = () => {
    setEditingTaskId(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleClearCompleted = () => {
    deleteCompleted.mutate();
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const getCategoryIcon = (category: string | undefined) => {
    switch (category?.toLowerCase()) {
      case 'personal':
        return <FaUser className="category-icon personal" />;
      case 'home':
        return <FaHome className="category-icon home" />;
      case 'work':
        return <FaLaptop className="category-icon work" />;
      default:
        return <FaUser className="category-icon personal" />;
    }
  };

  const formatDueDate = (dueDate: string) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const taskDate = new Date(dueDate);
    
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (taskDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return taskDate.toLocaleDateString();
    }
  };

  const isOverdue = (dueDate: string) => {
    const today = new Date();
    const taskDate = new Date(dueDate);
    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() < today.getTime();
  };

  if (!isAuthenticated) {
    return <div className="loading">Redirecting to login...</div>;
  }

  if (isLoading) {
    return <div className="loading">Loading tasks...</div>;
  }

  if (error) {
    return <div className="error-state">Error loading tasks: {error.message}</div>;
  }

  const filteredActiveTasks = tasks
    .filter((task) => !task.completed)
    .filter((task) => filter === 'All' || task.category === filter)
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  const completedTasks = tasks.filter((task) => task.completed);

  return (
    <div className="todo-container">
      <div className="todo-content">
        <div className="todo-header">
          <h1>To-Do List</h1>
          <div className="header-buttons">
            <button className="theme-toggle-btn" onClick={toggleDarkMode}>
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="todo-form">
          <input name="title" placeholder="Task Title" required />
          <input name="description" placeholder="Description (optional)" />
          <select name="priority" defaultValue="Medium" className="priority-select">
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <input
            type="date"
            name="dueDate"
            className="due-date-input"
            min={new Date().toISOString().split('T')[0]}
          />
          <select name="category" defaultValue="Personal" className="category-select">
            <option value="Personal">Personal</option>
            <option value="Home">Home</option>
            <option value="Work">Work</option>
          </select>
          <button type="submit" disabled={createTask.isLoading} className="add-task-btn">
            {createTask.isLoading ? 'Adding...' : 'Add Task'}
          </button>            
        </form>
        <div className="todo-actions">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'All' ? 'active' : ''}`}
              onClick={() => setFilter('All')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'Personal' ? 'active' : ''}`}
              onClick={() => setFilter('Personal')}
            >
              Personal
            </button>
            <button
              className={`filter-btn ${filter === 'Home' ? 'active' : ''}`}
              onClick={() => setFilter('Home')}
            >
              Home
            </button>
            <button
              className={`filter-btn ${filter === 'Work' ? 'active' : ''}`}
              onClick={() => setFilter('Work')}
            >
              Work
            </button>
            <button className="clear-completed-btn" onClick={handleClearCompleted}>
            Clear Completed
          </button>
          </div>
        </div>
        <h2 className="section-title">Active Tasks ({filteredActiveTasks.length})</h2>
        {filteredActiveTasks.length === 0 ? (
          <p className="no-tasks">No active tasks</p>
        ) : (
          <ul className="todo-list">
            {filteredActiveTasks.map((task) => (
              <li key={task.id} className={`todo-item priority-${task.priority?.toLowerCase() || 'medium'}`}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleTaskToggle(task)}
                  disabled={updateTask.isLoading}
                />
                <div className="task-text">
                  {editingTaskId === task.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleEditSubmit(task);
                      }}
                      className="edit-form"
                    >
                      <input
                        value={editTitle}
                        onChange={handleEditChange}
                        onBlur={() => handleEditSubmit(task)}
                        autoFocus
                        className="edit-input"
                      />
                      <button type="button" onClick={handleEditCancel} className="cancel-edit-btn">
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <span
                      className={`title ${task.completed ? 'completed' : ''}`}
                      onClick={() => handleEditStart(task)}
                    >
                      {task.title}
                    </span>
                  )}
                  {task.description && <p className="description">{task.description}</p>}
                  <div className="task-meta">
                    <span className={`priority-icon priority-${task.priority?.toLowerCase() || 'medium'}`}></span>
                    {task.dueDate && (
                      <span className={`due-date ${isOverdue(task.dueDate) ? 'overdue' : ''}`}>
                       {formatDueDate(task.dueDate)}
                      </span>
                    )}
                    <div className={`category-wrapper ${task.category?.toLowerCase() || 'personal'}`}>
                      {getCategoryIcon(task.category ?? '')}
                      <span className="category-label">{task.category || 'Personal'}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteTask.mutate(task.id)} className="delete-btn">Delete</button>
              </li>
            ))}
          </ul>
        )}

        <h2 className="section-title">Completed Tasks ({completedTasks.length})</h2>
        {completedTasks.length === 0 ? (
          <p className="no-tasks">No completed tasks</p>
        ) : (
          <ul className="todo-list completed-list">
            {completedTasks.map((task) => (
              <li key={task.id} className={`todo-item priority-${task.priority?.toLowerCase() || 'medium'}`}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleTaskToggle(task)}
                  disabled={updateTask.isLoading}
                />
                <div className="task-text">
                  {editingTaskId === task.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleEditSubmit(task);
                      }}
                      className="edit-form"
                    >
                      <input
                        value={editTitle}
                        onChange={handleEditChange}
                        onBlur={() => handleEditSubmit(task)}
                        autoFocus
                        className="edit-input"
                      />
                      <button type="button" onClick={handleEditCancel} className="cancel-edit-btn">
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <span
                      className={`title ${task.completed ? 'completed' : ''}`}
                      onClick={() => handleEditStart(task)}
                    >
                      {task.title}
                    </span>
                  )}
                  {task.description && <p className="description">{task.description}</p>}
                  <div className="task-meta">
                    <span className={`priority-icon priority-${task.priority?.toLowerCase() || 'medium'}`}></span>
                    {task.dueDate && (
                      <span className="due-date">
                        {formatDueDate(task.dueDate)}
                      </span>
                    )}
                    <div className={`category-wrapper ${task.category?.toLowerCase() || 'personal'}`}>
                      {getCategoryIcon(task.category ?? '')}
                      <span className="category-label">{task.category || 'Personal'}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteTask.mutate(task.id)} className="delete-btn">Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}