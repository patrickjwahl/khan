'use client'

import { FormEventHandler, useState } from "react";

export default function Login() {

    const [ email, setEmail ] = useState('');
    const [ password, setPassword ] = useState('');

    const submitClicked: FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        
        console.log(data.code);
    };

    return (
        <main>
            <form onSubmit={submitClicked}>
                <input placeholder="Email" type='text' value={email} onChange={e => setEmail(e.target.value)} />
                <input placeholder="Password" type='password' value={password} onChange={e => setPassword(e.target.value)} />
                <input type='submit' value="Log In" />
            </form>
        </main>
    );
}