import app from "./app";
import { config } from "./config";

app.listen(config.port, () => {
    console.log(`🚀 DeskMate Core Engine running seamlessly on port ${config.port}`);
});