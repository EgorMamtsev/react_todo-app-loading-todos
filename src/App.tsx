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

// Головний компонент програми, що керує станом списку todo
// Містить логіку завантаження, додавання, видалення, фільтрації і повідомлень про помилки
export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const remainingCount = todos.filter(t => t.id !== -1 && !t.completed).length;
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const allCompleted = todos.length > 0 && todos.every(t => t.completed);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingTodos, setIsLoadingTodos] = useState(true);
  const errorTimeoutRef = useRef<number | null>(null);
  const [appliedFilter, setAppliedFilter] = useState(filter);
  const filterTimeoutRef = useRef<number | null>(null);

  // Показати повідомлення про помилку на 3 секунди
  // message: текст повідомлення, що показується в нотифікації
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

  // Сховати повідомлення про помилку негайно
  const hideError = () => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    setError(null);
  };

  // Обробник зміни фільтра з невеликою затримкою (дебаунс), щоб уникнути частих ререндерів
  // Викликає `setAppliedFilter` після затримки 150мс
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

  // Перемикає стан "всі виконані / не виконані" для всіх todo
  // Виконує PATCH-запити лише для тих записів, у яких зміниться значення completed
  const handleToggleAll = () => {
    const next = !allCompleted;

    const toUpdate = todos.filter(t => t.completed !== next);

    if (toUpdate.length === 0) {
      return Promise.resolve([]);
    }

    setLoadingId(-1);

    return Promise.all(toUpdate.map(t => updateTodo(t.id, { completed: next })))
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
        setTimeout(() => showError('Unable to update a todo'), 0);

        return Promise.reject(err);
      });
  };

  const focusInputRef = React.useRef<(() => void) | null>(null);

  // Реєструє колбек для фокусування поля вводу (викликається дочірніми компонентами)
  // Використовується щоб після операцій (видалення/очищення) фокус повертати в поле вводу
  const registerFocus = (fn: () => void) => {
    focusInputRef.current = fn;
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

  // Видаляє всі виконані todos групово.
  // Використовує Promise.allSettled щоб частково успішні видалення не зупиняли процес,
  // і повідомляє про помилку, якщо хоча б одна операція не вдалася.
  const handleClearCompleted = () => {
    const completedTodos = todos.filter(t => t.completed);

    if (completedTodos.length === 0) {
      return Promise.resolve();
    }

    setLoadingId(-1);

    return Promise.allSettled(
      completedTodos.map(t => deleteTodo(t.id).then(() => t.id)),
    )
      .then(results => {
        const succeededIds: number[] = [];
        let hasFailed = false;

        results.forEach(r => {
          if (r.status === 'fulfilled') {
            succeededIds.push(r.value as number);
          } else {
            hasFailed = true;
          }
        });

        if (succeededIds.length > 0) {
          setTodos(prev =>
            prev.filter(todo => !succeededIds.includes(todo.id)),
          );
        }

        setLoadingId(null);

        // focus the input after clearing completed todos
        setTimeout(() => focusInputRef.current?.(), 0);

        if (hasFailed) {
          setTimeout(() => showError('Unable to delete a todo'), 0);

          return Promise.reject();
        }

        return Promise.resolve();
      })
      .catch(() => {
        setLoadingId(null);
        setTimeout(() => showError('Unable to delete a todo'), 0);

        return Promise.reject();
      });
  };

  // Початкове завантаження todos при маунті компонента
  // У випадку помилки показує повідомлення через showError
  useEffect(() => {
    getTodos()
      .then(data => setTodos(data))
      .catch(() => showError('Unable to load todos'))
      .finally(() => setIsLoadingTodos(false));
  }, []);

  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
        filterTimeoutRef.current = null;
      }
    };
  }, []);
  // Додає новий todo: оптимістично додає тимчасовий запис, потім замінює його на відповідь сервера
  // Повертає проміс з доданим todo або відхиляє в разі помилки
  const handleAddTodo = (title: string) => {
    const trimmed = title.trim();

    setLoadingId(-1);

    // create a temporary todo with a stable clientId appended to the list
    const clientId = `temp-${Math.random().toString(36).slice(2)}`;
    const temp = {
      id: -1,
      clientId,
      userId: USER_ID as number,
      title: trimmed,
      completed: false,
    } as Todo;

    setTodos(prev => [...prev, temp]);

    return addTodo(trimmed, USER_ID)
      .then(newTodo => {
        setTodos(prev =>
          prev.map(t =>
            t.clientId === clientId ? { ...t, ...newTodo, id: newTodo.id } : t,
          ),
        );
        setLoadingId(null);

        return newTodo;
      })
      .catch(err => {
        // remove temp todo
        setTodos(prev => prev.filter(t => t.id !== -1));
        setLoadingId(null);
        showError('Unable to add a todo');

        return Promise.reject(err);
      });
  };

  // Видаляє todo за id, показує індикатор завантаження та фокусує поле вводу по завершенню
  const handleDeleteTodo = (id: number) => {
    setLoadingId(id);
    deleteTodo(id)
      .then(() => {
        setTodos(prev => prev.filter(todo => todo.id !== id));
        setLoadingId(null);
        setTimeout(() => focusInputRef.current?.(), 0);
      })
      .catch(() => {
        setLoadingId(null);
        showError('Unable to delete a todo');
      });
  };

  // Оновлює стан completed для одного todo
  // Відправляє PATCH-запит і оновлює локальний стан по відповіді
  const onToggle = (id: number, completed: boolean) => {
    setLoadingId(id);
    updateTodo(id, { completed })
      .then(updatedTodo => {
        setTodos(prev =>
          prev.map(todo =>
            todo.id === id
              ? { ...todo, completed: updatedTodo.completed }
              : todo,
          ),
        );
        setLoadingId(null);
      })
      .catch(() => {
        setLoadingId(null);
        setTimeout(() => showError('Unable to update a todo'), 0);
      });
  };

  // Оновлює заголовок todo (редагування). Викликається з `TodoItem`.
  const handleTitleChange = (id: number, title: string) => {
    setLoadingId(id);
    updateTodo(id, { title })
      .then(updatedTodo => {
        setTodos(prev =>
          prev.map(todo =>
            todo.id === id ? { ...todo, title: updatedTodo.title } : todo,
          ),
        );
        setLoadingId(null);
      })
      .catch(() => {
        setLoadingId(null);
        setTimeout(() => showError('Unable to update a todo'), 0);
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
          onInvalid={() => showError('Title should not be empty')}
          registerFocus={registerFocus}
          showToggleAll={!isLoadingTodos && todos.length > 0}
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
        {error}
      </div>
    </div>
  );
};
