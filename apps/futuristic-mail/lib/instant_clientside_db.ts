import { init } from "@instantdb/react";

const db = init({
    appId: "b6c62e9f-d6c9-4722-9242-6263312dd44d", devtool: {
        position: 'bottom-left',
    }
});

export default db;