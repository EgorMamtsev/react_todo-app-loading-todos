/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    getTodos().then(data => setTodos(data));
  }, []);

  const handleAddTodo = (title: string) => {
    addTodo(title, USER_ID).then(newTodo => {
      setTodos(prev => [newTodo, ...prev]);
      setLoadingId(null);
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
        <Header onAdd={handleAddTodo} />

        <FormBody
          todos={todos}
          onDelete={handleDeleteTodo}
          onToggle={onToggle}
          onUpdateTitle={handleTitleChange}
          loadingId={loadingId}
        />

        {/* Hide the footer if there are no todos */}
        <FormFooter />
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      {/*
      <div
        data-cy="ErrorNotification"
        className="notification is-danger is-light has-text-weight-normal"
      >
        <button data-cy="HideErrorButton" type="button" className="delete" />
        Unable to load todos
        <br />
        Title should not be empty
        <br />
        Unable to add a todo
        <br />
        Unable to delete a todo
        <br />
        Unable to update a todo
      </div> */}
    </div>
  );
};
