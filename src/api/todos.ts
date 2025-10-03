import { Todo } from '../types/Todo';
import { client } from '../utils/fetchClient';

export const USER_ID = 3542;

export const getTodos = () => {
  return client.get<Todo[]>(`/todos?userId=${USER_ID}`);
};

export const addTodo = (title: string, userId: number): Promise<Todo> => {
  return client.post('/todos', { title, userId, completed: false });
};

export const deleteTodo = (id: number) => {
  return client.delete(`/todos/${id}`);
};

export const updateTodo = (id: number, data: Partial<Todo>) => {
  return client.patch<Todo>(`/todos/${id}`, data);
};
