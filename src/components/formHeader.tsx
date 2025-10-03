import React, { useState } from 'react';

type Props = {
  onAdd: (title: string) => void;
};

export const Header: React.FC<Props> = ({ onAdd }) => {
  const [todo, setTodo] = useState('');

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (todo.trim()) {
      onAdd(todo);
      setTodo('');
    }
  };

  return (
    <header className="todoapp__header">
      {/* this button should have `active` class only if all todos are completed */}
      <button
        type="button"
        className="todoapp__toggle-all active"
        data-cy="ToggleAllButton"
      />

      {/* Add a todo on form submit */}
      <form onSubmit={onSubmit}>
        <input
          data-cy="NewTodoField"
          type="text"
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          value={todo}
          onChange={event => {
            setTodo(event.target.value);
          }}
        />
      </form>
    </header>
  );
};
