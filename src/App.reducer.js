import React, { useReducer, useCallback, useState, useEffect } from 'react';

import TodoTemplate from './components/TodoTemplate';
import TodoInsert from './components/TodoInsert';
import TodoList from './components/TodoList';
import TodoEdit from './components/TodoEdit';
import SignUpTemplate from './components/SignUpTemplate';
import LoginInputTemplate from './components/LoginInputTemplate';
import './App.css';
import firebase from './firebase';

const todo_db = firebase.database().ref('todolist');

const init = {
  userInfo: null,
  todos: [],
};

function appReducer(state = init, action) {
  switch (action.type) {
    case 'LOAD_TODO_LIST': {
      //데이터 불러오기
      return {
        ...state,
        todos: action.todoList,
      };
    }
    case 'LOGIN': //로그인
      return {
        ...state,
        userInfo: { userId: action.userId },
      };
    case 'LOGOUT': //로그아웃
      return {
        ...state,
        userInfo: null,
      };
    case 'INSERT': //추가
      return {
        ...state,
        todos: state.todos.concat(action.todo),
      };
    case 'REMOVE': // 제거
      return {
        ...state,
        todos: state.todos.filter((todo) => todo.id !== action.id),
      };
    case 'TOGGLE': // 토글
      return {
        ...state,
        todos: state.todos.map((todo) =>
          todo.id === action.id ? { ...todo, checked: !todo.checked } : todo,
        ),
      };
    case 'EDIT': // 수정
      return {
        ...state,
        todos: state.todos.map((todo) =>
          todo.id === action.id ? { ...todo, text: action.editText } : todo,
        ),
      };
    default:
      return state;
  }
}

const App = () => {
  const [state, dispatch] = useReducer(appReducer, init);
  const [editMode, setEditMode] = useState(false);
  const [loginMode, setLoginMode] = useState(false);
  const [signUpMode, setSignUpMode] = useState(false);
  const [initTodo, setInitTodo] = useState('');

  useEffect(() => {
    todo_db.on('value', async (snapshot) => {
      const todoData = await snapshot.val();
      const todoList = [];
      for (let id in todoData) {
        todoList.push({ id, ...todoData[id] });
      }
      dispatch({ type: 'LOAD_TODO_LIST', todoList });
    });
  }, []);

  const onLogin = useCallback((userId) => {
    dispatch({ type: 'LOGIN', userId });
  }, []);

  const onLogout = useCallback((userId) => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  const onInsert = useCallback((todo) => {
    dispatch({ type: 'INSERT', todo });
  }, []);

  const onRemove = useCallback(
    (id, userId) => {
      if (!state.userInfo || userId !== state.userInfo?.userId) {
        alert('본인의 투두 리스트만 삭제 가능합니다.');
        return;
      }
      todo_db
        .orderByChild('id')
        .equalTo(id)
        .once('value', (snapshot) => {
          snapshot.forEach((childSnapshot) => {
            let nodeKey = childSnapshot.key;
            todo_db.child(nodeKey).remove();
          });
        });

      dispatch({ type: 'REMOVE', id });
    },
    [state.userInfo],
  );

  const onToggle = useCallback(async (id) => {
    await dispatch({ type: 'TOGGLE', id });
  }, []);

  const onEdit = useCallback((id, editText) => {
    dispatch({ type: 'EDIT', id, editText });
  }, []);

  const onClickEdit = useCallback(
    (todoOne, userId) => {
      if (!state.userInfo || userId !== state.userInfo?.userId) {
        alert('본인의 투두 리스트만 변경 가능합니다.');
        return;
      }
      setEditMode((pre) => !pre);
      setInitTodo(todoOne);
    },
    [state.userInfo],
  );

  const onClickLogin = useCallback(() => {
    setLoginMode((pre) => !pre);
  }, []);
  const onClickSignUp = useCallback(() => {
    setSignUpMode((pre) => !pre);
  }, []);

  return (
    <>
      <div className="loginTemplate">
        <button className="loginButton" onClick={onClickSignUp}>
          회원가입
        </button>
        {state.userInfo ? (
          <button className="loginButton" onClick={onLogout}>
            로그아웃
          </button>
        ) : (
          <button className="loginButton" onClick={onClickLogin}>
            로그인
          </button>
        )}

        {signUpMode ? <SignUpTemplate setSignUpMode={setSignUpMode} /> : <></>}
        {loginMode ? (
          <LoginInputTemplate onLogin={onLogin} setLoginMode={setLoginMode} />
        ) : (
          <></>
        )}
      </div>
      <TodoTemplate>
        {editMode ? (
          <TodoEdit
            onEdit={onEdit}
            setEditMode={setEditMode}
            initTodo={initTodo}
          />
        ) : (
          <TodoInsert onInsert={onInsert} userInfo={state?.userInfo} />
        )}

        <TodoList
          userInfo={state.userInfo}
          todos={state.todos}
          onRemove={onRemove}
          onClickEdit={onClickEdit}
          onToggle={onToggle}
        />
      </TodoTemplate>
    </>
  );
};

export default App;
