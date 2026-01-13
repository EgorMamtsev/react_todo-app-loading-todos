/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState, useRef } from 'react';
import { UserWarning } from './UserWarning';
import {
  getTodos,
  addTodo,
  USER_ID,
  deleteTodo,
  updateTodo,
} from './api/todos';
import { Todo } from './types/Todo';
import { Header } from './components/formHeader';
import { FormBody } from './components/formBody';
import { FormFooter } from './components/formFooter';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const remainingCount = todos.filter(t => !t.completed).length;
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const allCompleted = todos.length > 0 && todos.every(t => t.completed);
  const [error, setError] = useState<string | null>(null);
  const errorTimeoutRef = useRef<number | null>(null);
  const [appliedFilter, setAppliedFilter] = useState(filter);
  const filterTimeoutRef = useRef<number | null>(null);

  const showError = (message: string) => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    setError(message);
    errorTimeoutRef.current = window.setTimeout(() => {
      setError(null);
      errorTimeoutRef.current = null;
    }, 3000);
  };

  const hideError = () => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    setError(null);
  };

  const handleFilterChange = (f: 'all' | 'active' | 'completed') => {
    hideError?.();
    setFilter(f);
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
      filterTimeoutRef.current = null;
    }

    filterTimeoutRef.current = window.setTimeout(() => {
      setAppliedFilter(f);
      filterTimeoutRef.current = null;
    }, 150);
  };

  const handleToggleAll = () => {
    const next = !allCompleted;

    setLoadingId(-1);

    return Promise.all(todos.map(t => updateTodo(t.id, { completed: next })))
      .then(updated => {
        setTodos(prev =>
          prev.map(todo => {
            const upd = updated.find(u => u.id === todo.id);

            return upd ? { ...todo, completed: upd.completed } : todo;
          }),
        );
        setLoadingId(null);
      })
      .catch(err => {
        setLoadingId(null);

        return Promise.reject(err);
      });
  };

  const filteredTodos = todos.filter(todo => {
    if (appliedFilter === 'active') {
      return !todo.completed;
    }

    if (appliedFilter === 'completed') {
      return todo.completed;
    }

    return true;
  });
  const hasCompleted = todos.some(t => t.completed);
  const handleClearCompleted = () => {
    const completedTodos = todos.filter(t => t.completed);

    if (completedTodos.length === 0) {
      return Promise.resolve();
    }

    setLoadingId(-1);

    return Promise.all(completedTodos.map(t => deleteTodo(t.id)))
      .then(() => {
        setTodos(prev => prev.filter(todo => !todo.completed));
        setLoadingId(null);
      })
      .catch(() => {
        setLoadingId(null);

        return Promise.reject();
      });
  };

  useEffect(() => {
    getTodos()
      .then(data => setTodos(data))
      .catch(() => showError('Unable to load todos'));
  }, []);

  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
        filterTimeoutRef.current = null;
      }
    };
  }, []);
  const handleAddTodo = (title: string) => {
    setLoadingId(-1);

    return addTodo(title, USER_ID)
      .then(newTodo => {
        setTodos(prev => [newTodo, ...prev]);
        setLoadingId(null);

        return newTodo;
      })
      .catch(err => {
        setLoadingId(null);

        return Promise.reject(err);
      });
  };

  const handleDeleteTodo = (id: number) => {
    setLoadingId(id);
    deleteTodo(id).then(() => {
      setTodos(prev => prev.filter(todo => todo.id !== id));
      setLoadingId(null);
    });
  };

  const onToggle = (id: number, completed: boolean) => {
    setLoadingId(id);
    updateTodo(id, { completed }).then(updatedTodo => {
      setTodos(prev =>
        prev.map(todo =>
          todo.id === id ? { ...todo, completed: updatedTodo.completed } : todo,
        ),
      );
      setLoadingId(null);
    });
  };

  const handleTitleChange = (id: number, title: string) => {
    setLoadingId(id);
    updateTodo(id, { title }).then(updatedTodo => {
      setTodos(prev =>
        prev.map(todo =>
          todo.id === id ? { ...todo, title: updatedTodo.title } : todo,
        ),
      );
      setLoadingId(null);
    });
  };

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          onAdd={handleAddTodo}
          allCompleted={allCompleted}
          onToggleAll={handleToggleAll}
          isAdding={loadingId === -1}
        />

        <FormBody
          todos={filteredTodos}
          onDelete={handleDeleteTodo}
          onToggle={onToggle}
          onUpdateTitle={handleTitleChange}
          loadingId={loadingId}
        />

        {todos.length > 0 && (
          <FormFooter
            remainingCount={remainingCount}
            filter={filter}
            onFilterChange={handleFilterChange}
            hasCompleted={hasCompleted}
            onClearCompleted={handleClearCompleted}
          />
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}

      <div
        data-cy="ErrorNotification"
        className={`notification is-danger is-light has-text-weight-normal ${error ? '' : 'hidden'}`}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={hideError}
        />
        Unable to load todos
        <br />
        Title should not be empty
        <br />
        Unable to add a todo
        <br />
        Unable to delete a todo
        <br />
        Unable to update a todo
      </div>
    </div>
  );
};
