"use client";

import { id, i, init, InstaQLEntity } from "@instantdb/react";
import db from "@/lib/instant_clientside_db";
import { Todo } from "@/instant.schema";

function App() {
    // Authentication
    const { isLoading: authLoading, user, error: authError } = db.useAuth();

    // Read Data - only get todos for the current user
    const { isLoading, error, data } = db.useQuery(
        user
            ? {
                todos: {
                    $: {
                        where: {
                            author: user.id,
                        },
                    },
                },
            }
            : {}
    );

    if (authLoading) {
        return <div className="font-mono min-h-screen flex justify-center items-center">
            <div>Loading auth...</div>
        </div>;
    }

    if (!user) {
        return <AuthScreen />;
    }

    if (isLoading) {
        return <div className="font-mono min-h-screen flex justify-center items-center">
            <div>Loading todos...</div>
        </div>;
    }

    if (error) {
        return <div className="text-red-500 p-4">Error: {error.message}</div>;
    }

    const { todos = [] } = data;
    return (
        <div className="font-mono min-h-screen flex justify-center items-center flex-col space-y-4">
            <div className="flex flex-col items-center gap-4 mb-4">
                <h2 className="tracking-wide text-5xl text-gray-300">todos</h2>
                <div className="text-sm text-gray-500" onClick={() => console.log("user", user)}>
                    Welcome, {user.email}!
                    <button
                        className="ml-2 text-blue-500 hover:text-blue-700"
                        onClick={() => db.auth.signOut()}
                    >
                        Sign out
                    </button>
                </div>
            </div>
            <div className="border border-gray-300 max-w-xs w-full">
                <TodoForm todos={todos} user={user} />
                <TodoList todos={todos} />
                <ActionBar todos={todos} />
            </div>
            <div className="text-xs text-center">
                Open another tab to see todos update in realtime!
            </div>
        </div>
    );
}

// Authentication Screen
function AuthScreen() {
    return (
        <div className="font-mono min-h-screen flex justify-center items-center flex-col space-y-4">
            <h2 className="tracking-wide text-3xl text-gray-300 mb-8">Sign in to view your todos</h2>
            <AuthForm />
        </div>
    );
}

function AuthForm() {
    return (
        <div className="border border-gray-300 p-6 max-w-sm w-full">
            <form
                className="space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    const email = e.currentTarget.email.value;
                    db.auth.sendMagicCode({ email });
                }}
            >
                <div>
                    <label className="block text-sm text-gray-400 mb-2">
                        Email
                    </label>
                    <input
                        className="w-full px-3 py-2 border border-gray-300 outline-none bg-transparent"
                        placeholder="Enter your email"
                        type="email"
                        name="email"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full py-2 px-4 border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                    Send Magic Code
                </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-300">
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const email = e.currentTarget.email.value;
                        const code = e.currentTarget.code.value;
                        db.auth.signInWithMagicCode({ email, code });
                    }}
                >
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Email
                        </label>
                        <input
                            className="w-full px-3 py-2 border border-gray-300 outline-none bg-transparent"
                            placeholder="Enter your email"
                            type="email"
                            name="email"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Magic Code
                        </label>
                        <input
                            className="w-full px-3 py-2 border border-gray-300 outline-none bg-transparent"
                            placeholder="Enter the code from your email"
                            type="text"
                            name="code"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 px-4 border border-gray-300 hover:bg-gray-100 transition-colors"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}

// Write Data
// ---------
function addTodo(text: string, userId: string) {
    db.transact(
        db.tx.todos[id()].update({
            text,
            done: false,
            createdAt: Date.now(),
        }).link({ author: userId })
    );
}

function deleteTodo(todo: Todo) {
    db.transact(db.tx.todos[todo.id].delete());
}

function toggleDone(todo: Todo) {
    db.transact(db.tx.todos[todo.id].update({ done: !todo.done }));
}

function deleteCompleted(todos: Todo[]) {
    const completed = todos.filter((todo) => todo.done);
    const txs = completed.map((todo) => db.tx.todos[todo.id].delete());
    db.transact(txs);
}

function toggleAll(todos: Todo[]) {
    const newVal = !todos.every((todo) => todo.done);
    db.transact(
        todos.map((todo) => db.tx.todos[todo.id].update({ done: newVal }))
    );
}


// Components
// ----------
function ChevronDownIcon() {
    return (
        <svg viewBox="0 0 20 20">
            <path
                d="M5 8 L10 13 L15 8"
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
            />
        </svg>
    );
}

function TodoForm({ todos, user }: { todos: Todo[]; user: any }) {
    return (
        <div className="flex items-center h-10 border-b border-gray-300">
            <button
                className="h-full px-2 border-r border-gray-300 flex items-center justify-center"
                onClick={() => toggleAll(todos)}
            >
                <div className="w-5 h-5">
                    <ChevronDownIcon />
                </div>
            </button>
            <form
                className="flex-1 h-full"
                onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.input as HTMLInputElement;
                    addTodo(input.value, user.id);
                    input.value = "";
                }}
            >
                <input
                    className="w-full h-full px-2 outline-none bg-transparent"
                    autoFocus
                    placeholder="What needs to be done?"
                    type="text"
                    name="input"
                />
            </form>
        </div>
    );
}

function TodoList({ todos }: { todos: Todo[] }) {
    return (
        <div className="divide-y divide-gray-300">
            {todos.map((todo) => (
                <div key={todo.id} className="flex items-center h-10">
                    <div className="h-full px-2 flex items-center justify-center">
                        <div className="w-5 h-5 flex items-center justify-center">
                            <input
                                type="checkbox"
                                className="cursor-pointer"
                                checked={todo.done}
                                onChange={() => toggleDone(todo)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 px-2 overflow-hidden flex items-center">
                        {todo.done ? (
                            <span className="line-through">{todo.text}</span>
                        ) : (
                            <span>{todo.text}</span>
                        )}
                    </div>
                    <button
                        className="h-full px-2 flex items-center justify-center text-gray-300 hover:text-gray-500"
                        onClick={() => deleteTodo(todo)}
                    >
                        X
                    </button>
                </div>
            ))}
        </div>
    );
}

function ActionBar({ todos }: { todos: Todo[] }) {
    return (
        <div className="flex justify-between items-center h-10 px-2 text-xs border-t border-gray-300">
            <div>Remaining todos: {todos.filter((todo) => !todo.done).length}</div>
            <button
                className=" text-gray-300 hover:text-gray-500"
                onClick={() => deleteCompleted(todos)}
            >
                Delete Completed
            </button>
        </div>
    );
}

export default App;