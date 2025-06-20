"use client";
import {
    useAuth,
    ClerkProvider,
    SignInButton,
    SignedIn,
    SignedOut,
} from "@clerk/clerk-react";
import { useEffect } from "react";
import db from "@/lib/instant_clientside_db";

export default function ClerkSignedInComponent() {
    const { getToken, signOut } = useAuth();

    const signInToInstantWithClerkToken = async () => {
        // getToken gets the jwt from Clerk for your signed in user.
        const idToken = await getToken();

        if (!idToken) {
            // No jwt, can't sign in to instant
            return;
        }

        // Create a long-lived session with Instant for your clerk user
        // It will look up the user by email or create a new user with
        // the email address in the session token.
        db.auth.signInWithIdToken({
            clientName: "clerk",
            idToken: idToken,
        });
    };

    useEffect(() => {
        signInToInstantWithClerkToken();
    }, []);

    const { isLoading, user, error } = db.useAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>Error signing in to Instant! {error.message}</div>;
    }
    if (user) {
        return (
            <div className="hidden">
                <p>Signed in with Instant through Clerk!</p>{" "}
                <button
                    onClick={() => {
                        // First sign out of Instant to clear the Instant session.
                        db.auth.signOut().then(() => {
                            // Then sign out of Clerk to clear the Clerk session.
                            signOut();
                        });
                    }}
                >
                    Sign out
                </button>
            </div>
        );
    }
    return (
        <div>
            <button onClick={signInToInstantWithClerkToken}>
                Sign in to Instant
            </button>
        </div>
    );
}