'use client'

import { User } from '@prisma/client';
import styles from '../Profile.module.scss';
import { FormEventHandler, useState } from 'react';

export default function FriendsContent({ friends }: { friends: User[] }) {

    const [ friendToAdd, setFriendToAdd ] = useState('');
    const [ addFriendError, setAddFriendError ] = useState(false);

    const handleAddFriend: FormEventHandler = async e => {
        e.preventDefault();

        const payload = {
            username: friendToAdd
        };

        const res = await fetch(`/api/friend`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();

        if (data.code === 'NO_SUCH_USER') {
            setAddFriendError(true);
            return;
        }

        location.reload();
    };

    return (
        <div className={styles.friendsContainer}>
            <div className={styles.addFriendContainer}>
                <h5>Add a friend:</h5>
                <form onSubmit={handleAddFriend}>
                    <input type="text" placeholder="Username or email" value={friendToAdd} onChange={e => setFriendToAdd(e.target.value)} />
                    <input type="submit" value="ADD FRIEND" />
                </form>
                {addFriendError && <div>That user doesn't exist!</div>}
            </div>
            
        </div>
    );
}