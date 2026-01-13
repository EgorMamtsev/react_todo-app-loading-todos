import React, { useState } from 'react';

type Props = {
  onAdd: (title: string) => Promise<unknown> | void;
  allCompleted: boolean;
  onToggleAll: () => void;
  isAdding?: boolean;
};

export const Header: React.FC<Props> = ({
  onAdd,
  allCompleted,
  onToggleAll,
  isAdding = false,
}) => {
  const [todo, setTodo] = useState('');

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!todo.trim()) {
      return;
    }

    const p = onAdd(todo);

    if (p && typeof (p as Promise<unknown>).then === 'function') {
      (p as Promise<unknown>).then(() => setTodo('')).catch(() => {});
    } else {
      setTodo('');
    }
  };

  return (
    <header className="todoapp__header">
      <button
        type="button"
        className={`todoapp__toggle-all ${allCompleted ? 'active' : ''}`}
        data-cy="ToggleAllButton"
        onClick={onToggleAll}
        aria-label="Toggle all todos"
        disabled={isAdding}
      />

      <form onSubmit={onSubmit}>
        <input
          data-cy="NewTodoField"
          type="text"
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          value={todo}
          onChange={event => setTodo(event.target.value)}
          disabled={isAdding}
        />
      </form>
    </header>
  );
};
