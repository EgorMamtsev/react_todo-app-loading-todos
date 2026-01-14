import { Todo } from '../types/Todo';
import { client } from '../utils/fetchClient';

// Ідентифікатор поточного користувача в тестовому середовищі
export const USER_ID = 3542;

// Отримати список todos для поточного користувача
export const getTodos = () => {
  return client.get<Todo[]>(`/todos?userId=${USER_ID}`);
};

// Додати новий todo (POST)
export const addTodo = (title: string, userId: number): Promise<Todo> => {
  return client.post('/todos', { title, userId, completed: false });
};

// Видалити todo за id (DELETE)
export const deleteTodo = (id: number) => {
  return client.delete(`/todos/${id}`);
};

// Часткове оновлення todo (PATCH)
export const updateTodo = (id: number, data: Partial<Todo>) => {
  return client.patch<Todo>(`/todos/${id}`, data);
};

export enum ErrorMessages {
  ADD_TODO = 'Unable to add a todo',
  DELETE_TODO = 'Unable to delete a todo',
  UPDATE_TODO = 'Unable to update a todo',
  LOAD_TODOS = 'Unable to load todos',
}
