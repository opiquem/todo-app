import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { createTodo, deleteTodo, getTodos, updateTodo } from './api/todos';
import { getFilteredTodos } from './helpers';
import { Todo } from './types/Todo';
import { TodoStatusFilter } from './types/TodoStatusFilter';

import { TodoError } from './components/TodoError/TodoError';
import { TodoFooter } from './components/TodoFooter/TodoFooter';
import { TodoHeader } from './components/TodoHeader/TodoHeader';
import { TodoList } from './components/TodoList/TodoList';

const USER_ID = 10884;

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [statusFilter, setStatusFilter] = useState(TodoStatusFilter.All);
  const [error, setError] = useState<string | null>(null);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [inputTitle, setInputTitle] = useState<string>('');
  const [isLoadingTodo, setIsLoading] = useState<number[]>([0]);

  useEffect(() => {
    getTodos(USER_ID)
      .then((todosFromServer) => {
        setTodos(todosFromServer);
      })
      .catch((errorFromServer) => {
        setError(errorFromServer.message);
      });
  }, []);

  useEffect(() => {
    let timerId: number;

    if (error) {
      timerId = window.setTimeout(() => {
        setError(null);
      }, 3000);
    }

    return () => clearTimeout(timerId);
  }, [error]);

  const visibleTodos = useMemo(() => {
    return getFilteredTodos(todos, statusFilter);
  }, [statusFilter, todos]);

  const selectStatusFilter = (status: TodoStatusFilter) => {
    setStatusFilter(status);
  };

  const addError = (errorText: string) => {
    setError(errorText);
  };

  const closeError = () => {
    setError(null);
  };

  const addTodo = useCallback(
    async (todoTitle: string) => {
      const newTodo = {
        userId: USER_ID,
        completed: false,
        title: todoTitle,
      };

      setTempTodo({ ...newTodo, id: 0 });

      try {
        const createdTodo = await createTodo(newTodo);

        setTodos((currentTodos) => [...currentTodos, createdTodo]);
      } catch {
        setError('Unable to add a todo');
      } finally {
        setTempTodo(null);
        setInputTitle('');
      }
    },
    [todos]
  );

  const removeTodo = useCallback(
    async (todoId: number) => {
      try {
        setIsLoading((currentTodoIds) => [...currentTodoIds, todoId]);
        await deleteTodo(todoId);
        setTodos((currentTodos) =>
          currentTodos.filter((todo) => todo.id !== todoId)
        );
      } catch {
        setError('Unable to delete a todo');
      } finally {
        setIsLoading((currentTodos) =>
          currentTodos.filter((id) => id !== todoId)
        );
      }
    },
    [isLoadingTodo]
  );

  const editTodo = useCallback(
    async (todoId: number, properties: Partial<Todo>) => {
      const dataToEdit = { ...properties };

      try {
        setIsLoading((currentTodoIds) => [...currentTodoIds, todoId]);
        await updateTodo(todoId, dataToEdit);
        setTodos((currentTodos) =>
          currentTodos.map((todo) => {
            if (todo.id !== todoId) {
              return todo;
            }

            return { ...todo, ...dataToEdit };
          })
        );
      } catch {
        setError('Unable to update a todo');
      } finally {
        setIsLoading((currentTodos) =>
          currentTodos.filter((id) => id !== todoId)
        );
      }
    },
    [isLoadingTodo]
  );

  const removeAllCompletedTodos = useCallback(() => {
    todos.forEach((todo) => {
      if (todo.completed) {
        removeTodo(todo.id);
      }
    });
  }, [todos]);

  const handleToggleCompletedToActive = () => {
    const areAllCompleted = todos.every((todo) => todo.completed);

    todos.forEach((todo) => {
      if (areAllCompleted) {
        editTodo(todo.id, { completed: false });
      } else if (!todo.completed) {
        editTodo(todo.id, { completed: true });
      }
    });
  };

  const onInputTodoTitle = useCallback((todoTitle: string) => {
    setInputTitle(todoTitle);
  }, []);

  const activeTodosCount = todos.filter((todo) => !todo.completed).length;
  const completedTodosCount = todos.filter((todo) => todo.completed).length;

  const isVisibleClearCompleted = completedTodosCount > 0;
  const isVisibleTodoList = todos.length > 0;
  const isVisibleToggleAllActive = todos.length > 0;

  const isActiveToggleAllActive = completedTodosCount === todos.length;

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <TodoHeader
          isActiveToggleAllActive={isActiveToggleAllActive}
          isVisibleToggleAllActive={isVisibleToggleAllActive}
          title={inputTitle}
          onInputTitle={onInputTodoTitle}
          onAddTodo={addTodo}
          onAddError={addError}
          handleToggleCompletedToActive={handleToggleCompletedToActive}
        />

        {isVisibleTodoList && (
          <>
            <TodoList
              todos={visibleTodos}
              tempTodo={tempTodo}
              isLoadingTodo={isLoadingTodo}
              onRemoveTodo={removeTodo}
              onEditTodo={editTodo}
            />

            <TodoFooter
              status={statusFilter}
              onSelectStatusFilter={selectStatusFilter}
              uncompletedTodosCount={activeTodosCount}
              isVisibleClearCompleted={isVisibleClearCompleted}
              onRemoveAllCompletedTodos={removeAllCompletedTodos}
            />
          </>
        )}
      </div>

      <TodoError error={error} onCloseError={closeError} />
    </div>
  );
};
